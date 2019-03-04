import {injectable, inject} from 'inversify';
import {CommandUtil, IPostal} from 'firmament-yargs';
import {BaseServiceImpl} from '../base-service';
import {Logger} from '../../util/logging/logger';

import * as async from 'async';

interface BackdoorPayload {
  jsonObject: Object,
  cb: (err?: Error, result?: any) => void
}

let MIC: any;
let MICP: any;

@injectable()
export class BackdoorImpl extends BaseServiceImpl {
  constructor(@inject('Logger') private log: Logger,
              @inject('IPostal') private postal: IPostal,
              @inject('CommandUtil') private commandUtil: CommandUtil) {
    super();
  }

  initSubscriptions(cb: (err: Error, result: any) => void) {
    super.initSubscriptions();
    //return cb(null, null);
    const me = this;

    MIC = me.app.models.MetadataInfoCatalog;
    MICP = me.app.models.MetadataInfoCatalogPedigree;

    /*    MIC.destroyAll((err, info) => {
          MICP.destroyAll((err, info) => {
            const e = err;
          });
        });
        return cb(null, null);*/

    const datasetUIDs = [
      '4c308a71-e060-40de-a9e2-7ca176db24db',
      'b25ced9b-fb6a-4d52-8b1d-c0ce51b744d8',
      'f312f750-d13c-4311-8259-42b813af7d8a',
      '60f0ce88-40ca-4be6-b399-3de2a2831f80'
    ];

    async.eachLimit(datasetUIDs, 4, (datasetUID, cb) => {
      //let count = 20;
      let count = 10;
      const micCount = 10;
      async.doWhilst((cb) => {
        const mics = [];
        for(let i = 0; i < micCount; ++i) {
          mics.push(
            {
              datasetUID,
              fileName: `someFileName.txt--${Math.random()}`,
              dateCreated: Date.now()
            }
          );
        }
        MIC.create(mics, (err, newMics) => {
          async.eachLimit(newMics, 10, (newMic: any, cb) => {
            //let count2 = 10;
            let count2 = 5;
            async.doWhilst((cb) => {
              newMic.pedigrees.create({
                fileHash: `howNowBrownCow--${Math.random()}`
              }, (err, newPedigree) => {
                cb(err, --count2);
                //me.log.critical(`count2 -- ${count2}`);
              });
            }, (count) => {
              return count > 0;
            }, (err) => {
              cb(err);
            });
          }, (err) => {
            cb(err, --count);
            me.log.critical(`count -- ${count}`);
          });
        });
      }, (count) => {
        return count > 0;
      }, cb);
    }, (err) => {
      cb(null, {message: 'Initialized Backdoor Subscriptions'});
    });
    /*    me.postal.subscribe({
          channel: 'Backdoor',
          topic: 'EvaluateJsonObject',
          callback: me.handleBackdoorPayload.bind(me)
        });
    cb(null, {message: 'Initialized Backdoor Subscriptions'});
    */
  }

  init(cb: (err: Error, result: any) => void) {
    cb(null, {message: 'Initialized Backdoor'});
  }

  private handleBackdoorPayload(backdoorPayload: BackdoorPayload) {
    const me = this;
    const values = [];
    me.getValues(backdoorPayload.jsonObject, values);

    const regex = /traefik\.frontend\.rule=Host:\s*(\S+)/;
    const xx = values
      .filter((value) => {
        const resultArray = regex.exec(value);
        return resultArray && resultArray.length == 2;
      })
      .map((value) => {
        return regex.exec(value)[1];
      });
    backdoorPayload.cb(null, {how: 'now'});
  }

  private getValues(obj, values) {
    const me = this;
    for(const key in obj) {
      if(typeof obj[key] === "object") {
        me.getValues(obj[key], values);
      } else {
        values.push(obj[key]);
      }
    }
  }
}
