import kernel from '../inversify.config';
import {BaseService} from '../services/base-service';
import * as async from 'async';

module.exports = function (server, cb) {
  const allServices = kernel.getAll<BaseService>('BaseService');
  async.series([
    (cb) => {
      async.each(allServices, (service, cb) => {
        service.initSubscriptions(server, cb);
      }, cb);
    },
    (cb) => {
      async.each(allServices, (service, cb) => {
        service.init(cb);
      }, cb);
    }
  ], cb);
};
