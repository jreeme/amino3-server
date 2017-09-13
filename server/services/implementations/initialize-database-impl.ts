import {injectable, inject} from 'inversify';
import {InitializeDatabase} from '../interfaces/initialize-database';
import {CommandUtil, IPostal} from 'firmament-yargs';
import {BaseService} from '../interfaces/base-service';
import {LogService} from "../interfaces/log-service";
//const async = require('async');

//noinspection JSUnusedGlobalSymbols
@injectable()
export class InitializeDatabaseImpl implements InitializeDatabase {
//noinspection JSUnusedLocalSymbols
  constructor(@inject('BaseService') private baseService: BaseService,
              @inject('LogService') private log: LogService,
              @inject('IPostal') private postal: IPostal,
              @inject('CommandUtil') private commandUtil: CommandUtil) {
  }

  get server(): any {
    return this.baseService.server;
  }

  initSubscriptions(cb: (err: Error, result: any) => void) {
    const me = this;
    const AminoUser = me.server.models.AminoUser;
    AminoUser.find((err) => {
      if (err) {
        //Create models in database (usually only happens if PostgresDB hasn't been initialized)
        AminoUser.dataSource.automigrate(() => {
          cb(null, {message: 'Initialized InitializeDatabase Subscriptions'});
        });
        return;
      }
      cb(null, {message: 'Initialized InitializeDatabase Subscriptions'});
    });
  }

  init(cb: (err: Error, result: any) => void) {
    cb(null, {message: 'Initialized InitializeDatabase'});
  }
}
