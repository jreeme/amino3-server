import {injectable, inject,} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseServiceImpl} from '../base-service';
import {Logger} from '../../util/logging/logger';

@injectable()
export class ServerServicesManagerImpl extends BaseServiceImpl {
  constructor(@inject('Logger') private log: Logger,
              @inject('IPostal') private postal: IPostal) {
    super();
  }

  initSubscriptions(app: LoopBackApplication2, cb: (err: Error, result: any) => void) {
    super.initSubscriptions(app);
    const me = this;
    me.app.get('/download-service-tar/:serviceName', (req, res) => {
      res.status(200).json({status: 'OK'});
    });
    cb(null, {message: 'Initialized ServerServicesManager Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    cb(null, {message: 'Initialized ServerServicesManager'});
    /*    me.app.post(Globals.remoteLoggingUrl, (req, res) => {
          me.log.logFromRemoteClient(req.body);
          res.status(200).json({status: 'OK'});
        });*/
  }
}

