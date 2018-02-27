import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {ProcessCommandJson} from 'firmament-bash/js/interfaces/process-command-json';
import {BaseServiceImpl} from './base-service';
import {Logger} from '../util/logging/logger';
import {Util} from '../util/util';
import {Globals} from '../globals';

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
    me.postal.subscribe({
      channel: 'ServiceBus',
      topic: 'RebuildClient',
      callback: me.rebuildClient.bind(me)
    });
    cb(null, {message: 'Initialized RebuildClient Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    const me = this;
    this.server.get('/system-ctl/rebuild-client', (req, res) => {
      me.postal.publish({
        channel: 'ServiceBus',
        topic: 'RebuildClient',
        data: {}
      });
      return res.status(200).json({status: 'OK'});
    });
    me.ngBuildClient((err, result) => {
      cb(err, err ? result : {message: 'Initialized RebuildClient'});
    });
  }

  private rebuildClient(cb: (err, result) => void) {
    const me = this;
    cb = Util.checkCallback(cb);
    me.ngBuildClient((err, result) => {
      if (!err) {
        me.postal.publish({
          channel: 'ServiceBus',
          topic: 'BroadcastToClients',
          data: {
            topic: 'RefreshPage'
          }
        });
      }
      cb(err, result);
    });
  }

  private ngBuildClient(cb: (err?: Error, result?: any) => void) {
    if (Globals.suppressClientRebuild) {
      const err = null;
      return cb(err, {message: err ? 'Error Rebuilding Client' : 'Client Rebuilt'});
    }
    process.chdir(Globals.clientFolder);
    this.processCommandJson.processAbsoluteUrl(Globals.ngBuildClientExecutionGraph, (err) => {
      cb(err, {message: err ? 'Error Rebuilding Client' : 'Client Rebuilt'});
    });
  }
}
