import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseServiceImpl} from '../base-service';
import {Logger} from '../../util/logging/logger';
import {diff} from 'just-diff';
import * as formidable from 'formidable';
import * as request from 'request';
import * as async from 'async';

@injectable()
export class FileUploadImpl extends BaseServiceImpl {
  constructor(@inject('Logger') private log:Logger,
              @inject('IPostal') private postal:IPostal) {
    super();
  }

  initSubscriptions(cb:(err:Error, result:any) => void) {
    const me = this;
    super.initSubscriptions();
    me.postal.subscribe({
      channel: me.servicePostalChannel,
      topic: 'TmpCompareLoopbackModels',
      callback: me.tmpCompareLoopbackModels.bind(me)
    });
    me.postal.subscribe({
      channel: me.servicePostalChannel,
      topic: 'Upload',
      callback: me.handleUploadRequest.bind(me)
    });
    cb(null, {message: 'Initialized FileUpload Subscriptions'});
  }

  init(cb:(err:Error, result:any) => void) {
    cb(null, {message: 'Initialized FileUpload'});
  }

  // noinspection JSUnusedLocalSymbols
  private tmpCompareLoopbackModels(data, env) {
    const me = this;
    async.waterfall([
      (cb) => {
        request(data.info.sourceModels, (err, res, body) => {
          cb(err, body);
        });
      },
      (sourceBody, cb) => {
        request(data.info.targetModels, (err, res, body) => {
          cb(err, sourceBody, body);
        });
      },
      (sourceBody, targetBody, cb) => {
        const source = JSON.parse(sourceBody);
        const target = JSON.parse(targetBody);
        [source, target].forEach((oo:any[]) => {
          oo.forEach((o) => {
            delete o.atime;
            delete o.mtime;
            delete o.ctime;
            delete o.size;
            delete o.container;
          });
        });
        data.cb(null, diff(source, target));
        cb();
      }
    ], (err) => {
    });
  }

  // noinspection JSUnusedLocalSymbols
  private handleUploadRequest(data, env) {
    const {req, res, cb} = data;
    const form = new formidable.IncomingForm();

    (<any>form).maxFileSize = parseInt(req.query.maxSingleFileUploadSizeBytes || 16 * 1024 * 1024);
    const files = [];
    const fields = {};
    form.on('field', (field, value) => {
      fields[field] = value;
    });
    form.on('file', (field, file) => {
      files.push(file);
    });
    form.on('error', (error) => {
      return res.status(417).send({status: 'error', error});
    });
    form.on('end', () => {
      try {
        cb(fields, files, (err:Error) => {
          if(err) {
            return res.status(417).send({status: err.message});
          }
          res.status(200).send({status: 'OK'});
        });
      }
      catch(err) {
        return res.status(500).send({status: 'Unknown Server Error'});
      }
    });
    form.parse(req);
  }
}

