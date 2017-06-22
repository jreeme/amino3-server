import {injectable, inject} from 'inversify';
import {CommandUtil, IPostal} from 'firmament-yargs';
import {BaseService} from '../interfaces/base-service';
import path = require('path');
import fs = require('fs');
import tar = require('tar');
import rimraf = require('rimraf');
import async = require('async');
import mkdirp = require('mkdirp');
import recursiveReaddir = require('recursive-readdir');
import jsonfile = require('jsonfile');
import {PluginManager} from '../interfaces/plugin-manager';
import {Util} from '../../util/util';
import ReadStream = NodeJS.ReadStream;
import WriteStream = NodeJS.WriteStream;
import {ProcessCommandJson} from 'firmament-bash/js/interfaces/process-command-json';
import {Globals} from "../../globals";

//noinspection JSUnusedGlobalSymbols
@injectable()
export class PluginManagerImpl implements PluginManager {
  private static fileUploaderOptions = {
    tmpDir: Globals.tmpUploaderFolder,
    uploadDir: Globals.pluginUploadFolderToMonitor,
    uploadUrl: Globals.uploadedPluginUrl,
    storage: {
      type: 'local'
    }
  };

  private static fileUploader = require(Globals.fileUploaderPath)(PluginManagerImpl.fileUploaderOptions);

  private pluginManifests: PluginManifest[] = [];
  private loadingPlugins = false;

  constructor(@inject('BaseService') private baseService: BaseService,
              @inject('ProcessCommandJson') private processCommandJson: ProcessCommandJson,
              @inject('CommandUtil') private commandUtil: CommandUtil,
              @inject('IPostal') private postal: IPostal) {
  }

  get server(): any {
    return this.baseService.server;
  }

  initSubscriptions(cb: (err: Error, result: any) => void) {
    const me = this;
    me.postal.subscribe({
      channel: 'FolderMonitor',
      topic: Globals.pluginUploadFolderToMonitor,
      callback: (/*fileWatcherPayload: FileWatcherPayload*/) => {
        me.loadPlugins((/*err*/) => {
          me.broadcastPluginList();
        });
      }
    });
    me.postal.subscribe({
      channel: 'PluginManager',
      topic: 'GetPluginList',
      callback: (/*data*/) => {
        me.broadcastPluginList();
      }
    });
    cb(null, {message: 'Initialized PluginManager Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    const me = this;
    me.gitClientCode((err) => {
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
      me.server.get('/upload', function (req, res) {
        PluginManagerImpl.fileUploader.get(req, res, function (err, obj) {
          res.send(JSON.stringify(obj));
        });
      });
      me.server.post('/upload', function (req, res) {
        PluginManagerImpl.fileUploader.post(req, res, function (err/*,uploadedFileInfo*/) {
          return res.status(200).send({status: err ? 'error' : 'OK', error: err});
        });
      });
      me.server.delete('/uploaded/files/:name', function (req, res) {
        PluginManagerImpl.fileUploader.delete(req, res, function (err, result) {
          res.send(JSON.stringify(result));
        });
      });
      me.loadPlugins((err) => {
        cb(err, {message: 'Initialized PluginManager'});
      });
    });
  }

  private gitClientCode(cb: (err?) => void) {
    const me = this;
    if (!fs.existsSync(Globals.clientFolder)) {
      //Make sure cwd is as expected by shell processes
      process.chdir(Globals.projectRootPath);
      async.series([
        (cb) => {
          me.processCommandJson.processAbsoluteUrl(Globals.gitCloneClientExecutionGraph, cb);
        },
        (cb) => {
          me.processCommandJson.processAbsoluteUrl(Globals.npmInstallClientExecutionGraph, cb);
        }
      ], cb);
      return;
    }
    cb();
  };

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
      const files = results[2];
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
              me.commandUtil.logError(err);
            });
        }, (err) => {
          me.commandUtil.logError(err);
          cb(err);
        });
    });
  }

  private loadPlugins(cb: (err?) => void) {
    const me = this;
    if(Globals.suppressLoadPlugins){
      cb();
      return;
    }
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
  }
}
