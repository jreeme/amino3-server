import {inject, injectable} from 'inversify';
import {Globals} from '../../globals';
import {Logger} from './logger';
import {Util} from '../util';
import * as path from 'path';
import {SafeJson} from "firmament-yargs";

const lineEnding = '\n';
const stackIndex = 4; //How far up to call stack to look to get file:# for logging call
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
  setApplicationObject(app: LoopBackApplication2): void;
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
  private callerFilenamesToIgnore = new Set<string>();
  private readonly allFilenameCallers = new Set<string>();
  private _app: LoopBackApplication2;
  private logLevel = '';
  private _loggers: any[] = [];

  constructor(@inject('SafeJson') private safeJson: SafeJson) {

  }

  setApplicationObject(app: LoopBackApplication2) {
    const me = this;
    if (me._app) {
      return;
    }
    me._app = app;
    me.app.get('/get-logger-called-from-files', (req, res) => {
      res.status(200).send(Array.from(me.allFilenameCallers));
    });
    me.app.get('/set-logger-calling-files-to-ignore', (req, res) => {
      const json = `{"files-to-ignore": ${req.query['files-to-ignore']}}`;
      me.safeJson.safeParse(json, (err, obj) => {
        if (err) {
          return res.status(417).send({status: err.message});
        }
        me.callerFilenamesToIgnore = new Set<string>(obj['files-to-ignore']);
        res.status(200).send({status: 'OK'});
      });
    });
    me.callerFilenamesToIgnore = new Set<string>(Globals.loggerCallerFilenamesToIgnore);
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

  private actualLog(message: string) {
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
  }
}
