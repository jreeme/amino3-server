import {injectable, inject,} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseServiceImpl} from '../base-service';
import {Logger} from '../../util/logging/logger';
import {Util} from '../../util/util';
import {Globals} from '../../globals';
import * as fs from 'fs';
import * as path from 'path';
import * as rimraf from 'rimraf';
import * as async from 'async';
import {ProcessCommandJson} from "firmament-bash/js/interfaces/process-command-json";

@injectable()
export class ServerServicesManagerImpl extends BaseServiceImpl {
  constructor(@inject('Logger') private log: Logger,
              @inject('ProcessCommandJson') private processCommandJson: ProcessCommandJson,
              @inject('IPostal') private postal: IPostal) {
    super();
  }

  initSubscriptions(cb: (err: Error, result: any) => void) {
    super.initSubscriptions();
    const me = this;
    me.app.get('/destroy-service/:serviceName', (req, res) => {
      const serviceName = Util.camelToKebab(req.params.serviceName);
      const serviceFolderToDelete = path.resolve(Globals.serverServicesFolder, serviceName);
      async
        .series([
            (cb) => {
              //Blast service directory
              rimraf(serviceFolderToDelete, (err) => {
                cb(err);
              });
            },
            (cb) => {
              //Remove service entry from Inversify config file
              const lineDriver = require('line-driver');
              lineDriver.write({
                in: Globals.inversifyConfigFilePath,
                line: (props, parser) => {
                  if (parser.line.indexOf(req.params.serviceName) === -1) {
                    parser.write(parser.line);
                  }
                },
                close: (/*props, parser*/) => {
                  cb();
                }
              });
            },
            (cb) => {
              //Recompile server
              process.chdir(Globals.serverFolder);
              me.processCommandJson.processAbsoluteUrl(Globals.npmRebuildServerExecutionGraph, cb);
            }
          ],
          (err) => {
            if (err) {
              return res.status(417).send(err);
            }
            res.status(200).send({status: 'OK'});
          });
    });
    me.app.get('/download-service-tar/:serviceName', (req, res) => {
      const serviceName = Util.camelToSnake(req.params.serviceName, '-');
      const serviceFolderToSend = path.resolve(Globals.serverServicesFolder, serviceName);

      fs.stat(serviceFolderToSend, (err, stats) => {
        if (err) {
          return res.status(417).send(err);
        }
        if (!stats.isDirectory()) {
          return res.status(417).send(new Error('Unknown directory'));
        }
        const memoryStreams = require('memory-streams');
        const writer = new memoryStreams.WritableStream();
        const pack = require('tar-pack').pack;
        const packStream = pack(serviceFolderToSend);
        writer
          .on('finish', () => {
              res.set('x-amino-service-filename', `${serviceName}.tar.gz`);
              res.status(200).send(writer.toBuffer());
            }
          );
        packStream.pipe(writer);
      });
    });
    cb(null, {message: 'Initialized ServerServicesManager Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    const me = this;
    me.postal.publish({
      channel: 'PostalChannel-FileUploadImpl',
      topic: 'AddFileUploadEndpoint',
      data: {
        uploadRoute: Globals.serverServiceUploadFileUrl,
        cb: me.turnTarFilesIntoServerServices.bind(me)
      }
    });

    cb(null, {message: 'Initialized ServerServicesManager'});
  }

  private turnTarFilesIntoServerServices(files: any[], cb: (err?: Error) => void) {
    const me = this;
    (files && files.length) && files.forEach((file) => {
      const unpack = require('tar-pack').unpack;
      const readStream = fs.createReadStream(file.path);
      const serviceFileName = path.basename(file.name, '.tar.gz');
      const packStream = unpack(Globals.serverServicesFolder,
        {
          strip: 0,
          keepFiles: true
        },
        (err) => {
          if (err) {
            me.log.logIfError(new Error(`Unpack '${file.path}' FAILED: ${err.message}`));
            return cb(err);
          }
          //Add service entry to Inversify config file
          const serviceClassName = `${Util.kebabToCamel(serviceFileName)}Impl`;
          const lineDriver = require('line-driver');
          lineDriver.write({
            in: Globals.inversifyConfigFilePath,
            line: (props, parser) => {
              if (parser.line.indexOf(serviceClassName) === -1) {
                parser.write(parser.line);
              }
            },
            close: (props, parser) => {
              parser.write(`import {${serviceClassName}} from './services/${serviceFileName}/${serviceFileName}';`);
              parser.write(`kernel.bind<BaseService>('BaseService').to(${serviceClassName}).inSingletonScope();`);
              cb();
            }
          });
        });
      readStream.pipe(packStream);
    });
  }
}

