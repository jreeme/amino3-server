import kernel from '../inversify.config';
import {BaseService} from '../services/base-service';
import * as async from 'async';
import {Logger} from "../util/logging/logger";

module.exports = function (server, cb) {
  const allServices: any[] = kernel.getAll<BaseService>('BaseService');
  /*  return cb();*/

  async.series([
    (cb) => {
      async.map(allServices, (service, cb) => {
        service.initSubscriptions(server, cb);
      }, cb);
    },
    (cb) => {
      async.map(allServices, (service, cb) => {
        service.init(cb);
      }, cb);
    }
  ], (err, results) => {
    const log = kernel.get<Logger>('Logger');
    results.forEach((result) => {
      log.debug(JSON.stringify(result, null, 2));
    });
    cb(err);
  });
};
