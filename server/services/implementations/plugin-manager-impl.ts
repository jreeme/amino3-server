import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseService} from '../interfaces/base-service';
import path = require('path');
import fs = require('fs');
import async = require('async');
import tar = require('tar');
import {PluginManager} from "../interfaces/plugin-manager";

@injectable()
export class PluginManagerImpl implements PluginManager {
  private static folderToMonitor = path.resolve(__dirname, '../../amino3-plugins/files');

  private static fileUploaderOptions = {
    tmpDir: path.resolve(__dirname, '../../amino3-plugins/tmp'),
    uploadDir: PluginManagerImpl.folderToMonitor,
    uploadUrl: '/amino3-plugins/files',
    storage: {
      type: 'local'
    }
  };

  private static fileUploader = require('../../util/blueimp-file-upload-expressjs/fileupload')(PluginManagerImpl.fileUploaderOptions);

  private pluginList: FileWatcherPayload[] = [];

  constructor(@inject('BaseService') private baseService: BaseService,
              @inject('IPostal') private postal: IPostal) {
    //this.server.on('started', () => { });
  }

  get server(): any {
    return this.baseService.server;
  }

  initSubscriptions(cb: (err: Error, result: any) => void) {
    const me = this;
    me.postal.subscribe({
      channel: 'FolderMonitor',
      topic: PluginManagerImpl.folderToMonitor,
      callback: (fileWatcherPayload: FileWatcherPayload) => {
        me.pluginList.push(fileWatcherPayload);
        me.broadcastPluginList();
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
        /*        const tarTargetFolder = path.resolve(__dirname, '../client/source/src/app/pages/plugins');
         tar.x({
         file: data.fileFullPath,
         C: tarTargetFolder
         }).then(() => {

         });*/
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
        folderMonitorPath: PluginManagerImpl.folderToMonitor,
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
        /*        if (err) {
         return res.status(200).send({status: 'error', error: err});
         }
         async.each(uploadedFileInfo.files, (file, cb) => {
         try {
         const fileFullPath = path.resolve(file.options.uploadDir, file.name);
         me.postal.publish({
         channel: 'PluginManager',
         topic: 'LoadPlugins',
         data: {fileFullPath}
         });
         } catch (err) {
         console.log(err);
         cb();
         }
         }, (err) => {
         return res.status(200).send({status: err ? 'error' : 'OK', error: err});
         });*/
      });
    });
    me.server.delete('/uploaded/files/:name', function (req, res) {
      PluginManagerImpl.fileUploader.delete(req, res, function (err, result) {
        res.send(JSON.stringify(result));
      });
    });
    cb(null, {message: 'Initialized PluginManager'});
  }

  private broadcastPluginList() {
    const me = this;
    const clientPluginList = me.pluginList.map((plugin) => {
      return {
        pluginName: plugin.fullPath.split('\\').pop().split('/').pop()
      }
    });
    me.postal.publish({
      channel: 'WebSocket',
      topic: 'Broadcast',
      data: {
        channel: 'PluginTable',
        topic: 'PluginList',
        data: clientPluginList
      }
    });
  }
}
