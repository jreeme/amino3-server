import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseService} from '../interfaces/base-service';
import {RebuildClient} from "../interfaces/rebuild-client";
import {ProcessCommandJson} from "firmament-bash/js/interfaces/process-command-json";
import path = require('path');
import fs = require('fs');
import async = require('async');
import {Util} from "../../util/util";
import {Globals} from "../../globals";
import {LogService} from "../interfaces/log-service";
import {LoopBackApplication2} from "../../custom-typings";

//noinspection JSUnusedGlobalSymbols
@injectable()
export class RebuildClientImpl implements RebuildClient {

//noinspection JSUnusedLocalSymbols
  constructor(@inject('BaseService') private baseService: BaseService,
              @inject('LogService') private log: LogService,
              @inject('ProcessCommandJson') private processCommandJson: ProcessCommandJson,
              @inject('IPostal') private postal: IPostal) {
  }

  get server(): LoopBackApplication2 {
    return this.baseService.server;
  }

  initSubscriptions(cb: (err: Error, result: any) => void) {
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
    me.rebuildClient((err, result) => {
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
