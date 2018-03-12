import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {ProcessCommandJson} from 'firmament-bash/js/interfaces/process-command-json';
import {BaseServiceImpl} from './base-service';
import {Logger} from '../util/logging/logger';
import {Util} from '../util/util';
import {Globals} from '../globals';

import * as fs from 'fs';
import * as async from 'async';

@injectable()
export class RebuildClientImpl extends BaseServiceImpl {

  constructor(@inject('Logger') private log: Logger,
              @inject('ProcessCommandJson') private processCommandJson: ProcessCommandJson,
              @inject('IPostal') private postal: IPostal) {
    super();
  }

  initSubscriptions(server: LoopBackApplication2, cb: (err: Error, result: any) => void) {
    super.initSubscriptions(server);
    const me = this;
    me.app.get('/system-ctl/rebuild-client', (req, res) => {
      me.rebuildClient.bind(me)((err: Error) => {
        res.status(200).json({status: 'OK'});
      });
    });
    cb(null, {message: 'Initialized RebuildClient Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    const me = this;
    me.rebuildClient((err, result) => {
      cb(err, err ? result : {message: 'Initialized RebuildClient'});
    });
  }

  private rebuildClient(cb: (err: Error, result: any) => void) {
    const me = this;
    cb = Util.checkCallback(cb);
    me.gitClientCode((err, result) => {
      err && cb(err, result);
      !err && me.ngBuildClient((err, result) => {
        !err && me.postal.publish({
          channel: 'ServiceBus',
          topic: 'BroadcastToClients',
          data: {
            topic: 'RefreshPage'
          }
        });
        cb(err, result);
      });
    });
  }

  private gitClientCode(cb: (err?, result?) => void) {
    const me = this;
    if (fs.existsSync(Globals.clientFolder)) {
      return cb();
    }
    //Make sure cwd is as expected by shell processes
    process.chdir(Globals.projectRootPath);
    async.series([
      (cb) => {
        me.processCommandJson.processAbsoluteUrl(Globals.gitCloneClientExecutionGraph, cb);
      },
      (cb) => {
        me.processCommandJson.processAbsoluteUrl(Globals.npmInstallClientExecutionGraph, cb);
      }
    ], cb);
  };

  private ngBuildClient(cb: (err?: Error, result?: any) => void) {
    process.chdir(Globals.clientFolder);
    this.processCommandJson.processAbsoluteUrl(Globals.ngBuildClientExecutionGraph, (err) => {
      cb(err, {message: err ? 'Error Rebuilding Client' : 'Client Rebuilt'});
    });
  }
}
