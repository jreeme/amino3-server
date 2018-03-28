import {injectable, inject} from 'inversify';
import {CommandUtil, IPostal} from 'firmament-yargs';
import {ProcessCommandJson} from 'firmament-bash/js/interfaces/process-command-json';
import {BaseServiceImpl} from './base-service';
import {Globals} from '../globals';
import {Logger} from '../util/logging/logger';
import {Util} from '../util/util';
import * as path from 'path';
import * as fs from 'fs';
import * as tar from 'tar';
import * as rimraf from 'rimraf';
import * as async from 'async';
import * as mkdirp from 'mkdirp';
import * as recursiveReaddir from 'recursive-readdir';
import * as jsonfile from 'jsonfile';

@injectable()
export class PluginManagerImpl extends BaseServiceImpl {
  init(cb: (err?: Error, result?: any) => void): void {
    cb && cb();
  }

  /*  private static fileUploaderOptions = {
      tmpDir: Globals.tmpUploaderFolder,
      uploadDir: Globals.pluginUploadFolderToMonitor,
      uploadUrl: Globals.uploadedPluginUrl,
      copyImgAsThumb: false,
      storage: {
        type: 'local'
      }
    };

    private static fileUploader = require(Globals.fileUploaderPath)(PluginManagerImpl.fileUploaderOptions);

    private pluginManifests: PluginManifest[] = [];
    private loadingPlugins = false;

    constructor(@inject('ProcessCommandJson') private processCommandJson: ProcessCommandJson,
                @inject('Logger') private log: Logger,
                @inject('CommandUtil') private commandUtil: CommandUtil,
                @inject('IPostal') private postal: IPostal) {
      super();
    }

    initSubscriptions(app: LoopBackApplication2, cb: (err: Error, result: any) => void) {
      super.initSubscriptions(app);
      const me = this;
      me.app.get('/upload', function (req, res) {
        PluginManagerImpl.fileUploader.get(req, res, function (err, obj) {
          res.send(JSON.stringify(obj));
        });
      });
      me.app.post('/upload', function (req, res) {
        PluginManagerImpl.fileUploader.post(req, res, function (err/!*,uploadedFileInfo*!/) {
          return res.status(200).send({status: err ? 'error' : 'OK', error: err});
        });
      });
      me.app.delete('/uploaded/files/:name', function (req, res) {
        PluginManagerImpl.fileUploader.delete(req, res, function (err, result) {
          res.send(JSON.stringify(result));
        });
      });
      me.loadPlugins((err) => {
        cb(err, {message: 'Initialized PluginManager'});
      });
      me.postal.subscribe({
        channel: 'FolderMonitor',
        topic: Globals.pluginUploadFolderToMonitor,
        callback: (/!*fileWatcherPayload: FileWatcherPayload*!/) => {
          me.loadPlugins((/!*err*!/) => {
            me.broadcastPluginList();
          });
        }
      });
      me.postal.subscribe({
        channel: 'PluginManager',
        topic: 'GetPluginList',
        callback: (/!*data*!/) => {
          me.broadcastPluginList();
        }
      });
      cb(null, {message: 'Initialized PluginManager Subscriptions'});
    }

    init(cb: (err: Error, result: any) => void) {
      const me = this;
      me.postal.publish({
        channel: 'FolderMonitor',
        topic: 'AddFolderToMonitor',
        data: {
          folderMonitorPath: Globals.pluginUploadFolderToMonitor,
          watcherConfig: {
            ignoreInitial: false
          }
        }
      });
    }

    private modifyClientPagesRouting(cb: (err) => void) {
      const me = this;
      async.parallel([
        (cb) => {
          const newRoutingLines: string[] = [];
          me.pluginManifests.forEach((pluginManifest) => {
            pluginManifest.menuRoutes.forEach((menuRoute) => {
              newRoutingLines.push(`\t\t\t, {path: '${menuRoute.path}', loadChildren: '${menuRoute.loadChildren}'}\n`);
            });
          });
          Util.addTextLinesArrayToFile(
            fs.createReadStream(Globals.pagesRoutingTemplatePath),
            fs.createWriteStream(Globals.pagesRoutingPath),
            '// **** Put new lines here',
            newRoutingLines,
            cb);
        },
        (cb) => {
          const newMenuLines: string[] = [];
          me.pluginManifests.forEach((pluginManifest) => {
            pluginManifest.toolRoutes.forEach((toolRoute) => {
              const json = JSON.stringify(toolRoute, null, 2);
              newMenuLines.push(',' + json);
            });
          });
          Util.addTextLinesArrayToFile(
            fs.createReadStream(Globals.pagesMenuTemplatePath),
            fs.createWriteStream(Globals.pagesMenuPath),
            '// **** Put new lines here', newMenuLines, cb);
        }
      ], cb);
    }

    private catalogPlugins(cb: (err) => void) {
      const me = this;
      me.pluginManifests = [];
      recursiveReaddir(Globals.extractedPluginFolder, (err, fullPaths) => {
        const manifestFiles = fullPaths.filter((fullPath) => {
          return path.basename(fullPath) === 'manifest.json';
        });
        async.map(manifestFiles,
          (manifestFile, cb) => {
            jsonfile.readFile(manifestFile, (err, pluginManifest: PluginManifest) => {
              if (me.commandUtil.callbackIfError(cb, err)) {
                return;
              }
              me.pluginManifests.push(pluginManifest);
              cb(err);
            });
          }, (err) => {
            me.pluginManifests.sort((a, b) => {
              return a.pluginName.localeCompare(b.pluginName);
            });
            let id = 0;
            me.pluginManifests.forEach((pluginManifest) => {
              pluginManifest.pluginId = (++id).toString();
            });
            cb(err);
          });
      });
    }

    private extractPlugins(cb: (err) => void) {
      const me = this;
      async.series([
        (cb) => {
          //Blow away existing plugin extracts for a clean, fresh start
          rimraf(Globals.extractedPluginFolder, cb);
        },
        (cb) => {
          mkdirp(Globals.extractedPluginFolder, cb);
        },
        (cb) => {
          recursiveReaddir(Globals.pluginUploadFolderToMonitor, cb);
        }
      ], (err, results) => {
        const files = <any[]> results[2];
        async.map(files,
          (file, cb) => {
            tar.x({
              file,
              strict: true,
              C: Globals.extractedPluginFolder
            })
              .then(() => {
                cb();
              })
              .catch((err) => {
                me.log.logIfError(err);
              });
          }, (err: Error) => {
            me.log.logIfError(err);
            cb(err);
          });
      });
    }

    private loadPlugins(cb: (err?) => void) {
      const me = this;
      if (!me.loadingPlugins) {
        me.loadingPlugins = true;
        async.series([
          (cb) => {
            me.extractPlugins(cb);
          },
          (cb) => {
            me.catalogPlugins(cb);
          },
          (cb) => {
            me.modifyClientPagesRouting(cb);
          }
        ], (err) => {
          setTimeout(() => {
            me.loadingPlugins = false;
          }, 5000);
          cb(err);
        });
        return;
      }
      cb();
    }

    private broadcastPluginList() {
      const me = this;
      me.postal.publish({
        channel: 'WebSocket',
        topic: 'Broadcast',
        data: {
          channel: 'PluginTable'
          , topic: 'PluginList'
          , data: me.pluginManifests
        }
      });
    }*/
}
