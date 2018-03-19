import {injectable, inject, multiInject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseService, BaseServiceImpl} from '../base-service';
import {Logger} from '../../util/logging/logger';
import {Globals} from '../../globals';
import kernel from '../../inversify.config';

@injectable()
export class ServerServicesManagerImpl extends BaseServiceImpl {
  constructor(@inject('Logger') private log: Logger,
              //@multiInject('BaseService') private services: BaseService[],
              @inject('IPostal') private postal: IPostal) {
    super();
  }

  initSubscriptions(app: LoopBackApplication2, cb: (err: Error, result: any) => void) {
    super.initSubscriptions(app);
    cb(null, {message: 'Initialized ServerServicesManager Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    const me = this;
    const SS = me.app.models.ServerService;
    SS.destroyAll((err, results) => {
      const serverServices = kernel.getAll<BaseService>('BaseService');
      const serviceNames = serverServices.map((service) => {
        return {name: service.serviceName};
      });
      SS.create(serviceNames, (err, results) => {
        cb(null, {message: 'Initialized ServerServicesManager'});
      });
    });
    /*    me.app.post(Globals.remoteLoggingUrl, (req, res) => {
          me.log.logFromRemoteClient(req.body);
          res.status(200).json({status: 'OK'});
        });*/
  }
}

