import {injectable} from 'inversify';

export interface BaseService {
  server: LoopBackApplication2;

  initSubscriptions(server: LoopBackApplication2, cb: (err?: Error, result?: any) => void): void;

  init(cb: (err?: Error, result?: any) => void): void;
}

@injectable()
export abstract class BaseServiceImpl implements BaseService {
  protected _server: LoopBackApplication2;

  constructor() {
  }

  get server(): LoopBackApplication2 {
    return this._server;
  }

  abstract initSubscriptions(server: LoopBackApplication2, cb: (err: Error, result: any) => void): void;

  abstract init(cb: (err: Error, result: any) => void): void;
}
