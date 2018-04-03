import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseServiceImpl} from '../base-service';
import {Globals} from '../../globals';
import {Logger} from '../../util/logging/logger';
import * as formidable from 'formidable';

@injectable()
export class FileUploadImpl extends BaseServiceImpl {
  constructor(@inject('Logger') private log: Logger,
              @inject('IPostal') private postal: IPostal) {
    super();
  }

  initSubscriptions(cb: (err: Error, result: any) => void) {
    super.initSubscriptions();
    const me = this;
    me.postal.subscribe({
      channel: me.servicePostalChannel,
      topic: 'AddFileUploadEndpoint',
      callback: (data) => {
        me.app.post(data.uploadRoute, (req, res) => {
          try {
            const form = new formidable.IncomingForm();
            (<any>form).maxFileSize = 25 * 1024;
            form.parse(req, (err, fields, files) => {
              if (err) {
                return res.status(500).send({status: 'error', error: err});
              }
              data.cb(fields, files);
              res.status(500).send({status: 'OK'});
            });
          } catch (err) {
            res.status(500).send({status: 'error', error: err});
          }
        });
      }
    });
    cb(null, {message: 'Initialized FileUpload Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    cb(null, {message: 'Initialized FileUpload'});
  }
}

