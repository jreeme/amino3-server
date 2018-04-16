import {injectable, inject, multiInject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {Logger} from '../util/logging/logger';
import {BaseService} from '../services/base-service';
import {Globals} from '../globals';
import * as async from 'async';
import * as _ from 'lodash';

export interface ServiceManager {
  initSubscriptions(app: LoopBackApplication2, cb: (err?: Error) => void): void;

  services: BaseService[];
}

@injectable()
export class ServiceManagerImpl implements ServiceManager {
  private app: LoopBackApplication2;

  constructor(@inject('Logger') private log: Logger,
              @multiInject('BaseService') public services: BaseService[],
              @inject('IPostal') private postal: IPostal) {
  }

  initSubscriptions(app: LoopBackApplication2, cb?: (err?: Error, result?: any) => void): void {
    const me = this;
    me.app = app;
    if (Globals.noServices) {
      //Add default route to avoid error in browser if someone hits us when we're not running services
      //me.app.get('/', me.app.loopback.status());
      me.log.warning(`Amino3 services suppressed by AMINO3_NO_SERVICES environment variable or 'noServices' config`);
      //return cb();
    }
    //Sign up for 'loopback-booted' event so we can start up services
    me.postal
      .subscribe({
        channel: 'Amino3Startup',
        topic: 'loopback-booted',
        callback: me.loopbackBooted.bind(me)
      });
    cb();
  }

  private getEnabledServices(cb: (err: Error, enabledServices: BaseService[]) => void): void {
    const me = this;
    async.waterfall([
      (cb) => {
        //First, let's see what's in our ServerService database. Generally, the only time we won't have
        //services described there is if this is the first run of Amino3 or there's a bad DB error
        const SS = me.app.models.ServerService;
        SS.find({where: {enabled: false}}, (err, results) => {
          const suppressedServiceNames = (err || !results || !results.length)
            ? Globals.suppressedServices
            : results.map((result) => result.name);
          return cb(null, me._getEnabledServices(suppressedServiceNames));
        });
      }
    ], (err: Error, results: BaseService[]) => {
      cb(err, results);
    });
  }

  private _getEnabledServices(suppressedServices: string[]): BaseService[] {
    return this.services
      .filter((service) => {
        return !service.canBeDisabled || (-1 === _.findIndex(suppressedServices, (serviceName) => {
          return service.serviceName === serviceName;
        })) && !Globals.noServices;//<== filters all services if 'noServices' is set
      });
  }

  private loopbackBooted() {
    const me = this;
    me.log.debug(`[RECV] 'Amino3Startup:loopback-booted': starting Amino3 services`);
    //Set application object in services. Even if a service is not enabled it is still loaded
    //and may need to do some things with the application object.
    me.services.forEach((service) => {
      service.setApplicationObject(me.app);
    });
    //Initialize enabled services
    me.getEnabledServices((err, enabledServices) => {
      if (me.log.logIfError(err)) {
        return;
      }
      async.series([
        (cb) => {
          async.map(enabledServices, (service, cb) => {
            me.log.info(`Calling: ${service.serviceName}.initSubscriptions()`);
            service.initSubscriptions((err, result) => {
              me.log.debug(`${service.serviceName}.initSubscriptions(): called back`);
              cb(err, result);
            });
          }, cb);
        },
        (cb) => {
          async.map(enabledServices, (service, cb) => {
            me.log.info(`Calling: ${service.serviceName}.init()`);
            service.init((err, result) => {
              me.log.debug(`${service.serviceName}.init(): called back`);
              cb(err, result);
            });
          }, cb);
        },
        (cb) => {
          //Update ServerServices table
          const SS = me.app.models.ServerService;
          SS.destroyAll((err: Error/*,info:any*/) => {
            me.log.logIfError(err);
            const serverServices = me.services.map((service) => {
              return {
                name: service.serviceName,
                enabled: service.enabled,
                canBeDisabled: service.canBeDisabled
              };
            });
            SS.create(serverServices, (err) => {
              me.log.logIfError(err);
              cb();
            });
          });
        },
        (cb) => {
          //Update LoopbackModels table
          const LM = me.app.models.LoopbackModel;
          LM.destroyAll((err: Error/*,info:any*/) => {
            me.log.logIfError(err);
            const modelNames = Object.keys(me.app.models);
            const loopbackModels = modelNames.map((name) => {
              return {
                name
              };
            });
            LM.create(loopbackModels, (err) => {
              me.log.logIfError(err);
              cb();
            });
          });
        }
      ], (err: any, results: any[]) => {
        me.log.logIfError(err);
        me.log.debug('Service start results:');
        results.forEach((result) => {
          me.log.debug(JSON.stringify(result, null, 2));
        });
        !err && me.postal
          .publish({
            channel: 'Amino3Startup',
            topic: 'services-started'
          });
      });
    });
  }
}

