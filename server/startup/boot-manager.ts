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
    //const execute = require('loopback-boot').execute;
    const compile = require('loopback-boot').compile;
    const instructions = compile(options);
    execute(app, instructions, callback, me.verifyDataSources.bind(me));
  };

  private verifyDataSources(instructions: any, cb: () => void) {
    const me = this;
    const dataSourceNames = Object.keys(instructions.dataSources);
    const memoryDataSource = me.app.dataSources[Globals.memoryDataSourceName]
      || me.app.dataSource(Globals.memoryDataSourceName,
        {
          connector: 'memory'
        });
    async.each(dataSourceNames,
      (dataSourceName, cb) => {
        const ds = me.app.dataSources[dataSourceName];
        async.waterfall([
          (cb) => {
            ds.ping((err: Error) => {
              if (!err) {
                return cb(null, null);
              }
              const fdbh = me.databaseHelpers.filter((dbh) => ds.settings.connector === dbh.connectorName);
              if (fdbh.length !== 1) {
                const message = `InitializeDatabase FAILED: No helper for '${ds.settings.connector}'`;
                me.log.warning(message);
                return cb(null, new Error(message));
              }
              fdbh[0].configure(ds, (err: Error) => {
                if (!err) {
                  return ds.ping((err) => {
                    if (!err) {
                      return cb(null, null);
                    }
                    const message = `InitializeDatabase FAILED: Post-config PING failed`;
                    me.log.warning(message);
                    return cb(null, new Error(message));
                  });
                }
                const message = `InitializeDatabase FAILED: ${err.message}`;
                me.log.warning(message);
                return cb(null, new Error(message));
              });
            });
          },
          (dataSourceIsBad, cb) => {
            if (!dataSourceIsBad) {
              return cb();
            }
            instructions.models.forEach((model) => {
              if (!model.config) {
                return;
              }
              if (model.config.dataSource === ds.name) {
                model.config.dataSource = Globals.memoryDataSourceName;
              }
            });
            return cb();
          }
        ], (err, results) => {
          cb();
        });
      },
      () => {
        cb();
      });
    /*    let memoryDataSource = me.app.dataSources[Globals.memoryDataSourceName];
        async.each(models,
          (model, cb: (err?: Error) => void) => {
            model.dataSource.ping((err) => {
              try {
                if (!err) {
                  return;
                }
                me.log.critical(`Model '${model.modelName}' attempted connection to '${model.dataSource.name}' and FAILED`);
                if (!Globals.replaceBadDataSourceWithMemoryDataSource) {
                  return;
                }
                memoryDataSource = memoryDataSource || me.app.dataSource(Globals.memoryDataSourceName,
                  {
                    connector: 'memory'
                  });
                model.attachTo(memoryDataSource);
              } finally {
                cb();
              }
            });
          },
          (err: Error) => {
            cb();
          });*/
  }

  private bootCallback(err: Error) {
    const me = this;
    if (err) {
      const errorMsg = `Error booting loopback application: ${err.message}`;
      me.log.error(errorMsg);
      throw new Error(errorMsg);
    }

    //Loopback App booted so all configs are loaded (and available via app.get('config-name')
    //so this is a good time to initialize our Globals object
    Globals.init(me.app);

    //Now that our Globals are initted we can "re-initialize" our logger
    me.log.initSubscriptions(me.app);

    me.log.info(`Loopback boot process COMPLETED`);

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

