import kernel from '../inversify.config';
import {ServiceManager} from '../services/interfaces/service-manager';
import {BaseService} from '../services/interfaces/base-service';
import {CommandUtil} from 'firmament-yargs';
import {LogService} from "../services/interfaces/log-service";
module.exports = function (server, cb) {
  const commandUtil: CommandUtil = kernel.get<CommandUtil>('CommandUtil');
  const baseService: BaseService = kernel.get<BaseService>('BaseService');
  const log = kernel.get<LogService>('LogService');
  const serviceManager: ServiceManager = kernel.get<ServiceManager>('ServiceManager');
  baseService.server = server;
  serviceManager.init((err, results) => {
    if (commandUtil.callbackIfError(cb, err)) {
      return;
    }
    if (process.env.NODE_ENV !== 'production') {
      log.debug(JSON.stringify(results, null, 2));
    }
    cb();
  });
};
