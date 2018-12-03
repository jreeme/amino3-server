import {inject, injectable} from 'inversify';
import {Globals} from '../../globals';
import {Logger} from './logger';
import {Util} from '../util';
import {IPostal, SafeJson} from 'firmament-yargs';
import * as path from 'path';
import * as moment from 'moment';
import * as mkdirp from 'mkdirp';

const lineEnding = '\n';
const stackIndex = 4; //How far up to call stack to look to get file:# for logging call
const format = [
  '${timestamp} <${title}> ${file}:${line} ${message}',
  {
    error: '${timestamp} <${title}> ${message} (in ${file}:${line})\nCall Stack:\n${stack}' // error format
  }
];
const dateformat = 'isoUtcDateTime';

export interface Logger {
  debug(msg: string);
  info(msg: string);
  notice(msg: string);
  warning(msg: string);
  error(msg: string);
  critical(msg: string);
  alert(msg: string);
  emergency(msg: string);
  initSubscriptions(app: LoopBackApplication2): void;
  logIfError(err: Error): boolean;
  logFromRemoteClient(remoteLoggingMessage: RemoteLoggingMessage): void;
  setCallerFilenamesToIgnore(callerFilenamesToIgnore: string[]);
}

export interface RemoteLoggingMessage {
  accessTokenMD5: string,
  level: string,
  message: string
}

@injectable()
export class LoggerImpl implements Logger {
  private callerFilenamesToIgnore = new Set<string>();
  private readonly allFilenameCallers = new Set<string>();
  private readonly _loggers: any[] = [];
  private _app: LoopBackApplication2;
  private logLevel = '';
  private logFolderValid = false;

  constructor(@inject('SafeJson') private safeJson: SafeJson,
              @inject('IPostal') private postal: IPostal) {
    this.critical('');
    this.critical(`******************************** Logger Initialized @ ${moment().toISOString()} (Log Level: ${Globals.logLevel}) ********************************`);
    this.critical('');
  }

  setCallerFilenamesToIgnore(callerFilenamesToIgnore: string[]) {
    this.callerFilenamesToIgnore = new Set<string>(Globals.loggerCallerFilenamesToIgnore);
  }

  initSubscriptions(app: LoopBackApplication2) {
    const me = this;
    if (me._app) {
      return;
    }
    me._app = app;
    me.logLevel = undefined;//This will re-init the loggers in the 'loggers' getter
    try {
      if (Globals.logToFile) {
        mkdirp.sync(Globals.logFileFolder);
        me.logFolderValid = true;
        me.notice(`Log File Folder '${Globals.logFileFolder}' validity check PASSED`);
      }
    } catch (err) {
      me.warning(`Unable to create Log File Folder '${Globals.logFileFolder}'`);
    }
    me.postal
      .subscribe({
      channel: 'Logger',
      topic: 'setLoggerCallingFilesToIgnore',
      callback: (data) => {
        const {req, res} = data;
        const json = `{"files-to-ignore": ${req.query['files-to-ignore']}}`;
        me.safeJson.safeParse(json, (err, obj) => {
          if (err) {
            return res.status(417).send({status: err.message});
          }
          me.callerFilenamesToIgnore = new Set<string>(obj['files-to-ignore']);
          res.status(200).send(obj);
        });
      }
    });
    me.postal
      .subscribe({
      channel: 'Logger',
      topic: 'getLoggerCalledFromFiles',
      callback: (data) => {
        const {res} = data;
        res.status(200).send(Array.from(me.allFilenameCallers));
      }
    });
  }

  get app(): LoopBackApplication2 {
    return this._app;
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

  logIfError(err: any): boolean {
    const me = this;
    if (err) {
      if (err instanceof Array) {
        (<any[]>err).forEach((err) => {
          me.error(err.message);
        });
      }
      else if (err.hasOwnProperty('message')) {
        me.error(err.message);
      }
      return true;
    }
    return false;
  }

  debug(msg: string) {
    this.actualLog(msg);
  }

  info(msg: string) {
    this.actualLog(msg);
  }

  notice(msg: string) {
    this.actualLog(msg);
  }

  warning(msg: string) {
    this.actualLog(msg);
  }

  error(msg: string) {
    this.actualLog(msg);
  }

  critical(msg: string) {
    this.actualLog(msg);
  }

  alert(msg: string) {
    this.actualLog(msg);
  }

  emergency(msg: string) {
    this.actualLog(msg);
  }

  private get loggers(): any[] {
    const me = this;
    if (me.logLevel !== Globals.logLevel) {
      me.logLevel = Globals.logLevel;
      me._loggers.length = 0;
      me.logFolderValid && me._loggers
        .push(
          require('js-logging').dailyFile({
            level: me.logLevel,
            format,
            dateformat,
            lineEnding,
            stackIndex,
            path: Globals.logFileFolder,
          }));
      me._loggers
        .push(
          require('js-logging').colorConsole({
            level: me.logLevel,
            format,
            dateformat,
            lineEnding,
            stackIndex
          }));
    }
    return me._loggers;
  }

  private actualLog(message: string) {
    try {
      const me = this;
      const callingFile = path.basename(Util.getCallSite(3).fileName, '.js');
      me.allFilenameCallers.add(callingFile);
      if (me.callerFilenamesToIgnore.has(callingFile)) {
        return;
      }
      //me.loggers[1]['error'](callingFile);

      //--> LogIt
      const logMethodName = Util.getCallingMethodName(2);
      me.loggers.forEach((logger) => {
        if (typeof logger[logMethodName] === 'function') {
          logger[logMethodName](message);
        }
      });
    } catch (err) {
      console.error(err);
    }
  }
}
