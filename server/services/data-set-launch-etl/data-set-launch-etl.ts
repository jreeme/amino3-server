import {injectable, inject} from 'inversify';
import {IPostal, CommandUtil, IEnvelope} from 'firmament-yargs';
import {BaseServiceImpl} from '../base-service';
import {Logger} from '../../util/logging/logger';
import async = require('async');
import {Globals} from '../../globals';
import {ProcessCommandJson} from 'firmament-bash/js/interfaces/process-command-json';
import {ExecutionGraphResolver} from 'firmament-bash/js/interfaces/execution-graph-resolver';
import {ExecutionGraph} from 'firmament-bash/js/custom-typings';

let DS: any;
let MIC: any;
let LRT: any;
let MICP: any;

interface LongRunningTask {
  id?: any,
  creationDate?: Date,
  startDate?: Date,
  lastUpdate?: Date,
  status?: string,
  description?: string,
  startTaskPostalMessage?: IEnvelope<any>,

  toObject?(): LongRunningTask,

  updateAttributes?(lrt: LongRunningTask, cb: (err, lrt: LongRunningTask) => void)
}

@injectable()
export class DataSetLaunchEtlImpl extends BaseServiceImpl {
  constructor(@inject('Logger') private log: Logger,
              @inject('ProcessCommandJson') private processCommandJson: ProcessCommandJson,
              @inject('CommandUtil') private commandUtil: CommandUtil,
              @inject('ExecutionGraphResolver') private executionGraphResolver: ExecutionGraphResolver,
              @inject('IPostal') private postal: IPostal) {
    super();
  }

  initSubscriptions(cb: (err: Error, result: any) => void) {
    super.initSubscriptions();
    const me = this;

    DS = me.app.models.DataSet;
    MIC = me.app.models.MetadataInfoCatalog;
    LRT = me.app.models.LongRunningTask;
    MICP = me.app.models.MetadataInfoCatalogPedigree;

    me.postal.subscribe({
      channel: me.servicePostalChannel,
      topic: 'BeforeLongRunningTaskSave',
      callback: me.beforeLongRunningTaskSave.bind(me)
    });
    me.postal.subscribe({
      channel: me.servicePostalChannel,
      topic: 'DeleteDatasetInfo',
      callback: me.deleteDatasetInfo.bind(me)
    });
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
    me.postal.subscribe({
      channel: 'ServiceBus',
      topic: 'ServerHeartbeat',
      callback: me.handleServerHeartbeat.bind(me)
    });
    me.postal.subscribe({
      channel: 'LongRunningTask',
      topic: 'StartDeleteDataSetMetadata',
      callback: me.startDeleteDataSetMetadata.bind(me)
    });
    cb(null, {message: 'Initialized DataSetLaunchEtl Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    //LRT.destroyAll();
    cb(null, {message: 'Initialized DataSetLaunchEtl'});
  }

  private beforeLongRunningTaskSave(data: { ctx: any, next: (err?: any) => void }) {
    const {ctx, next} = data;
    return next();
  }

  private setLongRunningTaskToError(data: { longRunningTaskId: any, datasetUID: string, err: Error }) {
    const me = this;
    LRT.findById(data.longRunningTaskId, (err, longRunningTask) => {
      if (err) {
        return me.commandUtil.logError(err);
      }
      longRunningTask.updateAttributes({
        status: 'error',
        errorMessage: `Error: ${data.err.message} - datasetUID: ${data.datasetUID}`,
        lastUpdate: new Date()
      }, (err) => {
        me.commandUtil.logError(err);
      });
    });
  }

  private startDeleteDataSetMetadata(data: any) {
    const me = this;
    const {datasetUID, longRunningTaskId} = data;
    LRT.findById(longRunningTaskId, (err, longRunningTask) => {
      if (err) {
        return me.commandUtil.logError(err);
      }
      MIC.count({datasetUID}, (err, startingMICCount) => {
        if (err) {
          data.err = err;
          return me.setLongRunningTaskToError(data);
        }
        async.doWhilst((cb) => {
          MIC.find({
              limit: 10,
              fields: {id: true},
              where: {datasetUID}
            },
            (err, results: { id: any }[]) => {
              async.eachLimit(
                results,
                5,
                (result, cb) => {
                  MIC.deleteById(result.id, cb);
                },
                (err: Error) => {
                  if (err) {
                    return cb(err);
                  }
                  MIC.count({datasetUID}, cb);
                });
            });
        }, (count: number) => {
          longRunningTask.updateAttributes({
            fractionComplete: 1.0 - (count / startingMICCount),
            lastUpdate: new Date()
          }, (err) => {
            me.commandUtil.logError(err);
          });
          return count > 0;
        }, (err: Error) => {
          const lrt: any = {
            lastUpdate: new Date()
          };
          if (err) {
            lrt.status = 'error';
            lrt.errorMessage = err.message;
          } else {
            lrt.status = 'finished';
          }
          longRunningTask.updateAttributes(lrt, (err) => {
            me.commandUtil.logError(err);
          });
        });
      });
    });
  }

  private deleteDatasetInfo(data: { datasetUID: string, cb: (err: any, info?: any) => void }) {
    const {datasetUID, cb} = data;
    const newLongRunningTask: LongRunningTask = {
      creationDate: new Date(),
      description: 'Delete dataSet metadata',
      startTaskPostalMessage: {
        channel: 'LongRunningTask',
        topic: 'StartDeleteDataSetMetadata',
        data: {
          datasetUID
        }
      }
    };
    return LRT.create(newLongRunningTask, cb);
  }

  private handleServerHeartbeat(data: { ticks: number, serverTime: number }) {
    const me = this;
    LRT.find({where: {status: 'notStarted'}}, (err, longRunningTasks: LongRunningTask[]) => {
      if (err) {
        return me.commandUtil.logError(err);
      }
      async.each(longRunningTasks, (longRunningTask, cb) => {
        const now = new Date(data.serverTime);
        const startTaskPostalMessage = longRunningTask.toObject().startTaskPostalMessage;
        startTaskPostalMessage.data.longRunningTaskId = longRunningTask.id;
        longRunningTask.updateAttributes({
          status: 'started',
          startDate: now,
          lastUpdate: now,
          startTaskPostalMessage
        }, (err) => {
          if (err) {
            me.commandUtil.logError(err);
            return cb();
          }
          me.postal.publish(longRunningTask.startTaskPostalMessage);
          return cb();
        });
      });
    });
  }

  private beforeMetadataInfoCatalogDelete(data: { ctx: any, next: (err: any) => void }) {
    const me = this;
    const {ctx, next} = data;
    async.waterfall([
      (cb) => {
        let subFilter = {fields: {id: true}, where: ctx.where};
        MIC.find(subFilter, cb);
      },
      (micEntries, cb) => {
        const destroyedMicEntryIds = micEntries.map((micEntry) => micEntry.id);
        MICP.destroyAll({
            catalogId: {inq: destroyedMicEntryIds}
          },
          cb);
      }
    ], (err: Error) => {
      me.log.logIfError(err);
      next(null);
    });
  }

  private beforeDataSetSave(data: { ctx: any, next: () => void }) {
    const me = this;
    me.log.info('DataSet:BeforeDataSetSave');
    const {ctx, next} = data;
    const dataSet: { status: string, id: any } = ctx.instance.toObject();
    ctx.instance.datasetName = ctx.instance.primeAgency + '-' + ctx.instance.caseName;
    switch (dataSet.status.toLowerCase()) {
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
  }

  private afterDataSetSave(data: { ctx: any, next: () => void }) {
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
      const dataSet: { status: string, id: any } = ctx.instance.toObject();
      if (dataSet.status === 'queued') {
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
    } catch (err) {
      me.log.logIfError(err);
    }
  }
}

