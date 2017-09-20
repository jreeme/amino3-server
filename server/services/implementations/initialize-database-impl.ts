import {injectable, inject, multiInject} from 'inversify';
import {InitializeDatabase} from '../interfaces/initialize-database';
import {CommandUtil, IPostal} from 'firmament-yargs';
import {BaseService} from '../interfaces/base-service';
import {LogService} from '../interfaces/log-service';
import {BaseDatabaseHelper} from '../../util/database-helpers/interfaces/base-database-helper';

const async = require('async');

//noinspection JSUnusedGlobalSymbols
@injectable()
export class InitializeDatabaseImpl implements InitializeDatabase {
  //noinspection JSUnusedLocalSymbols
  constructor(@inject('BaseService') private baseService: BaseService,
              @inject('LogService') private log: LogService,
              @inject('IPostal') private postal: IPostal,
              @multiInject('BaseDatabaseHelper') private databaseHelpers: BaseDatabaseHelper[],
              @inject('CommandUtil') private commandUtil: CommandUtil) {
  }

  get server(): any {
    return this.baseService.server;
  }

  private verifyDataSources(cb: (err?: Error) => void) {
    const me = this;
    const dataSources = me.server.dataSources;
    if (!dataSources || typeof dataSources !== 'object') {
      cb();
      return;
    }
    const uniqueDataSources = new Set(Object.keys(dataSources).map((key) => {
      return dataSources[key];
    }));
    async.reject(uniqueDataSources,
      (dataSource, cb) => {
        function test(err: Error) {
          this.removeListener('error', test);
          this.removeListener('connected', test);
          this.error = err;
          cb(null, !err);
        }

        dataSource.once('connected', test);
        dataSource.once('error', test);
      }, (err, dataSourcesBadConnection: any[]) => {
        if (dataSourcesBadConnection.length) {
          //TODO: Fix any DataSource errors here
          cb(null);
        } else {
          cb(null);
        }
      });
  }

  initSubscriptions(cb: (err: Error, result: any) => void) {
    const me = this;
    me.verifyDataSources((err) => {
      if (me.commandUtil.callbackIfError(cb, err)) {
        return;
      }
      const AminoUser = me.server.models.AminoUser;
      const ds = AminoUser.dataSource;
      AminoUser.find((err) => {
        let cbErr = null;
        let cbMessage = 'Initialized InitializeDatabase Subscriptions';
        if (err) {
          const filteredDatabaseHelpers = me.databaseHelpers.filter((databaseHelper) => {
            return ds.settings.connector === databaseHelper.connectorName;
          });
          if (filteredDatabaseHelpers.length !== 1) {
            cbMessage = `InitializeDatabase FAILED: No helper for '${ds.settings.connector}'`;
            cbErr = new Error(cbMessage);
            cb(cbErr, {message: cbMessage});
            return;
          }
          filteredDatabaseHelpers[0].configure(ds, (err) => {
            if (err) {
              cbMessage = 'InitializeDatabase FAILED: ' + err.message;
              cbErr = new Error(cbMessage);
              cb(cbErr, {message: cbMessage});
            }
            cb(cbErr, {message: cbMessage});
          });
          return;
        }
        cb(null, {message: cbMessage});
      });
    });
  }

  init(cb: (err: Error, result: any) => void) {
    cb(null, {message: 'Initialized InitializeDatabase'});
  }
}
