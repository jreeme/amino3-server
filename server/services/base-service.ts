import {injectable} from 'inversify';

export interface BaseService {
  app: LoopBackApplication2;
  enabled: boolean;
  canBeDisabled: boolean;
  serviceName: string;
  servicePostalChannel: string;

  initSubscriptions(app: LoopBackApplication2, cb?: (err?: Error, result?: any) => void): void;

  init(cb: (err?: Error, result?: any) => void): void;
}

@injectable()
export abstract class BaseServiceImpl implements BaseService {
  private readonly _serviceName: string;
  private readonly _servicePostalChannel: string;
  private _enabled: boolean;
  private _canBeDisabled: boolean;
  private _app: LoopBackApplication2;

  protected constructor() {
    this._enabled = false;
    this._canBeDisabled = true;
    this._serviceName = this.constructor.name.replace('Impl', '');
    this._servicePostalChannel = `PostalChannel-${this.constructor.name}`;
  }

  set canBeDisabled(newValue: boolean) {
    this._canBeDisabled = newValue;
  }

  get canBeDisabled(): boolean {
    return this._canBeDisabled;
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

  initSubscriptions(app: LoopBackApplication2, cb?: (err?: Error, result?: any) => void): void {
    this._app = app;
    this._enabled = true;
    cb && cb(null, {message: '[Warning] Initialized BaseServiceImpl Subscriptions'});
  }

  abstract init(cb: (err: Error, result: any) => void): void;
}
