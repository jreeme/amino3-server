import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseServiceImpl} from '../base-service';
import {Logger} from '../../util/logging/logger';
import async = require('async');
import {Globals} from '../../globals';
import {ProcessCommandJson} from 'firmament-bash/js/interfaces/process-command-json';
import {ExecutionGraphResolver} from 'firmament-bash/js/interfaces/execution-graph-resolver';
import {ExecutionGraph} from 'firmament-bash/js/custom-typings';

let DS: any;
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

    DS = me.app.models.DataSet;
    MIC = me.app.models.MetadataInfoCatalog;
    MICP = me.app.models.MetadataInfoCatalogPedigree;

    me.postal.subscribe({
      channel: me.servicePostalChannel,
      topic: 'BeforeMetadataInfoCatalogDelete',
      callback: me.beforeMetadataInfoCatalogDelete.bind(me)
    });
    me.postal.subscribe({
      channel: me.servicePostalChannel,
      topic: 'BeforeDataSetSave',
      callback: me.beforeDataSetSave.bind(me)
    });
    me.postal.subscribe({
      channel: me.servicePostalChannel,
      topic: 'AfterDataSetSave',
      callback: me.afterDataSetSave.bind(me)
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
        let subFilter = {fields:{id:true}, where:ctx.where};
        MIC.find(subFilter, cb);
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
    ], (err) => {
      next(err);
    });
  }

  private beforeDataSetSave(data: {ctx: any, next: () => void}) {
    const me = this;
    me.log.info('DataSet:BeforeDataSetSave');
    const {ctx, next} = data;
    const dataSet: {status: string, id: any} = ctx.instance.toObject();
    ctx.instance.datasetName = ctx.instance.primeAgency + '-' + ctx.instance.caseName;
    switch(dataSet.status.toLowerCase()) {
      case('submitted'):
        ctx.instance.etlControlButtonIcon = 'fa fa-play';
        ctx.instance.etlControlButtonLabel = 'Process Dataset';
        ctx.instance.etlControlButtonClass = 'ui-button';
        ctx.instance.etlControlButtonDisabled = true;
        break;
      case('archived'):
        ctx.instance.etlControlButtonIcon = 'fa fa-play';
        ctx.instance.etlControlButtonLabel = 'Process Dataset';
        ctx.instance.etlControlButtonClass = 'ui-button';
        ctx.instance.etlControlButtonDisabled = false;
        break;
      case('queued'):
        ctx.instance.etlControlButtonIcon = 'fa fa-play';
        ctx.instance.etlControlButtonLabel = 'Dataset Queued';
        ctx.instance.etlControlButtonClass = 'ui-button-warning';
        ctx.instance.etlControlButtonDisabled = true;
        break;
      case('processing'):
        ctx.instance.etlControlButtonIcon = 'fa fa-stop';
        ctx.instance.etlControlButtonLabel = 'Processing';
        ctx.instance.etlControlButtonClass = 'ui-button-warning';
        ctx.instance.etlControlButtonDisabled = true;
        break;
      case('processed'):
        ctx.instance.etlControlButtonIcon = 'fa fa-play';
        ctx.instance.etlControlButtonLabel = 'Process Dataset';
        ctx.instance.etlControlButtonClass = 'ui-button';
        ctx.instance.etlControlButtonDisabled = false;
        break;
      case('failed'):
        ctx.instance.etlControlButtonIcon = 'fa fa-play';
        ctx.instance.etlControlButtonLabel = 'Process Dataset';
        ctx.instance.etlControlButtonClass = 'ui-button';
        ctx.instance.etlControlButtonDisabled = false;
        break;
    }
    next();
  };

  private afterDataSetSave(data: {ctx: any, next: () => void}) {
    const me = this;
    const {ctx, next} = data;

    next();
    DS.find({include: 'files'}, (err: Error, dataSets: any[]) => {
      me.postal.publish({
        channel: 'ServiceBus',
        topic: 'BroadcastToClients',
        data: {
          topic: 'SyncDataSets',
          data: dataSets
        }
      });
    });
    try {
      const dataSet: {status: string, id: any} = ctx.instance.toObject();
      if(dataSet.status === 'queued') {
        async.waterfall([
          (cb) => {
            me.executionGraphResolver.resolveExecutionGraph(Globals.remoteEtlCallExecutionGraph, cb);
          },
          (executionGraph: ExecutionGraph, cb) => {
            executionGraph.serialSynchronizedCommands[0].args[0] = dataSet.id.toString();
            me.processCommandJson.processExecutionGraph(executionGraph, cb);
          }
        ], (err: Error, result: string) => {
          me.log.logIfError(err);
          me.log.notice(result);
        });
      }
    } catch(err) {
      me.log.logIfError(err);
    }
  }
}

