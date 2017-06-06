import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseService} from '../interfaces/base-service';
import {RebuildClient} from "../interfaces/rebuild-client";
import {ProcessCommandJson} from "firmament-bash/js/interfaces/process-command-json";
import path = require('path');
import fs = require('fs');
import async = require('async');

//noinspection JSUnusedGlobalSymbols
@injectable()
export class RebuildClientImpl implements RebuildClient {

  constructor(@inject('BaseService') private baseService: BaseService,
              @inject('ProcessCommandJson') private processCommandJson: ProcessCommandJson,
              @inject('IPostal') private postal: IPostal) {
    //this.server.on('started', () => { });
  }

  get server(): any {
    return this.baseService.server;
  }

  initSubscriptions(cb: (err: Error, result: any) => void) {
    const me = this;
    me.postal.subscribe({
      channel: 'System',
      topic: 'RebuildClient',
      callback: me.rebuildClient.bind(me)
    });
    cb(null, {message: 'Initialized RebuildClient Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    const me = this;
    this.server.get('/system-ctl/rebuild-client', (req, res) => {
      me.postal.publish({
        channel: 'System',
        topic: 'RebuildClient',
        data: {}
      });
      return res.status(200).json({status: 'OK'});
    });
    cb(null, {message: 'Initialized RebuildClient'});
  }

  private rebuildClient() {
    const me = this;
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
      }, (/*err*/) => {
        me.postal.publish({
          channel: 'WebSocket',
          topic: 'Broadcast',
          data: {
            channel: 'System',
            topic: 'RefreshPage',
            data: {}
          }
        });
      });
  }

  private ngBuildClient(cb: (err: Error, result: any) => void) {
    this.processCommandJson.processAbsoluteUrl(path.resolve(__dirname, '../../firmament-bash/ng-build-client.json'), cb);
  }

  private npmInstallClient(cb: (err: Error, result: any) => void) {
    this.processCommandJson.processAbsoluteUrl(path.resolve(__dirname, '../../firmament-bash/npm-install-client.json'), cb);
  }

  private gitCloneClient(cb: (err: Error, result: any) => void) {
    this.processCommandJson.processAbsoluteUrl(path.resolve(__dirname, '../../firmament-bash/git-clone-client.json'), cb);
  }
}
