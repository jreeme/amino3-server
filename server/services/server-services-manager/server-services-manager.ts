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
import * as tmp from 'tmp';
import * as mkdirp from 'mkdirp';
import {ProcessCommandJson} from "firmament-bash/js/interfaces/process-command-json";

interface NamedObject {
  name: string
}

interface TarManifest {
  loopbackFileRelativePaths: string[]
}

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
    me.app.post('/download-services-and-models-tar', me.downloadServicesAndModelsTar.bind(me));
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

  private downloadServicesAndModelsTar(req, res) {
    const me = this;
    const tarManifest: TarManifest = {
      loopbackFileRelativePaths: []
    };
    async
      .waterfall([
        (cb) => {
          tmp.dir({unsafeCleanup: true}, (err: Error, tmpDir: string, cbCleanup: () => void) => {
            cbCleanup();
            cb(err, tmpDir);
          });
        },
        (tmpDir, cb) => {
          ServerServicesManagerImpl.copyLoopbackModelFilesToTmpDir(req.body.loopbackModels, tmpDir, tarManifest, cb);
        }
      ], (err, result) => {
        res.status(500).send({status: 'OK'});
      });
  }

  private static copyLoopbackModelFilesToTmpDir(
    loopbackModels: NamedObject[],
    tmpDir: string,
    tarManifest: TarManifest,
    cb: (err: Error) => void) {
    const dstFolder = path.resolve(tmpDir, Globals.loopbackModelRelativePath);
    mkdirp(dstFolder, (err) => {
      async.each(loopbackModels, (loopbackModel, cb) => {
        async.each(['.js', '.json'], (fileExtension, cb) => {
          const {srcFilePath, dstFilePath, loopbackModelRelativePath} =
            ServerServicesManagerImpl.getLoopbackModelProcessingPaths(loopbackModel, fileExtension, dstFolder);
          fs.copyFile(srcFilePath, dstFilePath, (err) => {
            if (err) {
              return cb();
            }
            //Make note of copied LoopbackModel files in manifest
            tarManifest.loopbackFileRelativePaths.push(loopbackModelRelativePath);
            return cb();
          });
        }, (err: Error) => {
          cb(err);
        });
      }, (err: Error) => {
        cb(err);
      });
    });
  }

  private static getLoopbackModelProcessingPaths(loopbackModel: NamedObject, fileExtension: string, dstFolder: string) {
    const loopbackModelFilename = `${Util.camelToKebab(loopbackModel.name)}${fileExtension}`;
    const loopbackModelRelativePath = `${Globals.loopbackModelRelativePath}/${loopbackModelFilename}`;
    const srcFilePath = path.resolve(Globals.projectRootPath, loopbackModelRelativePath);
    const dstFilePath = path.resolve(dstFolder, loopbackModelFilename);
    return {srcFilePath, dstFilePath, loopbackModelRelativePath};
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

