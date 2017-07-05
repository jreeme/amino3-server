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
    cb(null, {message: 'Initialized StaticService Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    this.server.use('/', require('loopback').static(Globals.clientDistFolder));
    this.server.use('/static-influent', require('loopback').static(Globals.influentPath));
    this.server.use('/static-gartner', require('loopback').static(Globals.gartnerPath));
    this.server.use('/static-mosaic', require('loopback').static(Globals.mosaicPath));
    cb(null, {message: 'Initialized StaticService'});
  }
}
