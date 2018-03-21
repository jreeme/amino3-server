import {injectable} from 'inversify';
import {Globals} from '../../globals';
import {Logger} from './logger';

const lineEnding = '\n';
const stackIndex = 3; //How far up to call stack to look to get file:# for logging call
const format = '${timestamp} <${title}> ${file}:${line} ${message}';

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
  logFromRemoteClient(remoteLoggingMessage: RemoteLoggingMessage): void;
}

export interface RemoteLoggingMessage {
  accessTokenMD5: string,
  level: string,
  message: string
}

@injectable()
export class LoggerImpl implements Logger {
  private logLevel = '';
  private _loggers: any[] = [];

  constructor() {
  }

  private get loggers(): any[] {
    if (this.logLevel !== Globals.logLevel) {
      this.logLevel = Globals.logLevel;
      this._loggers = [
        require('js-logging').dailyFile({
          level: this.logLevel,
          format,
          lineEnding,
          stackIndex,
          path: Globals.logFilePath,
        }),
        require('js-logging').colorConsole({
          level: this.logLevel,
          format,
          lineEnding,
          stackIndex
        })
      ];
    }
    return this._loggers;
  }

  logFromRemoteClient(remoteLoggingMessage: RemoteLoggingMessage) {
    const me = this;
    const logMethodName = remoteLoggingMessage.level.toLowerCase();
    const logMethod: (msg: string) => void = me[logMethodName].bind(me);
    const clientId = `${remoteLoggingMessage.accessTokenMD5 || '<unknown>'}`;
    if (typeof  logMethod === 'function') {
      const message = `[CLIENT] ${clientId} : ${remoteLoggingMessage.message}`;
      return logMethod(message);
    }
    me.warning(`Received bad log message level from client '${clientId}'`)
  }

  logIfError(err: Error): boolean {
    const me = this;
    if (err) {
      if (err instanceof Array) {
        (<Error[]>err).forEach((err) => {
          me.error(err.message);
        });
      }
      else if (err instanceof Error) {
        me.error(err.message);
      }
      return true;
    }
    return false;
  }

  debug(msg: string) {
    this.loggers.forEach((logger) => {
      logger.debug(msg);
    });
  }

  info(msg: string) {
    this.loggers.forEach((logger) => {
      logger.info(msg);
    });
  }

  notice(msg: string) {
    this.loggers.forEach((logger) => {
      logger.notice(msg);
    });
  }

  warning(msg: string) {
    this.loggers.forEach((logger) => {
      logger.warning(msg);
    });
  }

  error(msg: string) {
    this.loggers.forEach((logger) => {
      logger.error(msg);
    });
  }

  critical(msg: string) {
    this.loggers.forEach((logger) => {
      logger.critical(msg);
    });
  }

  alert(msg: string) {
    this.loggers.forEach((logger) => {
      logger.alert(msg);
    });
  }

  emergency(msg: string) {
    this.loggers.forEach((logger) => {
      logger.emergency(msg);
    });
  }
}
