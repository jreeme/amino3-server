import {injectable, inject,} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseServiceImpl} from '../base-service';
import {Logger} from '../../util/logging/logger';

@injectable()
export class DataSetUploadManagerImpl extends BaseServiceImpl {
  constructor(@inject('Logger') private log: Logger,
              @inject('IPostal') private postal: IPostal) {
    super();
  }

  initSubscriptions(cb: (err: Error, result: any) => void) {
    super.initSubscriptions();
    cb(null, {message: 'Initialized DataSetUploadManager Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    const me = this;
    me.postal.publish({
      channel: 'PostalChannel-FileUploadImpl',
      topic: 'AddFileUploadEndpoint',
      data: {
        uploadRoute: '/upload-files',
        cb: (files: any[], cb: (err?: Error) => void) => {
          cb();
        }
      }
    });

    cb(null, {message: 'Initialized DataSetUploadManager'});
  }
}

