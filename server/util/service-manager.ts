import {injectable, inject, multiInject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {Logger} from './logging/logger';
import {BaseService} from '../services/base-service';
import {Globals} from '../globals';
import * as async from 'async';
import * as _ from 'lodash';

export interface ServiceManager {
  initSubscriptions(app: LoopBackApplication2, cb: (err?: Error) => void): void;
}

@injectable()
export class ServiceManagerImpl implements ServiceManager {
  constructor(@inject('Logger') private log: Logger,
              @multiInject('BaseService') private services: BaseService[],
              @inject('IPostal') private postal: IPostal) {
  }

  initSubscriptions(app: LoopBackApplication2, cb?: (err?: Error, result?: any) => void): void {
    const me = this;
    if (Globals.noServices) {
      me.log.warning(`Amino3 services suppressed by AMINO3_NO_SERVICES environment variable or 'noServices' config`);
      //Add default route to avoid error in browser if someone hits us when we're not running services
      app.get('/', app.loopback.status());
    }
    app.get('/hack-get-services', (req, res) => {
      res.status(200).send(me.services.map((service) => service.serviceName).sort());
    });
    //Sign up for 'loopback-booted' event so we can start up services
    me.postal
      .subscribe({
        channel: 'Amino3Startup',
        topic: 'loopback-booted',
        callback: () => {
          me.log.debug(`[RECV] 'Amino3Startup:loopback-booted': starting Amino3 services`);
          //Put services and their enabled state in the database
          const SS = app.models.ServerService;
          SS.destroyAll((err, results) => {
            const serverServices = me.services.map((service) => {
              return {
                name: service.serviceName,
                enabled: !!me.enabledServices.find((element) => {
                  return element.serviceName === service.serviceName;
                })
              };
            });
            SS.create(serverServices, (err) => {
              me.log.logIfError(err);
            });
          });
          //Initialize enabled services
          async.series([
            (cb) => {
              async.map(me.enabledServices, (service, cb) => {
                service.initSubscriptions(app, cb);
              }, cb);
            },
            (cb) => {
              async.map(me.enabledServices, (service, cb) => {
                service.init(cb);
              }, cb);
            }
          ], (err: any, results: any[]) => {
            me.log.logIfError(err);
            results.forEach((result) => {
              const msg = JSON.stringify(result, null, 2);
              me.log.debug(msg);
            });
            !err && me.postal
              .publish({
                channel: 'Amino3Startup',
                topic: 'services-started'
              });
          });
        }
      });
    return cb();
  }

  private get enabledServices(): any[] {
    return this.services
      .filter((service) => {
        return (-1 === _.findIndex(Globals.suppressedServices, (serviceName) => {
          return service.serviceName === serviceName;
        })) && !Globals.noServices;//<== filters all services if 'noServices' is set
      });
  }
}
