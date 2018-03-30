import {injectable, inject,} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseServiceImpl} from '../base-service';
import {Logger} from '../../util/logging/logger';
import {ServiceManager} from '../../startup/service-manager';
import kernel from '../../inversify.config';

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
      res.status(200).json({status: 'OK'});
    });
    cb(null, {message: 'Initialized ServerServicesManager Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    cb(null, {message: 'Initialized ServerServicesManager'});
  }
}

