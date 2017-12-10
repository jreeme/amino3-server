import {injectable, inject} from 'inversify';
import {CommandUtil, IPostal} from 'firmament-yargs';
import {BaseService} from '../interfaces/base-service';
import {ProcessCommandJson} from 'firmament-bash/js/interfaces/process-command-json';
import {Globals} from '../../globals';
import {LoopBackApplication2} from '../../custom-typings';
import {LogService} from '../interfaces/log-service';
import {FileUpload} from "../interfaces/file-upload";

//noinspection JSUnusedGlobalSymbols
@injectable()
export class FileUploadImpl implements FileUpload {
  private static fileUploaderOptions = {
    tmpDir: Globals.uploadedFilesTmpFolder,
    uploadDir: Globals.uploadedFilesFolder,
    uploadUrl: Globals.uploadFileUrl,
    storage: {
      type: 'local'
    }
  };

  private static fileUploader = require(Globals.fileUploaderPath)(FileUploadImpl.fileUploaderOptions);

  constructor(@inject('BaseService') private baseService: BaseService,
              @inject('ProcessCommandJson') private processCommandJson: ProcessCommandJson,
              @inject('LogService') private log: LogService,
              @inject('CommandUtil') private commandUtil: CommandUtil,
              @inject('IPostal') private postal: IPostal) {
  }

  get server(): LoopBackApplication2 {
    return this.baseService.server;
  }

  initSubscriptions(cb: (err: Error, result: any) => void) {
    cb(null, {message: 'Initialized FileUpload Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    const me = this;
    me.server.get(Globals.uploadFileGetUrl, function (req, res) {
      FileUploadImpl.fileUploader.get(req, res, function (err, obj) {
        res.send(JSON.stringify(obj));
      });
    });
    me.server.post(Globals.uploadFilePostUrl, function (req, res) {
      FileUploadImpl.fileUploader.post(req, res, function (err, uploadedFileInfo) {
        return res.status(200).send({status: err ? 'error' : 'OK', error: err});
      });
    });
    me.server.delete(Globals.uploadFileDeleteUrl, function (req, res) {
      FileUploadImpl.fileUploader.delete(req, res, function (err, result) {
        res.send(JSON.stringify(result));
      });
    });
    cb(null, {message: 'Initialized FileUpload'});
  }
}
