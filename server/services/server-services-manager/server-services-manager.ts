import {injectable, inject,} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseServiceImpl} from '../base-service';
import {Logger} from '../../util/logging/logger';
import {ServiceManager} from '../../util/service-manager';
import kernel from '../../inversify.config';

@injectable()
export class ServerServicesManagerImpl extends BaseServiceImpl {
  private serviceManager: ServiceManager;

  constructor(@inject('Logger') private log: Logger,
              @inject('IPostal') private postal: IPostal) {
    super();
  }

  initSubscriptions(app: LoopBackApplication2, cb: (err: Error, result: any) => void) {
    super.initSubscriptions(app);
    const me = this;
    me.serviceManager = kernel.get<ServiceManager>('ServiceManager');
    me.app.get('/download-service-tar/:serviceName', (req, res) => {
      res.status(200).json({status: 'OK'});
    });
    me.app.get('/hack-get-services', (req, res) => {
      res.status(200).send(me.serviceManager.services.map((service) => service.serviceName).sort());
    });
    cb(null, {message: 'Initialized ServerServicesManager Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    const me = this;
    const SS = me.app.models.ServerService;
    SS.destroyAll((/*err:Error,info:any*/) => {
      const serverServices = me.serviceManager.services.map((service) => {
        return {
          name: service.serviceName,
          enabled: service.enabled
        };
      });
      SS.create(serverServices, (err) => {
        me.log.logIfError(err);
        cb(null, {message: 'Initialized ServerServicesManager'});
      });
    });
  }
}

