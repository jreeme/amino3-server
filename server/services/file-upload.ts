import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseServiceImpl} from './base-service';
import {Globals} from '../globals';
import {Logger} from '../util/logging/logger';

const path = require('path');

@injectable()
export class FileUploadImpl extends BaseServiceImpl {
  private static fileUploaderOptions = {
    tmpDir: Globals.uploadedFilesTmpFolder,
    uploadDir: Globals.uploadedFilesFolder,
    uploadUrl: Globals.uploadFileUrl,
    copyImgAsThumb: false,
    storage: {
      type: 'local'
    }
  };

  private static fileUploader = require(Globals.fileUploaderPath)(FileUploadImpl.fileUploaderOptions);

  constructor(@inject('Logger') private log: Logger,
              @inject('IPostal') private postal: IPostal) {
    super();
  }

  initSubscriptions(server: LoopBackApplication2, cb: (err: Error, result: any) => void) {
    super.initSubscriptions(server);
    cb(null, {message: 'Initialized FileUpload Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    const me = this;
    /*
    TODO: Need to patch supporting code. file.path expected to exist
    me.server.get(Globals.uploadFileGetUrl, (req, res) => {
          try {
            FileUploadImpl.fileUploader.get(req, res, (/!*err, obj*!/) => {
              res.status(200).send({status: 'OK'});
            });
          } catch (err) {
            res.status(500).send({status: 'error', error: err});
          }
        });*/
    me.server.post(Globals.uploadFilePostUrl, (req, res) => {
      try {
        FileUploadImpl.fileUploader.post(req, res,
          (err, uploadedFilesInfo: UploadedFilesInfo) => {
            const UF = me.server.models.UploadedFile;
            const uploadedFiles =
              uploadedFilesInfo.files.map((fileInfo: UploadedFileInfo) => {
                const uri = path.resolve(fileInfo.options.uploadDir, fileInfo.name);
                return {
                  name: fileInfo.name,
                  type: fileInfo.type,
                  size: fileInfo.size,
                  uri
                }
              });
            UF.create(uploadedFiles, (err, /*result*/) => {
              res.status(200).send({status: err ? 'error' : 'OK', error: err});
            });
          });
      } catch (err) {
        res.status(500).send({status: 'error', error: err});
      }
    });
    /*    me.server.delete(Globals.uploadFileDeleteUrl, (req, res) => {
          try {
            FileUploadImpl.fileUploader.delete(req, res, (err, result) => {
              res.send(JSON.stringify(result));
            });
          } catch (err) {
            res.status(500).send({status: 'error', error: err});
          }
        });*/
    cb(null, {message: 'Initialized FileUpload'});
  }
}

