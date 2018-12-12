import {injectable, inject,} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseServiceImpl} from '../base-service';
import {Logger} from '../../util/logging/logger';
import {Globals} from '../../globals';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as async from 'async';
import {DataSet} from "../../../client/src/lb-sdk/models/DataSet";

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
    const me = this;
    super.initSubscriptions();
    me.postal.subscribe({
      channel: me.servicePostalChannel,
      topic: 'UploadFiles',
      callback: me.handleUploadRequest.bind(me)
    });
    cb(null, {message: 'Initialized DataSetUploadManager Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    cb(null, {message: 'Initialized DataSetUploadManager'});
  }

  // noinspection JSUnusedLocalSymbols
  private handleUploadRequest(data, env) {
    const me = this;
    data.cb = (fields: {dataSetId: any}, files: AminoFile[], cb: (err?: Error) => void) => {
      const aminoFiles: AminoFile[] = files.map((file) => {
        return {
          name: file.name,
          path: file.path,
          size: file.size,
          type: file.type
        }
      });
      async.each(aminoFiles, (file, cb) => {
        const targetPath = path.resolve(Globals.dataSetFileUploadPath, path.basename(file.path));
        fs.mkdir(targetPath, (err) => {
          if(err) {
            me.log.error(JSON.stringify(err));
            return cb(err);
          }
          fs.copy(file.path, path.resolve(targetPath, file.name), (err) => {
            file.path = targetPath;
            cb(err);
          });
        });
      }, (err: Error) => {
        if(err) {
          return cb(err);
        }
        me.app.models.DataSet.findById(fields.dataSetId, (err: Error, dataSet: any) => {
          if(!dataSet) {
            return cb(new Error(`Unable to find DataSet with Id: ${fields.dataSetId}`));
          }
          if(dataSet.status.toLowerCase() == "submitted"){
            try{
              dataSet.updateAttributes({status:'archived'});
            }
            catch(e){
              me.log.error(JSON.stringify(e));
            }

          }

          dataSet.files.create(aminoFiles, cb);
        });
      });
    };
    me.postal.publish({
      channel: 'PostalChannel-FileUpload',
      topic: 'Upload',
      data
    });
  }
}

