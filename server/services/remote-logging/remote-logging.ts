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

  initSubscriptions(cb: (err: Error, result: any) => void) {
    super.initSubscriptions();
    const me = this;
    me.postal
      .subscribe({
        channel: 'RemoteLogging',
        topic: 'IncomingMessage',
        callback: (data) => {
          me.log.logFromRemoteClient(data);
        }
      });
    cb(null, {message: 'Initialized RemoteLogging Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    cb(null, {message: 'Initialized RemoteLogging'});
  }
}

