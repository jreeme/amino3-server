import {injectable} from 'inversify';
import {BaseService} from "../interfaces/base-service";

@injectable()
export class BaseServiceImpl implements BaseService {
  public servicePostalChannel: string;
  public server: LoopBackApplication2;

  constructor() {
  }

  initSubscriptions(cb: (err: Error, result: any) => void) {
    cb(null, null);
  }

  init(cb: (err: Error, result: any) => void) {
    cb(null, null);
  }
}
