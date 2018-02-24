import kernel from '../inversify.config';
import {ServiceManager} from '../services/interfaces/service-manager';
import {BaseService} from '../services/interfaces/base-service';
import {LogService} from "../services/interfaces/log-service";

module.exports = function (server, cb) {
  const log = kernel.get<LogService>('LogService');
  const baseService: BaseService = kernel.get<BaseService>('BaseService');
  const serviceManager: ServiceManager = kernel.get<ServiceManager>('ServiceManager');
  baseService.server = server;
  serviceManager.initSubscriptions((err, results) => {
    log.debug(JSON.stringify(results, null, 2));
    if (log.logIfError(err)) {
      cb(err);
      return;
    }
    serviceManager.init((err, results) => {
      log.debug(JSON.stringify(results, null, 2));
      log.logIfError(err);
      cb(err);
    });
  });
};
