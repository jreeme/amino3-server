import {injectable, inject,} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseServiceImpl} from '../base-service';
import {Logger} from '../../util/logging/logger';

interface AminoFile {
  name: string,
  path: string,
  size: number,
  type: string
}

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
        cb: (fields: { dataSetId: number }, files: AminoFile[], cb: (err?: Error) => void) => {
          const aminoFiles: AminoFile[] = files.map((file) => {
            return {
              name: file.name,
              path: file.path,
              size: file.size,
              type: file.type
            }
          });
          me.app.models.DataSet.findById(fields.dataSetId, (err: Error, dataSet: any) => {
            dataSet.files.create(aminoFiles, (err: Error, result: any) => {
              cb(err);
            });
          });
        }
      }
    });

    cb(null, {message: 'Initialized DataSetUploadManager'});
  }
}

