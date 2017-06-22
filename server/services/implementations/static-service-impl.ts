import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseService} from '../interfaces/base-service';
import {StaticService} from "../interfaces/static-service";
import {Globals} from "../../globals";

@injectable()
export class StaticServiceImpl implements StaticService {

  constructor(@inject('BaseService') private baseService: BaseService,
              @inject('IPostal') private postal: IPostal) {
    //this.server.on('started', () => { });
  }

  get server(): any {
    return this.baseService.server;
  }

  initSubscriptions(cb: (err: Error, result: any) => void) {
    const me = this;
    cb(null, {message: 'Initialized StaticService Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    const me = this;
    let loopback = require('loopback');
    me.server.use(loopback.static(Globals.clientDistFolder));
    cb(null, {message: 'Initialized StaticService'});
  }
}
