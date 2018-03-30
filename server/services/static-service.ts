import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseServiceImpl} from './base-service';

//import {Globals} from '../globals';

@injectable()
export class StaticServiceImpl extends BaseServiceImpl {

  constructor(@inject('IPostal') private postal: IPostal) {
    super();
  }

  initSubscriptions(cb: (err: Error, result: any) => void): void {
    super.initSubscriptions();
    cb(null, {message: 'Initialized StaticService Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    //const loopback = require('loopback');
    //this.server.use('/', loopback.static(Globals.clientDistFolder));
    cb(null, {message: 'Initialized StaticService'});
  }
}
