import {injectable, inject, multiInject} from 'inversify';
import {CommandUtil, IPostal} from 'firmament-yargs';
import {BaseServiceImpl} from './base-service';
import {Logger} from '../util/logging/logger';
import {BaseDatabaseHelper} from '../util/database-helpers/interfaces/base-database-helper';

import * as async from 'async';

@injectable()
export class InitializeDatabaseImpl extends BaseServiceImpl {
  constructor(@inject('Logger') private log: Logger,
              @inject('IPostal') private postal: IPostal,
              @multiInject('BaseDatabaseHelper') private databaseHelpers: BaseDatabaseHelper[],
              @inject('CommandUtil') private commandUtil: CommandUtil) {
    super();
  }

  private verifyDataSources(cb: (err?: Error) => void) {
    const me = this;
    const dataSourcesHash = me.app.dataSources;
    if (!dataSourcesHash || typeof dataSourcesHash !== 'object') {
      return cb();
    }
    const dataSources = Object.keys(dataSourcesHash).map((key) => dataSourcesHash[key]);
    const uniqueDataSources = new Set(dataSources);
    const uniqueDataSourceArray = Array.from(uniqueDataSources);
    async.reject(uniqueDataSourceArray,
      (dataSource, cb) => {
        if (dataSource.connected) {
          return cb(null, true);
        }

        function test(err: Error) {
          this.removeListener('error', test);
          this.removeListener('connected', test);
          this.error = err;
          cb(null, !err);
        }

        dataSource.once('connected', test);
        dataSource.once('error', test);
      }, (err, dataSourcesBadConnection: any[]) => {
        me.filterUnusedDataSources(dataSourcesBadConnection, (err, usedDataSources) => {

          cb();
        });
      });
  }

  private filterUnusedDataSources(dataSourcesBadConnection: any[], cb: (err: Error, usedDataSources: any[]) => void) {
    const me = this;
    const models = Object.keys(me.app.models).map((key) => me.app.models[key]);
    const usedDataSources = dataSourcesBadConnection.filter((dataSourceBadConnection) => {
      const modelsUsingThisDataSource = models.filter((model) => model.dataSource === dataSourceBadConnection);
      return modelsUsingThisDataSource.length;
    });
    cb(null, usedDataSources);
  }

  initSubscriptions(app: LoopBackApplication2, cb: (err: Error, result: any) => void) {
    super.initSubscriptions(app);
    const me = this;
    me.verifyDataSources((err) => {
      if (me.commandUtil.callbackIfError(cb, err)) {
        return;
      }
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
    });
  }

  init(cb: (err: Error, result: any) => void) {
    const me = this;
    const datasources = Object.keys(me.app.dataSources);
    async.eachSeries(datasources, function (dsName, cb) {
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
          cb();
        });
      });
    }, (err: Error) => {
      cb(err, {message: 'Initialized InitializeDatabase'});
    });
  }
}