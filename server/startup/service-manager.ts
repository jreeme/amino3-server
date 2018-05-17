import {injectable, inject, multiInject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {Logger} from '../util/logging/logger';
import {BaseService} from '../services/base-service';
import {Globals} from '../globals';
import * as async from 'async';
import * as _ from 'lodash';
import * as moment from 'moment';

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
    me.log.debug('Subscribing to Postal[Amino3Startup:loopback-booted]');
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
    me.log.info(`[RECV] 'Amino3Startup:loopback-booted': starting Amino3 services`);
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
            me.callInitSubscriptionOrInit.bind(me)(service, 'initSubscriptions', cb);
          }, cb);
        },
        (cb) => {
          async.map(enabledServices, (service, cb) => {
            me.callInitSubscriptionOrInit.bind(me)(service, 'init', cb);
          }, cb);
        },
        (cb) => {
          //Update ServerServices table
          me.destroyAllAndCreate(
            me.app.models.ServerService,
            me.services.map((service) => ({
              name: service.serviceName,
              enabled: service.enabled,
              canBeDisabled: service.canBeDisabled
            })),
            cb);
        },
        (cb) => {
          //Update LoopbackModels table
          me.destroyAllAndCreate(
            me.app.models.LoopbackModel,
            Object.keys(me.app.models).map((name) => ({name})),
            cb);
        }
      ], (err: Error/*, results: any[]*/) => {
        me.log.logIfError(err);
        me.log.debug('Service start results:');
        /*        for (let i = 0; i < results.length; ++i) {
                  if (i === 0 || i === 1) {
                    me.log.notice(JSON.stringify(results[i], null, 2));
                  }
                  else if (i === 2 || i === 3) {
                    me.log.debug(JSON.stringify(results[i], null, 2));
                  }
                }*/
        me.log.info(`[SEND] 'Amino3Startup:services-started'`);
        me.postal
          .publish({
            channel: 'Amino3Startup',
            topic: 'services-started'
          });
      });
    });
  }

  private destroyAllAndCreate(loopbackModel, modelsToAdd: any[], cb: (err: Error, callbackResult: any) => void) {
    const me = this;
    const callbackResult = {destroyAllResults: null, createResults: null};
    loopbackModel.destroyAll((err: Error, destroyAllResults: any) => {
      me.log.logIfError(err);
      callbackResult.destroyAllResults = destroyAllResults;
      loopbackModel.create(modelsToAdd, (err, createResults) => {
        me.log.logIfError(err);
        callbackResult.createResults = createResults;
        cb(null, callbackResult);
      });
    });
  }

  private callInitSubscriptionOrInit(service: BaseService, methodName: string, cb: (err: Error, result: any) => void) {
    const me = this;
    const startTime = moment();
    me.log.info(`Calling: ${service.serviceName}.${methodName}()`);
    (service[methodName])((err, result) => {
      const durationMS = moment.duration(moment().diff(startTime)).as('milliseconds');
      me.log.info(`${service.serviceName}.${methodName}(): called back. Took ${durationMS} milliseconds`);
      //cb(err, result);
      cb(null, result);
    });
  }
}

