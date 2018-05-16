import {injectable, inject, multiInject} from 'inversify';
import {CommandUtil, IPostal} from 'firmament-yargs';
import {BaseServiceImpl} from '../base-service';
import {Logger} from '../../util/logging/logger';
import {BaseDatabaseHelper} from '../../util/database-helpers/interfaces/base-database-helper';

import * as async from 'async';

@injectable()
export class InitializeDatabaseImpl extends BaseServiceImpl {
  constructor(@inject('Logger') private log: Logger,
              @inject('IPostal') private postal: IPostal,
              @multiInject('BaseDatabaseHelper') private databaseHelpers: BaseDatabaseHelper[],
              @inject('CommandUtil') private commandUtil: CommandUtil) {
    super();
  }

  initSubscriptions(cb: (err: Error, result: any) => void) {
    super.initSubscriptions();
    const me = this;
    async.waterfall([
      (cb) => {
        const AminoUser = me.app.models.AminoUser;
        const ds = AminoUser.dataSource;
        AminoUser.find((err) => {
          let message = 'Initialized InitializeDatabase Subscriptions';
          if (err) {
            const filteredDatabaseHelpers =
              me.databaseHelpers.filter((dbh) => ds.settings.connector === dbh.connectorName);
            if (filteredDatabaseHelpers.length !== 1) {
              message = `InitializeDatabase FAILED: No helper for '${ds.settings.connector}'`;
              return cb(new Error(message), {message: message});
            }
            return filteredDatabaseHelpers[0].configure(ds, (err: Error) => {
              if (err) {
                message = 'InitializeDatabase FAILED: ' + err.message;
                err = new Error(message);
              }
              return cb(err, {message});
            });
          }
          return cb(null, {message});
        });
      },
      (message, cb) => {
        const datasources: string[] = Object.keys(me.app.dataSources);
        async.each(datasources, (dsName, cb) => {
          const ds = me.app.dataSources[dsName];
          ds.isActual(function (err, actual) {
            if (err) {
              return cb(err);
            }
            if (actual) {
              me.log.debug(`datasource '${dsName}' is up to date`);
              return cb();
            }
            ds.autoupdate(function (err) {
              if (err) {
                return cb(err);
              }
              me.log.debug(`datasource '${dsName}' updated`);
              return cb();
            });
          });
        }, (err: Error) => {
          cb(err, message);
        });
      }
    ], (err: Error, results) => {
      cb(err, results);
    });
  }

  init(cb: (err: Error, result: any) => void) {
    cb(null, {message: 'Initialized InitializeDatabase'});
  }
}
