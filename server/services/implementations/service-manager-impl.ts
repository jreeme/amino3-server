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

import async = require('async');
import {LoopBackApplication2} from "../../custom-typings";
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
    const fnArray = [];
    fnArray.push(this.initializeDatabase.initSubscriptions.bind(this.initializeDatabase));
    fnArray.push(this.webSocketManager.initSubscriptions.bind(this.webSocketManager));
    fnArray.push(this.fileUpload.initSubscriptions.bind(this.fileUpload));
    if (Globals.suppressLoadPlugins) {
      fnArray.push(this.pluginManager.initSubscriptions.bind(this.pluginManager));
      fnArray.push(this.folderMonitor.initSubscriptions.bind(this.folderMonitor));
    }
    if (Globals.env !== 'production') {
      fnArray.push(this.rebuildClient.initSubscriptions.bind(this.rebuildClient));
    }
    fnArray.push(this.authentication.initSubscriptions.bind(this.authentication));
    fnArray.push(this.staticService.initSubscriptions.bind(this.staticService));
    fnArray.push(this.rootService.initSubscriptions.bind(this.rootService));
    fnArray.push(this.logService.initSubscriptions.bind(this.logService));
    async.mapSeries(fnArray,
      (fn, cb) => {
        fn(cb);
      }, cb);
  }

  init(cb: (err?: Error, result?: any) => void) {
    const fnArray = [];
    fnArray.push(this.initializeDatabase.init.bind(this.initializeDatabase));
    fnArray.push(this.webSocketManager.init.bind(this.webSocketManager));
    fnArray.push(this.fileUpload.init.bind(this.fileUpload));
    if (Globals.suppressLoadPlugins) {
      fnArray.push(this.pluginManager.init.bind(this.pluginManager));
      fnArray.push(this.folderMonitor.init.bind(this.folderMonitor));
    }
    if (Globals.env !== 'production') {
      fnArray.push(this.rebuildClient.init.bind(this.rebuildClient));
    }
    fnArray.push(this.authentication.init.bind(this.authentication));
    fnArray.push(this.staticService.init.bind(this.staticService));
    fnArray.push(this.rootService.init.bind(this.rootService));
    fnArray.push(this.logService.init.bind(this.logService));
    async.mapSeries(fnArray,
      (fn, cb) => {
        fn(cb);
      }, cb);
  }
}
