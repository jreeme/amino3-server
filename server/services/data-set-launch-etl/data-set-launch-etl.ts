import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseServiceImpl} from '../base-service';
import {Logger} from '../../util/logging/logger';
import async = require('async');
import {Globals} from '../../globals';
import {ProcessCommandJson} from 'firmament-bash/js/interfaces/process-command-json';
import {ExecutionGraphResolver} from 'firmament-bash/js/interfaces/execution-graph-resolver';
import {ExecutionGraph} from 'firmament-bash/js/custom-typings';

let MIC: any;
let MICP: any;

@injectable()
export class DataSetLaunchEtlImpl extends BaseServiceImpl {
  constructor(@inject('Logger') private log: Logger,
              @inject('ProcessCommandJson') private processCommandJson: ProcessCommandJson,
              @inject('ExecutionGraphResolver') private executionGraphResolver: ExecutionGraphResolver,
              @inject('IPostal') private postal: IPostal) {
    super();
  }

  initSubscriptions(cb: (err: Error, result: any) => void) {
    super.initSubscriptions();
    const me = this;

    MIC = me.app.models.MetadataInfoCatalog;
    MICP = me.app.models.MetadataInfoCatalogPedigree;

    me.postal.subscribe({
      channel: me.servicePostalChannel,
      topic: 'BeforeMetadataInfoCatalogDelete',
      callback: me.beforeMetadataInfoCatalogDelete.bind(me)
    });
    me.postal.subscribe({
      channel: me.servicePostalChannel,
      topic: 'AfterDataSetUpdate',
      callback: me.afterDataSetUpdate.bind(me)
    });
    cb(null, {message: 'Initialized DataSetLaunchEtl Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    cb(null, {message: 'Initialized DataSetLaunchEtl'});
  }

  private beforeMetadataInfoCatalogDelete(data: {ctx: any, next: (err: any) => void}) {
    const {ctx, next} = data;
    async.waterfall([
      (cb) => {
        MIC.find({where: ctx.where}, cb);
      },
      (micEntries, cb) => {
        const destroyedMicEntryIds = micEntries.map((micEntry) => micEntry.id);
        async.parallel([
          (cb) => {
            MICP.destroyAll(
              {
                catalogId: {inq: destroyedMicEntryIds}
              },
              cb);
          }
        ], cb);
      }
    ], (err, result) => {
      next(err);
    });
  }

  private afterDataSetUpdate(data: {ctx: any, next: () => void}) {
    const me = this;
    const {ctx, next} = data;
    try {
      const dataSet = ctx.instance.toObject();
      if(dataSet.status === 'queued') {
        async.waterfall([
          (cb) => {
            me.executionGraphResolver.resolveExecutionGraph(Globals.remoteEtlCallExecutionGraph, cb);
          },
          (executionGraph: ExecutionGraph, cb) => {
            me.processCommandJson.processExecutionGraph(executionGraph, cb);
          }
        ], (err: Error, result: string) => {
          me.log.logIfError(err);
          me.log.notice(result);
        });
      }
      next();
    } catch(err) {
      me.log.logIfError(err);
      next();
    }
  }
}

