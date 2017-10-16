import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseService} from '../interfaces/base-service';
import {LogService} from '../interfaces/log-service';
import fs = require('fs');
import {Globals} from '../../globals';
import {LoopBackApplication2} from "../../custom-typings";

const lineEnding = '\n';
const stackIndex = 3; //How far up to call stack to look to get file:# for logging call
const format = '${timestamp} <${title}> ${file}:${line} ${message}';
const level = Globals.logLevel;

const loggers = [
  require('js-logging').dailyFile({
    level,
    format,
    lineEnding,
    stackIndex,
    path: Globals.logFilePath,
  }),
  require('js-logging').colorConsole({
    level,
    format,
    lineEnding,
    stackIndex
  })
];

//noinspection JSUnusedGlobalSymbols
@injectable()
export class LogServiceImpl implements LogService {
//noinspection JSUnusedLocalSymbols
  constructor(@inject('BaseService') private baseService: BaseService,
              @inject('IPostal') private postal: IPostal) {
    //this.server.on('started', () => { });
  }

  get server(): LoopBackApplication2 {
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

  logIfError(err: Error): boolean {
    if (err) {
      loggers.forEach((logger) => {
        logger.error(err.message);
      });
    }
    return !!err;
  }
}
