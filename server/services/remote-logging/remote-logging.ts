import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseServiceImpl} from '../base-service';
import {Logger} from '../../util/logging/logger';
import {Globals} from '../../globals';

@injectable()
export class RemoteLoggingImpl extends BaseServiceImpl {
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
    me.app.post(Globals.remoteLoggingUrl, (req, res) => {
      res.status(200).json({status: 'OK'});
    });
    cb(null, {message: 'Initialized FileUpload'});
  }
}

