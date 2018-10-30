import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseServiceImpl} from '../base-service';
import {Logger} from '../../util/logging/logger';

@injectable()
export class DataSetLaunchEtlImpl extends BaseServiceImpl {
  constructor(@inject('Logger') private log:Logger,
              @inject('IPostal') private postal:IPostal) {
    super();
  }

  initSubscriptions(cb:(err:Error, result:any) => void) {
    super.initSubscriptions();
    const me = this;
    me.postal.subscribe({
      channel: me.servicePostalChannel,
      topic:'AfterDataSetUpdate',
      callback: me.afterDataSetUpdate.bind(me)
    });
    cb(null, {message: 'Initialized DataSetLaunchEtl Subscriptions'});
  }

  init(cb:(err:Error, result:any) => void) {
    cb(null, {message: 'Initialized DataSetLaunchEtl'});
  }

  private afterDataSetUpdate(data:{ctx:any, next:() => void}) {
    const me = this;
    const {ctx, next} = data;
    try {
      const dataSet = ctx.instance.toObject();
      next();
    } catch(err) {
      me.log.logIfError(err);
      next();
    }
  }
}

