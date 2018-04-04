import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseServiceImpl} from '../base-service';
import {Logger} from '../../util/logging/logger';
import * as formidable from 'formidable';

interface AddFileUploadEndpointPostalData {
  uploadRoute: string,
  cb: any
}

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
      callback: (data: AddFileUploadEndpointPostalData) => {
        me.app.post(data.uploadRoute, (req, res) => {
          const form = new formidable.IncomingForm();
          (<any>form).maxFileSize = 25 * 1024;
          const files = [];
          const fields = {};
          form.on('field', (field, value) => {
            fields[field] = value;
          });
          form.on('file', (field, file) => {
            files.push(file);
          });
          form.on('error', (error) => {
            return res.status(500).send({status: 'error', error});
          });
          form.on('end', () => {
            data.cb(fields, files);
            res.status(200).send({status: 'OK'});
          });
          form.parse(req);
        });
      }
    });
    cb(null, {message: 'Initialized FileUpload Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    cb(null, {message: 'Initialized FileUpload'});
  }
}

