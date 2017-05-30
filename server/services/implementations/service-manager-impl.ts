import {injectable, inject} from 'inversify';
import {ServiceManager} from "../interfaces/service-manager";
import {BaseService} from "../interfaces/base-service";
import {InitializeDatabase} from "../interfaces/initialize-database";
import {RebuildClient} from "../interfaces/rebuild-client";

const async = require('async');

@injectable()
export class ServiceManagerImpl implements ServiceManager {
  constructor(@inject('BaseService') private baseService: BaseService,
              @inject('RebuildClient') private rebuildClient: RebuildClient,
              @inject('InitializeDatabase') private initializeDatabase: InitializeDatabase) {
  }

  get server(): any {
    return this.baseService.server;
  }

  initSubscriptions(cb: (err: Error, result: any) => void) {
    cb(null, null);
  }

  init(cb: (err: Error, result: any) => void) {
    let fnArray = [
      this.initializeDatabase.initSubscriptions.bind(this.initializeDatabase)
      , this.initializeDatabase.init.bind(this.initializeDatabase)
      , this.rebuildClient.initSubscriptions.bind(this.rebuildClient)
      , this.rebuildClient.init.bind(this.rebuildClient)
    ];
    async.mapSeries(fnArray,
      (fn, cb) => {
        fn(cb);
      }, cb);
  }
}
