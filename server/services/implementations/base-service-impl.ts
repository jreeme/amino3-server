import {injectable, inject} from 'inversify';
import {BaseService} from "../interfaces/base-service";

@injectable()
export class BaseServiceImpl implements BaseService {
  public servicePostalChannel: string;
  public server: any;

  constructor() {
  }

  initSubscriptions(cb: (err: Error, result: any) => void) {
    cb(null, null);
  }

  init(cb: (err: Error, result: any) => void) {
    cb(null, null);
  }
}
