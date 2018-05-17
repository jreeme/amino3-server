import {injectable, inject, multiInject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {Logger} from '../util/logging/logger';
import {Globals} from '../globals';
import {ServiceManager} from './service-manager';

import * as async from 'async';
import {BaseDatabaseHelper} from "../util/database-helpers/interfaces/base-database-helper";

export interface BootManager {
  start(loopback: any, loopbackApplication: LoopBackApplication2, applicationFolder: string, startListening: boolean);
}

@injectable()
export class BootManagerImpl implements BootManager {
  private loopback: any;
  private app: LoopBackApplication2;
  private startListening: boolean;
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
        async.waterfall([
          (cb) => {
            me.log.notice(`PINGING DataSource '${dataSourceName}' [Connector: '${ds.settings.connector}']`);
            ds.ping((err: Error) => {
              me.log.debug(`DataSource '${dataSourceName}' PING ` + (!err ? 'SUCCESS' : 'FAIL'));
              cb(null, !err);
            });
          },
          (pingDataSourceSucceeded: boolean, cb) => {
            if (pingDataSourceSucceeded) {
              return cb(null, true);
            }
            const fdbh = me.databaseHelpers.filter((dbh) => ds.settings.connector === dbh.connectorName);
            if (fdbh.length !== 1) {
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
            if (databaseHelperSucceeded) {
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
            if (dataSourceIsGood) {
              return cb();
            }
            const modelsUsingThisBadDataSource = instructions.models.filter((model) => {
              return (model.config && model.config.dataSource === ds.name);
            });
            const modelNames = modelsUsingThisBadDataSource.map((model) => model.name);
            if (!Globals.replaceBadDataSourceWithMemoryDataSource) {
              let message = `Bad DataSource '${ds.name}'. Restart with 'Globals.replaceBadDataSourceWithMemoryDataSource = true' to run anyway`;
              message += ` (Models: '${modelNames}')`;
              throw new Error(message);
            }
            me.log.warning(`Replacing bad DataSource '${ds.name}' with '${Globals.memoryDataSourceName}' on models '${modelNames}'`);
            modelsUsingThisBadDataSource.forEach((model) => {
              model.config.dataSource = Globals.memoryDataSourceName;
            });
            return cb();
          }
        ], cb);
      }, (err) => {
        me.log.notice('<<<< Exiting verifyDataSources');
        cb();
      });
  }

  private bootCallback(err: Error) {
    const me = this;
    if (err) {
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
              if (!me.startListening || Globals.noListen) {
                Globals.noListen && me.log.warning(`Amino3 halting (in 3 seconds) due to AMINO3_NO_LISTEN environment variable or 'noListen' config`);
                //Wait 3s to bail so log file has opportunity to flush
                return setTimeout(() => {
                  process.exit(0);
                }, 2511);//<== Goofy number of MS so searches for 3000, etc. won't find it
              }
              me.log.info(`Starting Amino3 by 'node server.js'`);
              me.log.info(`Starting Socket.IO server`);
              me.postal
                .publish({
                  channel: 'ServiceBus',
                  topic: 'SetSocketIO',
                  data: {io: require('socket.io')(me.listen())}
                });
              me.app.emit('started');
            }
          });

        //Bring ServiceManager to life
        me.log.debug('Initializing ServiceManager subscriptions');
        me.serviceManager.initSubscriptions(me.app, (err: Error) => {
          if (err) {
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
    ], (err, result) => {
      me.log.info(`Loopback boot process COMPLETED`);
    });
  }

  private listen() {
    const me = this;
    return me.app.listen(() => {
      const baseUrl = me.app.get('url').replace(/\/$/, '');
      if (me.app.get('loopback-component-explorer')) {
        const explorerPath = me.app.get('loopback-component-explorer').mountPath;
        me.log.notice(`Browse your REST API at ${baseUrl} ${explorerPath}`);
      }
      me.log.notice(`Web server listening at: ${baseUrl}`);
    });
  }
}

