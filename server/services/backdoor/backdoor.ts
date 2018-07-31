import {injectable, inject} from 'inversify';
import {CommandUtil, IPostal} from 'firmament-yargs';
import {BaseServiceImpl} from '../base-service';
import {Logger} from '../../util/logging/logger';

interface BackdoorPayload {
  jsonObject: Object,
  cb: (err?: Error, result?: any) => void
}

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
    me.postal.subscribe({
      channel: 'Backdoor',
      topic: 'EvaluateJsonObject',
      callback: me.handleBackdoorPayload.bind(me)
    });
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
    for (const key in obj) {
      if (typeof obj[key] === "object") {
        me.getValues(obj[key], values);
      } else {
        values.push(obj[key]);
      }
    }
  }
}
