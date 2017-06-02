import {injectable, inject} from 'inversify';
import {CommandUtil, IPostal} from "firmament-yargs";
import {BaseService} from "../interfaces/base-service";
import {FolderMonitor} from "../interfaces/folder-monitor";
const path = require('path');
const fs = require('fs');

const chokidar = require('chokidar');

//noinspection JSUnusedGlobalSymbols
@injectable()
export class FolderMonitorImpl implements FolderMonitor {

  constructor(@inject('BaseService') private baseService: BaseService,
              @inject('IPostal') private postal: IPostal,
              @inject('CommandUtil') private commandUtil: CommandUtil) {
    this.commandUtil.log('FolderMonitor created');
  }

  get server(): any {
    return this.baseService.server;
  }

  initSubscriptions(cb: (err: Error, result: any) => void) {
    const me = this;
    me.postal.subscribe({
      channel: 'FolderMonitor',
      topic: 'AddFolderToMonitor',
      callback: (fileWatcherConfig: FileWatcherConfig) => {
        const watcher = chokidar.watch(fileWatcherConfig.folderMonitorPath, {
          ignored: /[\/\\]\./,
          ignoreInitial: fileWatcherConfig.watcherConfig.ignoreInitial,
          persistent: true,
          awaitWriteFinish: {
            stabilityThreshold: 2000,
            pollInterval: 100
          }
        });

        watcher.on('add', (fullPath, stats) => {
          const size = stats.size.toString();
          const createDate = stats.birthtime.toString();

          me.postal.publish({
            channel: 'FolderMonitor',
            topic: fileWatcherConfig.folderMonitorPath,
            data: {
              fullPath, size, createDate
            }
          });
        });
        me.commandUtil.log(`config.folderMonitorPath: ${fileWatcherConfig.folderMonitorPath}`);
      }
    });
    cb(null, {message: 'Initialized FolderMonitor Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    cb(null, {message: 'Initialized FolderMonitor'});
  }
}
