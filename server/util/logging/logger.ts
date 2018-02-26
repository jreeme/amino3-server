import {injectable} from 'inversify';
import {Globals} from '../../globals';
import {Logger} from './logger';

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

export interface Logger {
  debug(msg: string);
  info(msg: string);
  notice(msg: string);
  warning(msg: string);
  error(msg: string);
  critical(msg: string);
  alert(msg: string);
  emergency(msg: string);
  logIfError(err: Error): void;
}

//noinspection JSUnusedGlobalSymbols
@injectable()
export class LoggerImpl implements Logger {
//noinspection JSUnusedLocalSymbols
  constructor() {
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
