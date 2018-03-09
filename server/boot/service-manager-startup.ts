import kernel from '../inversify.config';
import {BaseService} from '../services/base-service';
import {Logger} from '../util/logging/logger';
import {IPostal} from 'firmament-yargs';
import {Globals} from '../globals';
import * as async from 'async';
import * as _ from 'lodash';

module.exports = function (app, cb) {
  const log = kernel.get<Logger>('Logger');
  const postal = kernel.get<IPostal>('IPostal');
  //Sign up for 'booted' event so we can start up services
  postal
    .subscribe({
      channel: 'Amino3Startup',
      topic: 'loopback-booted',
      callback: () => {
        log.debug(`[RECV] 'Amino3Startup:loopback-booted': starting Amino3 services`);
        const filteredServices: any[] = kernel.getAll<BaseService>('BaseService')
          .filter((service) => {
            return -1 === _.findIndex(Globals.suppressedServices, (serviceName) => {
              return service.serviceName === serviceName;
            });
          });
        async.series([
          (cb) => {
            async.map(filteredServices, (service, cb) => {
              //service.initSubscriptions(app, cb);
              service.initSubscriptions(app, (err, result) => {
                log.debug(result.message);
                cb(err, result);
              });
            }, cb);
          },
          (cb) => {
            async.map(filteredServices, (service, cb) => {
              service.init(cb);
            }, cb);
          }
        ], (err, results) => {
          results.forEach((result) => {
            log.debug(JSON.stringify(result, null, 2));
          });
          !err && postal
            .publish({
              channel: 'Amino3Startup',
              topic: 'services-started'
            });
        });
      }
    });
  cb();
};
