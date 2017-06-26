import {injectable, inject} from 'inversify';
import {ServiceManager} from "../interfaces/service-manager";
import {BaseService} from "../interfaces/base-service";
import {InitializeDatabase} from "../interfaces/initialize-database";
import {RebuildClient} from "../interfaces/rebuild-client";
import {PluginManager} from "../interfaces/plugin-manager";
import {Authentication} from "../interfaces/authentication";
import {StaticService} from "../interfaces/static-service";
import {RootService} from "../interfaces/root-service";
import {WebSocketService} from "../interfaces/web-socket-service";
import {FolderMonitor} from "../interfaces/folder-monitor";
import {MosaicProxy} from "../interfaces/mosaic-proxy";
import {NewmanProxy} from "../interfaces/newman-proxy";
import {LogService} from "../interfaces/log-service";

import async = require('async');

//noinspection JSUnusedGlobalSymbols
@injectable()
export class ServiceManagerImpl implements ServiceManager {
  constructor(@inject('BaseService') private baseService: BaseService,
              @inject('RebuildClient') private rebuildClient: RebuildClient,
              @inject('PluginManager') private pluginManager: PluginManager,
              @inject('Authentication') private authentication: Authentication,
              @inject('RootService') private rootService: RootService,
              @inject('StaticService') private staticService: StaticService,
              @inject('FolderMonitor') private folderMonitor: FolderMonitor,
              @inject('MosaicProxy') private mosaicProxy: MosaicProxy,
              @inject('NewmanProxy') private newmanProxy: NewmanProxy,
              @inject('LogService') private logService: LogService,
              @inject('WebSocketService') private webSocketService: WebSocketService,
              @inject('InitializeDatabase') private initializeDatabase: InitializeDatabase) {
  }

  get server(): any {
    return this.baseService.server;
  }

  initSubscriptions(cb: (err?: Error, result?: any) => void) {
    const fnArray = [
      this.initializeDatabase.initSubscriptions.bind(this.initializeDatabase)
      , this.pluginManager.initSubscriptions.bind(this.pluginManager)
      , this.rebuildClient.initSubscriptions.bind(this.rebuildClient)
      , this.authentication.initSubscriptions.bind(this.authentication)
      , this.webSocketService.initSubscriptions.bind(this.webSocketService)
      , this.folderMonitor.initSubscriptions.bind(this.folderMonitor)
      , this.staticService.initSubscriptions.bind(this.staticService)
      , this.rootService.initSubscriptions.bind(this.rootService)
      , this.mosaicProxy.initSubscriptions.bind(this.mosaicProxy)
      , this.newmanProxy.initSubscriptions.bind(this.newmanProxy)
      , this.logService.initSubscriptions.bind(this.logService)
    ];
    async.map(fnArray,
      (fn, cb) => {
        fn(cb);
      }, cb);
  }

  init(cb: (err?: Error, result?: any) => void) {
    const fnArray = [
      this.initializeDatabase.init.bind(this.initializeDatabase)
      , this.pluginManager.init.bind(this.pluginManager)
      , this.rebuildClient.init.bind(this.rebuildClient)
      , this.authentication.init.bind(this.authentication)
      , this.webSocketService.init.bind(this.webSocketService)
      , this.folderMonitor.init.bind(this.folderMonitor)
      , this.staticService.init.bind(this.staticService)
      , this.rootService.init.bind(this.rootService)
      , this.mosaicProxy.init.bind(this.mosaicProxy)
      , this.newmanProxy.init.bind(this.newmanProxy)
      , this.logService.init.bind(this.logService)
    ];
    async.map(fnArray,
      (fn, cb) => {
        fn(cb);
      }, cb);
  }
}
