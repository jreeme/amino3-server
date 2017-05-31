import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseService} from '../interfaces/base-service';
import {RebuildClient} from '../interfaces/rebuild-client';
import path = require('path');
import fs = require('fs');
import async = require('async');
import {PluginManager} from "../interfaces/plugin-manager";

@injectable()
export class PluginManagerImpl implements PluginManager {

  constructor(@inject('BaseService') private baseService: BaseService,
              @inject('IPostal') private postal: IPostal) {
    //this.baseService.server.on('started', () => { });
  }

  get server(): any {
    return this.baseService.server;
  }

  initSubscriptions(cb: (err: Error, result: any) => void) {
    const me = this;
/*    me.postal.subscribe({
      channel: 'System',
      topic: 'RebuildClient',
      callback: () => {
        const clientFolder = path.resolve(__dirname, '../../../client');
        if (!fs.existsSync(clientFolder)) {
          fs.mkdirSync(clientFolder);
        }
        const clientSourceFolder = path.resolve(__dirname, '../../../client/source');
        const fnArray = [];
        if (!fs.existsSync(clientSourceFolder)) {
          fnArray.push(me.gitCloneClient.bind(me));
          fnArray.push(me.npmInstallClient.bind(me));
        }
        fnArray.push(me.ngBuildClient.bind(me));
        async.mapSeries(fnArray,
          (fn, cb) => {
            fn(cb);
          }, (err, results) => {
            let e = err;
          });
      }
    });*/
    cb(null, {message: 'Initialized PluginManager Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    cb(null, {message: 'Initialized PluginManager'});
  }
}
