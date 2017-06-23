import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseService} from '../interfaces/base-service';
import {LogService} from "../interfaces/log-service";
import fs = require('fs');
import {Globals} from "../../globals";

const loggers = [
  require('js-logging').dailyFile({
    path: Globals.logFilePath,
    lineEnding: '\n'
  }),
  require('js-logging').colorConsole({})
];

//noinspection JSUnusedGlobalSymbols
@injectable()
export class LogServiceImpl implements LogService {
//noinspection JSUnusedLocalSymbols
  constructor(@inject('BaseService') private baseService: BaseService,
              @inject('IPostal') private postal: IPostal) {
    //this.server.on('started', () => { });
  }

  get server(): any {
    return this.baseService.server;
  }

  initSubscriptions(cb: (err: Error, result: any) => void) {
    cb(null, {message: 'Initialized LogService Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    const me = this;
    me.server.post('/log', function (req, res) {
      res.status(200).send({status: 'OK'});
    });
    cb(null, {message: 'Initialized LogService'});
  }

  debug(msg: string) {
    loggers.forEach((logger) => {
      logger.debug(msg);
    });
  }

  info(msg: string) {
    loggers.forEach((logger) => {
      logger.info(msg);
    });
  }

  notice(msg: string) {
    loggers.forEach((logger) => {
      logger.notice(msg);
    });
  }

  warning(msg: string) {
    loggers.forEach((logger) => {
      logger.warning(msg);
    });
  }

  error(msg: string) {
    loggers.forEach((logger) => {
      logger.error(msg);
    });
  }

  critical(msg: string) {
    loggers.forEach((logger) => {
      logger.critical(msg);
    });
  }

  alert(msg: string) {
    loggers.forEach((logger) => {
      logger.alert(msg);
    });
  }

  emergency(msg: string) {
    loggers.forEach((logger) => {
      logger.emergency(msg);
    });
  }

  logIfError(err: Error) {
    if (err) {
      this.error(err.message);
    }
  }
}
