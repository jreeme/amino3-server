import {injectable} from 'inversify';

export interface BaseService {
  app: LoopBackApplication2;
  enabled: boolean;
  serviceName: string;
  servicePostalChannel: string;

  initSubscriptions(app: LoopBackApplication2, cb?: (err?: Error, result?: any) => void): void;

  init(cb: (err?: Error, result?: any) => void): void;
}

@injectable()
export abstract class BaseServiceImpl implements BaseService {
  private _enabled: boolean;
  private _serviceName: string;
  private _servicePostalChannel: string;
  private _app: LoopBackApplication2;

  constructor() {
    this._enabled = false;
    this._serviceName = this.constructor.name.replace('Impl','');
    this._servicePostalChannel = `PostalChannel-${this.constructor.name}`;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  get serviceName(): string {
    return this._serviceName;
  }

  get servicePostalChannel(): string {
    return this._servicePostalChannel;
  }

  get app(): LoopBackApplication2 {
    return this._app;
  }

  initSubscriptions(app: LoopBackApplication2, cb?: (err: Error, result: any) => void): void {
    this._app = app;
    this._enabled = true;
  }

  abstract init(cb: (err: Error, result: any) => void): void;
}
