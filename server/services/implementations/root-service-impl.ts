import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseService} from '../interfaces/base-service';
import {RootService} from "../interfaces/root-service";
import {LoopBackApplication2} from "../../custom-typings";

@injectable()
export class RootServiceImpl implements RootService {

  constructor(@inject('BaseService') private baseService: BaseService,
              @inject('IPostal') private postal: IPostal) {
    //this.server.on('started', () => { });
  }

  get server(): LoopBackApplication2 {
    return this.baseService.server;
  }

  initSubscriptions(cb: (err: Error, result: any) => void) {
    const me = this;
    cb(null, {message: 'Initialized RootService Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    const me = this;
    // Install a `/` route that returns server status
    /*  var router = server.loopback.Router();
     router.get('/', server.loopback.status());
     server.use(router);*/
    cb(null, {message: 'Initialized RootService'});
  }
}
