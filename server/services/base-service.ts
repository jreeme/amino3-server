import {injectable} from 'inversify';

export interface BaseService {
  server: LoopBackApplication2;
  servicePostalChannel: string;

  initSubscriptions(server: LoopBackApplication2, cb?: (err?: Error, result?: any) => void): void;

  init(cb: (err?: Error, result?: any) => void): void;
}

@injectable()
export abstract class BaseServiceImpl implements BaseService {
  private _servicePostalChannel: string;
  private _server: LoopBackApplication2;

  constructor() {
    this._servicePostalChannel = this.constructor.name;
  }

  get servicePostalChannel(): string {
    return this._servicePostalChannel;
  }

  get server(): LoopBackApplication2 {
    return this._server;
  }

  initSubscriptions(server: LoopBackApplication2, cb?: (err: Error, result: any) => void): void {
    this._server = server;
  }

  abstract init(cb: (err: Error, result: any) => void): void;
}
