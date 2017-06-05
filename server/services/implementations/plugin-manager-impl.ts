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
import {PluginManager} from "../interfaces/plugin-manager";

//noinspection JSUnusedGlobalSymbols
@injectable()
export class PluginManagerImpl implements PluginManager {
  private static pluginUploadFolderToMonitor = path.resolve(__dirname, '../../amino3-plugins/files');
  private static extractedPluginFolder = path.resolve(__dirname, '../../../client/source/src/app/pages/plugins');
  private static tmpUploaderFolder = path.resolve(__dirname, '../../amino3-plugins/tmp');
  private static uploadedPluginUrl = '/amino3-plugins/files';

  private static fileUploaderOptions = {
    tmpDir: PluginManagerImpl.tmpUploaderFolder,
    uploadDir: PluginManagerImpl.pluginUploadFolderToMonitor,
    uploadUrl: PluginManagerImpl.uploadedPluginUrl,
    storage: {
      type: 'local'
    }
  };

  private static fileUploader = require('../../util/blueimp-file-upload-expressjs/fileupload')(PluginManagerImpl.fileUploaderOptions);

  private pluginManifests: PluginManifest[] = [];

  constructor(@inject('BaseService') private baseService: BaseService,
              @inject('CommandUtil') private commandUtil: CommandUtil,
              @inject('IPostal') private postal: IPostal) {
    const me = this;
    me.server.on('started', () => {
      const i = 3;
    });
  }

  get server(): any {
    return this.baseService.server;
  }

  initSubscriptions(cb: (err: Error, result: any) => void) {
    const me = this;
    me.postal.subscribe({
      channel: 'FolderMonitor',
      topic: PluginManagerImpl.pluginUploadFolderToMonitor,
      callback: (fileWatcherPayload: FileWatcherPayload) => {
        //Update manifest
      }
    });
    me.postal.subscribe({
      channel: 'PluginManager',
      topic: 'GetPluginList',
      callback: (/*data*/) => {
        me.broadcastPluginList();
      }
    });
    me.postal.subscribe({
      channel: 'PluginManager',
      topic: 'LoadPlugins',
      callback: (data) => {
      }
    });
    cb(null, {message: 'Initialized PluginManager Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    const me = this;
    me.extractPlugins((err) => {
      if (me.commandUtil.logError(err)) {
        return;
      }
      me.catalogPlugins((err) => {
        if (me.commandUtil.logError(err)) {
          return;
        }
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
        cb(null, {message: 'Initialized PluginManager'});
      });
    });
  }

  private catalogPlugins(cb: (err) => void) {
    const me = this;
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
    //Blow away existing plugin extracts for a clean, fresh start
    rimraf(PluginManagerImpl.extractedPluginFolder, (err) => {
      if (me.commandUtil.logError(err)) {
        return;
      }
      mkdirp(PluginManagerImpl.extractedPluginFolder, (err) => {
        if (me.commandUtil.logError(err)) {
          return;
        }
        recursiveReaddir(PluginManagerImpl.pluginUploadFolderToMonitor, (err, files) => {
          if (me.commandUtil.logError(err)) {
            return;
          }
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
        })
      });
    });
  }

  private broadcastPluginList() {
    const me = this;
    /*    const clientPluginList = me.pluginManifests.map((pluginManifest) => {
     return {
     pluginManifest
     }
     });*/
    me.postal.publish({
      channel: 'WebSocket',
      topic: 'Broadcast',
      data: {
        channel: 'PluginTable'
        , topic: 'PluginList'
        , data: me.pluginManifests
        //data: clientPluginList
      }
    });
  }
}
