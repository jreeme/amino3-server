import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseServiceImpl} from "./base-service";

@injectable()
export class RootServiceImpl extends BaseServiceImpl {

  constructor(@inject('IPostal') private postal: IPostal) {
    super();
  }

  initSubscriptions(server: LoopBackApplication2, cb: (err: Error, result: any) => void): void {
    this._server = server;
    cb(null, {message: 'Initialized RootService Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    // Install a `/` route that returns server status
    /*
     var router = server.loopback.Router();
     router.get('/', server.loopback.status());
     server.use(router);
     */
    cb(null, {message: 'Initialized RootService'});
  }
}
