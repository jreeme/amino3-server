import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseServiceImpl} from '../base-service';
import {Logger} from '../../util/logging/logger';
import {diff} from 'just-diff';
import * as formidable from 'formidable';
import * as request from 'request';
import * as async from 'async';

const {URL} = require('url');

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
      topic: 'CompareLoopbackModels',
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
        const sources = JSON.parse(sourceBody).filter((source) => source.name.endsWith('.json'));
        const targets = JSON.parse(targetBody).filter((source) => source.name.endsWith('.json'));
        const modelsRemoved = [];
        sources.forEach((source) => {
          //Is there a corresponding target file?
          if(targets.filter((target) => target.name === source.name).length === 0) {
            modelsRemoved.push(source);
          }
        });
        const modelsAdded = [];
        const modelDeltas = {};
        async.each(targets, (target:any, cb) => {
          //Is there a corresponding source file?
          if(sources.filter((source) => target.name === source.name).length === 0) {
            modelsAdded.push(target);
            cb();
          } else {
            //Let's compare the source & target models
            let url = new URL(data.info.sourceModels);
            const sourcePath = url.pathname.split('/');
            const sourceUrl = `${url.origin}/${sourcePath[1]}/${sourcePath[2]}/${sourcePath[3]}/download/${target.name}`;
            url = new URL(data.info.targetModels);
            const targetPath = url.pathname.split('/');
            const targetUrl = `${url.origin}/${targetPath[1]}/${targetPath[2]}/${targetPath[3]}/download/${target.name}`;
            async.parallel([
              (cb) => {
                request(sourceUrl, (err, res, body) => {
                  cb(err, JSON.parse(body));
                });
              },
              (cb) => {
                request(targetUrl, (err, res, body) => {
                  cb(err, JSON.parse(body));
                });
              }
            ], (err, results) => {
              const d = diff(results[0], results[1]);
              if(d.length){
                modelDeltas[target.name] = d;
              }
              cb();
            });
          }
        }, (err:Error) => {
          cb(null, {added: modelsAdded, removed: modelsRemoved, modelDeltas});
        });
      }
    ], (err, results) => {
      data.cb(null, results);
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

