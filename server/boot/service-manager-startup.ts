import kernel from '../inversify.config';
import {ServiceManager} from '../services/interfaces/service-manager';
import {BaseService} from '../services/interfaces/base-service';
import {CommandUtil} from 'firmament-yargs';
module.exports = function (server, cb) {
  let commandUtil: CommandUtil = kernel.get<CommandUtil>('CommandUtil');
  let baseService: BaseService = kernel.get<BaseService>('BaseService');
  baseService.server = server;
  let serviceManager: ServiceManager = kernel.get<ServiceManager>('ServiceManager');
  serviceManager.init((err, results) => {
    if (commandUtil.callbackIfError(cb, err)) {
      return;
    }
    if (process.env.NODE_ENV !== 'production') {
      commandUtil.log(JSON.stringify(results, null, 2));
    }
    cb();
  });
};
