import {injectable, inject} from 'inversify';
import {ServiceManager} from "../interfaces/service-manager";
import {BaseService} from "../interfaces/base-service";
import {InitializeDatabase} from "../interfaces/initialize-database";
import {RebuildClient} from "../interfaces/rebuild-client";
import {PluginManager} from "../interfaces/plugin-manager";
import {Authentication} from "../interfaces/authentication";
import {StaticService} from "../interfaces/static-service";
import {RootService} from "../interfaces/root-service";
import {FolderMonitor} from "../interfaces/folder-monitor";
import {LogService} from "../interfaces/log-service";

import * as async from 'async';
import {WebSocketManager} from "../interfaces/web-socket-manager";
import {Globals} from "../../globals";
import {FileUpload} from "../interfaces/file-upload";

//noinspection JSUnusedGlobalSymbols
@injectable()
export class ServiceManagerImpl implements ServiceManager {
  constructor(@inject('BaseService') private baseService: BaseService,
              @inject('RebuildClient') private rebuildClient: RebuildClient,
              @inject('PluginManager') private pluginManager: PluginManager,
              @inject('FileUpload') private fileUpload: FileUpload,
              @inject('Authentication') private authentication: Authentication,
              @inject('RootService') private rootService: RootService,
              @inject('StaticService') private staticService: StaticService,
              @inject('FolderMonitor') private folderMonitor: FolderMonitor,
              @inject('LogService') private logService: LogService,
              @inject('WebSocketManager') private webSocketManager: WebSocketManager,
              @inject('InitializeDatabase') private initializeDatabase: InitializeDatabase) {
  }

  get server(): LoopBackApplication2 {
    return this.baseService.server;
  }

  initSubscriptions(cb: (err?: Error, result?: any) => void) {
    const fnArray = Globals.activeServices.map((activeService) => {
      return this[activeService].initSubscriptions.bind(this[activeService]);
    });
    async.mapSeries(fnArray,
      (fn, cb) => {
        fn(cb);
      }, cb);
  }

  init(cb: (err?: Error, result?: any) => void) {
    const fnArray = Globals.activeServices.map((activeService) => {
      return this[activeService].init.bind(this[activeService]);
    });
    async.mapSeries(fnArray,
      (fn, cb) => {
        fn(cb);
      }, cb);
  }
}
