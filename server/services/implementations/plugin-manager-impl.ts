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

//noinspection JSUnusedGlobalSymbols
@injectable()
export class PluginManagerImpl implements PluginManager {
  private static pluginUploadFolderToMonitor = path.resolve(__dirname, '../../amino3-plugins/files');
  private static extractedPluginFolder = path.resolve(__dirname, '../../../client/source/src/app/pages/plugins');
  private static pagesRoutingTemplatePath = path.resolve(__dirname, '../../../client/source/src/app/pages/pages.routing.template.ts');
  private static pagesRoutingPath = path.resolve(__dirname, '../../../client/source/src/app/pages/pages.routing.ts');
  private static pagesMenuTemplatePath = path.resolve(__dirname, '../../../client/source/src/app/pages/pages.menu.template.ts');
  private static pagesMenuPath = path.resolve(__dirname, '../../../client/source/src/app/pages/pages.menu.ts');
  private static tmpUploaderFolder = path.resolve(__dirname, '../../amino3-plugins/tmp');
  private static uploadedPluginUrl = '/amino3-plugins/files';
  private static gitCloneClientExecutionGraph = path.resolve(__dirname, '../../firmament-bash/git-clone-client.json');
  private static npmInstallClientExecutionGraph = path.resolve(__dirname, '../../firmament-bash/npm-install-client.json');
  private static fileUploaderPath = path.resolve(__dirname, '../../util/blueimp-file-upload-expressjs/fileupload');
  private static clientFolder = path.resolve(__dirname, '../../../client');
  private static clientSourceFolder = path.resolve(__dirname, '../../../client/source');

  private static fileUploaderOptions = {
    tmpDir: PluginManagerImpl.tmpUploaderFolder,
    uploadDir: PluginManagerImpl.pluginUploadFolderToMonitor,
    uploadUrl: PluginManagerImpl.uploadedPluginUrl,
    storage: {
      type: 'local'
    }
  };

  private static fileUploader = require(PluginManagerImpl.fileUploaderPath)(PluginManagerImpl.fileUploaderOptions);

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
      topic: PluginManagerImpl.pluginUploadFolderToMonitor,
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
          folderMonitorPath: PluginManagerImpl.pluginUploadFolderToMonitor,
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
      cb(err, {message: 'Initialized PluginManager'});
    });
  }

  private gitClientCode(cb: (err?) => void) {
    const me = this;
    if (!fs.existsSync(PluginManagerImpl.clientFolder)) {
      fs.mkdirSync(PluginManagerImpl.clientFolder);
    }
    if (!fs.existsSync(PluginManagerImpl.clientSourceFolder)) {
      async.series([
        (cb) => {
          me.processCommandJson.processAbsoluteUrl(PluginManagerImpl.gitCloneClientExecutionGraph, cb);
        },
        (cb) => {
          me.processCommandJson.processAbsoluteUrl(PluginManagerImpl.npmInstallClientExecutionGraph, cb);
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
          fs.createReadStream(PluginManagerImpl.pagesRoutingTemplatePath),
          fs.createWriteStream(PluginManagerImpl.pagesRoutingPath),
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
          fs.createReadStream(PluginManagerImpl.pagesMenuTemplatePath),
          fs.createWriteStream(PluginManagerImpl.pagesMenuPath),
          '// **** Put new lines here', newMenuLines, cb);
      }
    ], cb);
  }

  private catalogPlugins(cb: (err) => void) {
    const me = this;
    me.pluginManifests = [];
    recursiveReaddir(PluginManagerImpl.extractedPluginFolder, (err, fullPaths) => {
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
        rimraf(PluginManagerImpl.extractedPluginFolder, cb);
      },
      (cb) => {
        mkdirp(PluginManagerImpl.extractedPluginFolder, cb);
      },
      (cb) => {
        recursiveReaddir(PluginManagerImpl.pluginUploadFolderToMonitor, cb);
      }
    ], (err, results) => {
      const files = results[2];
      async.map(files,
        (file, cb) => {
          tar.x({
            file,
            strict: true,
            C: PluginManagerImpl.extractedPluginFolder
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
