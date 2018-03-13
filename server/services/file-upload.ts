import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseService, BaseServiceImpl} from './base-service';
import {Globals} from '../globals';
import {Logger} from '../util/logging/logger';
import * as formidable from 'formidable';
import kernel from '../inversify.config';
import * as path from 'path';

var i = 3;

@injectable()
export class FileUploadImpl extends BaseServiceImpl {
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
    me.app.post(Globals.uploadFilePostUrl, (req, res) => {
      try {
        const form = new formidable.IncomingForm();
        form.maxFileSize = 1024 * 1024 * 1024;
        form.parse(req, (err, fields, files) => {
          let e = err;
        });
      } catch (err) {
        res.status(500).send({status: 'error', error: err});
      }
    });
    cb(null, {message: 'Initialized FileUpload'});
  }
}
