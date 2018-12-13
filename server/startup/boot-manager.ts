import {injectable, inject, multiInject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {Logger} from '../util/logging/logger';
import {Globals} from '../globals';
import {ServiceManager} from './service-manager';
import {URL} from 'url';

import * as async from 'async';
import {BaseDatabaseHelper} from '../util/database-helpers/interfaces/base-database-helper';

export interface BootManager {
  start(loopback: any, loopbackApplication: LoopBackApplication2, applicationFolder: string, startListening: boolean);
}

@injectable()
export class BootManagerImpl implements BootManager {
  private loopback: any;
  private app: LoopBackApplication2;
  private startListening: boolean;
  private allDataSources: any = [];
  private dataSourcesToAutoMigrate: any = [];

  constructor(@inject('Logger') private log: Logger,
              @inject('ServiceManager') private serviceManager: ServiceManager,
              @multiInject('BaseDatabaseHelper') private databaseHelpers: BaseDatabaseHelper[],
              @inject('IPostal') private postal: IPostal) {
    this.log.debug(`Creating ${this.constructor.name}`);
  }

  start(_loopback: any,
        _app: LoopBackApplication2,
        _applicationFolder: string,
        _startListening: boolean) {
    const me = this;
    me.loopback = _loopback;
    me.app = _app;
    me.startListening = _startListening;
    me.log.info(`Booting Amino3 using 'loopback-boot'`);
    me.bootLoopbackApp(me.app, _applicationFolder, me.bootCallback.bind(me));
  }

  private bootLoopbackApp(app, options, callback) {
    const me = this;
    const execute = require('./executor');
    const compile = require('loopback-boot').compile;
    const instructions = compile(options);
    execute(app, instructions, callback, me.verifyDataSources.bind(me));
  };

  private verifyDataSources(instructions: any, cb: () => void) {
    const me = this;

    me.log.notice('>>>> Entering verifyDataSources');

    //Enough of LoopBack is booted (configs applied, etc. See './executor.js') that we can init Globals here
    Globals.init(me.app);

    //Now that our Globals are initted we can "re-initialize" our logger
    me.log.initSubscriptions(me.app);

    const dataSourceNames = Object.keys(instructions.dataSources);
    async.each(dataSourceNames,
      (dataSourceName, cb) => {
        const ds = me.app.dataSources[dataSourceName];
        me.allDataSources.push(ds);
        async.waterfall([
          (cb) => {
            if(ds.settings.connector === 'loopback-component-storage') {
              me.log.notice(`Not PINGING DataSource '${dataSourceName}' [Connector: '${ds.settings.connector}']`);
              return cb(null, true);
            }
            me.log.notice(`PINGING DataSource '${dataSourceName}' [Connector: '${ds.settings.connector}']`);
            //TODO: Add timeout to ping in case the machine is unreachable. This works OK if machine is reachable
            //but no server is listening on the specified port
            ds.ping((err: Error) => {
              me.log.debug(`DataSource '${dataSourceName}' PING ` + (!err ? 'SUCCESS' : 'FAIL'));
              cb(null, !err);
            });
          },
          (pingDataSourceSucceeded: boolean, cb) => {
            if(pingDataSourceSucceeded) {
              return cb(null, true);
            }
            const fdbh = me.databaseHelpers.filter((dbh) => ds.settings.connector === dbh.connectorName);
            if(fdbh.length !== 1) {
              const message = `InitializeDatabase FAILED: No helper for '${ds.settings.connector}'`;
              me.log.warning(message);
              return cb(null, false);
            }
            me.log.debug(`Running helper for DataSource '${dataSourceName}' [Connector: '${ds.settings.connector}']`);
            fdbh[0].configure(ds, (err: Error) => {
              me.log.debug(`DataSource helper config for '${dataSourceName}' ` + (!err ? 'SUCCESS' : 'FAIL'));
              cb(null, false);
            });
          },
          (databaseHelperSucceeded: boolean, cb) => {
            if(databaseHelperSucceeded) {
              return cb(null, true);
            }
            ds.ping((err) => {
              me.log.debug(`DataSource '${dataSourceName}' (after config) PING ` + (!err ? 'SUCCESS' : 'FAIL'));
              !err && me.dataSourcesToAutoMigrate.push(ds);
              err && me.log.warning(err.message);
              cb(null, !err);
            });
          },
          (dataSourceIsGood: boolean, cb) => {
            if(dataSourceIsGood) {
              return cb();
            }
            const modelsUsingThisBadDataSource = instructions.models.filter((model) => {
              return (model.config && model.config.dataSource === ds.name);
            });
            const modelNames = modelsUsingThisBadDataSource.map((model) => model.name);
            if(!Globals.replaceBadDataSourceWithMemoryDataSource) {
              let message = `Bad DataSource '${ds.name}'. Restart with 'Globals.replaceBadDataSourceWithMemoryDataSource = true' to run anyway`;
              message += ` (Models: '${modelNames}')`;
              throw new Error(message);
            }
            Globals.badDataSourceReplacedWithMemoryDataSource = true;
            me.log.warning(`Replacing bad DataSource '${ds.name}' with '${Globals.memoryDataSourceName}' on models '${modelNames}'`);
            modelsUsingThisBadDataSource.forEach((model) => {
              model.config.dataSource = Globals.memoryDataSourceName;
            });
            return cb();
          }
        ], cb);
      }, () => {
        me.log.notice('<<<< Exiting verifyDataSources');
        cb();
      });
  }

  private bootCallback(err: Error) {
    const me = this;
    if(err) {
      const errorMsg = `Error booting loopback application: ${err.message}`;
      me.log.error(errorMsg);
      throw new Error(errorMsg);
    }

    async.series([
      (cb) => {
        //AutoMigrate any dataSources (models, really) that require it
        async.each(me.dataSourcesToAutoMigrate, (dataSource: any, cb) => {
          me.log.notice(`Automigrating models attached to DataSource: '${dataSource.name}'`);
          dataSource.automigrate(cb);
        }, cb);
      },
      (cb) => {
        //AutoUpdate datasources
        async.each(me.allDataSources, (dataSource: any, cb) => {
          me.log.info(`AutoUpdating models attached to DataSource: '${dataSource.name}'`);
          if(dataSource.connector.name === 'postgresql') {
            //HACK: Need to monkey-patch SQLConnector.prototype.addPropertyToActual due to error.
            //Adding a column to a table with ' NOT NULL' requires a default value or column will
            //not be added.
            dataSource.connector.addPropertyToActual = (model, propertyName) => {
              const propertyType = me.app.models[model].getPropertyType(propertyName);
              let defaultProperty: any;
              switch(propertyType) {
                case 'String':
                  defaultProperty = '';
                  break;
                case 'Number':
                  defaultProperty = 0;
                  break;
                case 'Date':
                  defaultProperty = '1900-01-01';
                  break;
                default:
                  me.log.error(`Unknown property type '${propertyType}' encountered while auto-updating model '${model}'`);
                  break;
              }
              const self = dataSource.connector;
              let sqlCommand = self.columnEscaped(model, propertyName);
              sqlCommand += ' ' + self.columnDataType(model, propertyName);
              const required = !self.isNullable(self.getPropertyDefinition(model, propertyName));
              sqlCommand += required
                ? ` NOT NULL DEFAULT '${defaultProperty}'`
                : '';
              me.log.warning(`Creating column '${propertyName}' in model '${model}' - Required: '${required}'`);
              return sqlCommand;
            };
          }
          dataSource.autoupdate(cb);
        }, cb);
      },
      (cb) => {
        //Tell loopback to use AminoAccessToken for auth
        me.log.info(`Installing custom Loopback access token [model: AminoAccessToken]`);
        me.app.use(me.loopback.token({
          model: me.app.models.AminoAccessToken
        }));

        //Sign up to hear back from ServiceManager when all the services (if any) are started
        me.log.debug('Subscribing to Postal[Amino3Startup:services-started]');
        me.postal
          .subscribe({
            channel: 'Amino3Startup',
            topic: 'services-started',
            callback: () => {
              me.log.info(`[RECV] 'Amino3Startup:services-started'`);
              //Sometimes, for building the client, etc., you just don't want to sit and listen
              if(!me.startListening || Globals.noListen) {
                Globals.noListen && me.log.warning(`Amino3 halting (in 3 seconds) due to AMINO3_NO_LISTEN environment variable or 'noListen' config`);
                //Wait 3s to bail so log file has opportunity to flush
                return setTimeout(() => {
                  process.exit(0);
                }, 2511);//<== Goofy number of MS so searches for 3000, etc. won't find it
              }
              me.log.info(`Starting Socket.IO server`);
              const httpServer = me.listen();
              const socketIoServer = require('socket.io');
              const io = new socketIoServer(httpServer, {path: Globals.serverWebSocketPath});
              me.postal
                .publish({
                  channel: 'ServiceBus',
                  topic: 'SetSocketIO',
                  data: {io}
                });
              me.app.emit('started');
            }
          });

        //Bring ServiceManager to life
        me.log.debug('Initializing ServiceManager subscriptions');
        me.serviceManager.initSubscriptions(me.app, (err: Error) => {
          if(err) {
            const errorMsg = `Failed to initialize 'ServiceManager': ${err.message}`;
            me.log.error(errorMsg);
            throw new Error(errorMsg);
          }
          me.log.info(`[SEND] 'Amino3Startup:loopback-booted'`);
          me.postal
            .publish({
              channel: 'Amino3Startup',
              topic: 'loopback-booted'
            });
          cb();
        });
      }
    ], (err: Error) => {
      me.log.logIfError(err);
      me.log.info(`Loopback boot process COMPLETED`);
    });
  }

  private listen() {
    const me = this;
    /*
    me.app.all('*', (req, res, next)=>{
      next();
    });
    */
    return me.app.listen(() => {
      const ourLoopbackUrl = new URL(me.app.get('url'));
      if(Globals.publishedAminoPort) {
        let proxyToAminoUrl = undefined;
        if(Globals.proxyToAminoUrl) {
          try {
            proxyToAminoUrl = new URL(require('normalize-url')(Globals.proxyToAminoUrl));
          } catch(err) {
            me.log.error(`Bad 'proxyToAminoUrl' ${err}`);
          }
        }
        const target = (proxyToAminoUrl)
          ? proxyToAminoUrl.href
          : (Globals.publishedAminoPort !== parseInt(ourLoopbackUrl.port))
            ? ourLoopbackUrl.href
            : null;
        if(target) {
          //const proxy =
          require('http-proxy').createProxyServer({target}).listen(Globals.publishedAminoPort);
          /*
            proxy.on('proxyReq', (proxyRe_, req, res, options)=>{
            });
            proxy.on('proxyRes', (proxyRe_, req, res, options)=>{
            });
          */
        }
      }

      //Little hack so client can know if it's connected to a production server
      me.app.get('/node-env', (req, res) => {
        res.status(200).send({node_env: Globals.node_env});
      });

      //Log endpoints of loopback services we expose
      const baseUrl = ourLoopbackUrl.href.replace(/\/$/, '');
      if(me.app.get('loopback-component-explorer')) {
        const explorerPath = me.app.get('loopback-component-explorer').mountPath;
        me.log.notice(`Browse your REST API at ${baseUrl} ${explorerPath}`);
      }
      me.log.notice(`Web server listening at: ${baseUrl}`);
    });
  }
}

