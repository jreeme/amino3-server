import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseServiceImpl} from './base-service';
import {Globals} from '../globals';

@injectable()
export class StaticServiceImpl extends BaseServiceImpl {

  constructor(@inject('IPostal') private postal: IPostal) {
    super();
  }

  initSubscriptions(server: LoopBackApplication2, cb: (err: Error, result: any) => void): void {
    this._server = server;
    cb(null, {message: 'Initialized StaticService Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    this.server.use('/', require('loopback').static(Globals.clientDistFolder));
    /*    this.server.use('/static-influent', require('loopback').static(Globals.influentPath));
        this.server.use('/static-gartner', require('loopback').static(Globals.gartnerPath));
        this.server.use('/chatter', require('loopback').static(Globals.chatterPath));*/
    cb(null, {message: 'Initialized StaticService'});
  }
}
