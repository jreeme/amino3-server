import {injectable, inject} from 'inversify';
import {CommandUtil, IPostal} from 'firmament-yargs';
import {BaseService} from '../interfaces/base-service';
import {FolderMonitor} from '../interfaces/folder-monitor';
import {LogService} from '../interfaces/log-service';
const path = require('path');
const fs = require('fs');

const chokidar = require('chokidar');

//noinspection JSUnusedGlobalSymbols
@injectable()
export class FolderMonitorImpl implements FolderMonitor {

  constructor(@inject('BaseService') private baseService: BaseService,
              @inject('LogService') private log: LogService,
              @inject('IPostal') private postal: IPostal,
              @inject('CommandUtil') private commandUtil: CommandUtil) {
    this.log.info('FolderMonitor created');
  }

  get server(): LoopBackApplication2 {
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
          me.sendFolderMonitorMessage(fullPath, stats, fileWatcherConfig);
        });
        watcher.on('unlink', (fullPath, stats) => {
          me.sendFolderMonitorMessage(fullPath, stats, fileWatcherConfig);
        });
        me.log.info(`Plugin upload path: ${fileWatcherConfig.folderMonitorPath}`);
      }
    });
    cb(null, {message: 'Initialized FolderMonitor Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    cb(null, {message: 'Initialized FolderMonitor'});
  }

  private sendFolderMonitorMessage(fullPath, stats, fileWatcherConfig) {
    const me = this;
    const size = stats ? stats.size.toString() : '';
    const createDate = stats ? stats.birthtime.toString() : '';
    me.postal.publish({
      channel: 'FolderMonitor',
      topic: fileWatcherConfig.folderMonitorPath,
      data: {
        fullPath, size, createDate
      }
    });
  }
}
