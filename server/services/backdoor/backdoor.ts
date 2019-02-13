import {injectable, inject} from 'inversify';
import {CommandUtil, IPostal} from 'firmament-yargs';
import {BaseServiceImpl} from '../base-service';
import {Logger} from '../../util/logging/logger';

import * as request from 'request';

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
    const me = this;
    MIC = me.app.models.MetadataInfoCatalog;
    MICP = me.app.models.MetadataInfoCatalogPedigree;
    request.post({
      url: 'https://next.json-generator.com/api/templates',
      headers: {
        'X-XSRF-TOKEN': 'nZPnQmgbp4v7CxZ0OHwKmmqRLOAhjwaPYPGiE='
      },
      body:
        `[
        {
          'repeat(5, 10)':
          {
            _id: '{{objectId()}}',
            index: '{{index()}}',
            guid: '{{guid()}}'
          }
        }
      ]`
    }, (err, res, body) => {
      const b = body;
    });
    /*    me.postal.subscribe({
          channel: 'Backdoor',
          topic: 'EvaluateJsonObject',
          callback: me.handleBackdoorPayload.bind(me)
        });*/
    cb(null, {message: 'Initialized Backdoor Subscriptions'});
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
