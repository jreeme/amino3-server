import {injectable, inject,} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseServiceImpl} from '../base-service';
import {Logger} from '../../util/logging/logger';
import * as fs from 'fs';
import * as path from 'path';
import {Util} from '../../util/util';
import {Globals} from '../../globals';

@injectable()
export class ServerServicesManagerImpl extends BaseServiceImpl {
  constructor(@inject('Logger') private log: Logger,
              @inject('IPostal') private postal: IPostal) {
    super();
  }

  initSubscriptions(cb: (err: Error, result: any) => void) {
    super.initSubscriptions();
    const me = this;
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
    cb(null, {message: 'Initialized ServerServicesManager'});
  }
}

