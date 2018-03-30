import {injectable, inject} from 'inversify';
import {CommandUtil, IPostal} from 'firmament-yargs';
import {BaseServiceImpl} from './base-service';
import {Logger} from '../util/logging/logger';

const chokidar = require('chokidar');

@injectable()
export class FolderMonitorImpl extends BaseServiceImpl {

  constructor(@inject('Logger') private log: Logger,
              @inject('IPostal') private postal: IPostal,
              @inject('CommandUtil') private commandUtil: CommandUtil) {
    super();
  }

  initSubscriptions(cb: (err: Error, result: any) => void) {
    super.initSubscriptions();
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
