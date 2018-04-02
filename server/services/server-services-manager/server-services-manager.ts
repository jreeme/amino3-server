import {injectable, inject,} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseServiceImpl} from '../base-service';
import {Logger} from '../../util/logging/logger';
import {ServiceManager} from '../../startup/service-manager';
import kernel from '../../inversify.config';
import * as fs from 'fs';

@injectable()
export class ServerServicesManagerImpl extends BaseServiceImpl {
  private serviceManager: ServiceManager;

  constructor(@inject('Logger') private log: Logger,
              @inject('IPostal') private postal: IPostal) {
    super();
  }

  initSubscriptions(cb: (err: Error, result: any) => void) {
    super.initSubscriptions();
    const me = this;
    me.serviceManager = kernel.get<ServiceManager>('ServiceManager');
    me.app.get('/download-service-tar/:serviceName', (req, res) => {
      const memoryStreams = require('memory-streams');
      const writer = new memoryStreams.WritableStream();
      //const writer = fs.createWriteStream('/home/jreeme/tmp/test.tar.gz');
      const pack = require('tar-pack').pack;
      const packStream = pack('/home/jreeme/src/amino3-server/server/services/remote-logging');
      packStream
        .on('close', () => {
          }
        );
      writer
        .on('finish', () => {
            let aa = writer.toBuffer();
            let a = 3;
          }
        );
      packStream.pipe(writer);
      /*        .pipe(writer)
              .on('readable', () => {
                let a = 3;
                //const buf = writer.toBuffer();
              })
              .on('close', () => {
                let a = 3;
                //const buf = writer.toBuffer();
              })
              .on('error', (err) => {
                let a = 3;
                //const buf = writer.toBuffer();
              });*/


      /*      const file = fs.readFileSync('/home/jreeme/src/amino3-server/server/plugins-dist/_forms.tar.gz');
            res.set('x-amino-service-filename', 'glipper-fing.tar.gz');
            res.status(200).send(file);*/
    });
    cb(null, {message: 'Initialized ServerServicesManager Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    cb(null, {message: 'Initialized ServerServicesManager'});
  }
}

