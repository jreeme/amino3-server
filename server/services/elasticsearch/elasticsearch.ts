import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseServiceImpl} from '../base-service';
import {Logger} from '../../util/logging/logger';
import * as jwt from 'jsonwebtoken';
import {IncomingMessage} from 'http';
import * as request from 'request';
import * as normalizeUrl from 'normalize-url';
import {Globals} from "../../globals";
import async = require('async');
import {error} from "util";

const {URL} = require('url');

interface ElasticsearchQuery {
  esVerb: string,
  esQueryJson: string,
  req: {
    method: string,
    body: string,
    query: {
      access_token: string}
  },
  res: {
    status: (returnCode: number) => {
      send: (body: string) => void,
      end: (body: string) => void
    }
  }
}

@injectable()
export class ElasticsearchImpl extends BaseServiceImpl {

  constructor(@inject('Logger') private log: Logger,
              @inject('IPostal') private postal: IPostal) {
    super();
  }

  initSubscriptions(cb: (err: Error, result: any) => void): void {
    super.initSubscriptions();
    const me = this;

    me.postal
      .subscribe({
        channel: 'Elasticsearch',
        topic: 'Query',
        callback: (eq: ElasticsearchQuery) => {
          let elasticsearchUrl = '';
          let accessToken = eq.req.query.access_token;
          let decoded:any = jwt.verify(accessToken, Globals.jwtSecret);

          async.waterfall([
            (cb)=>{
              me.app.models.AminoUser.findById(decoded.id,{include:"roles"},cb)
            },
            (model, cb)=>{
              let datasets = model.toJSON().roles.map((role)=>{ return role.datasets;}).reduce((x,y)=>x.concat(y), []);
              cb(null,datasets);
            },
            (datasets, cb)=>{
              me.app.models.DataSet.find({"where":{"datasetUID":{"inq":datasets}}},cb)
            },
            (datasets, cb)=>{
              let path = datasets.map((dataset)=>{return dataset.datasetName;}).join(',').toLowerCase();
              if(!path) {
                cb(null, null);
                return;
              }
              cb(null, '/' + path)
            }
          ], (err,datasets)=>{
            if (!datasets) {
              return eq.res.status(400).end('{"status":"ERROR: Access to datasets not granted in user roles."}');
            }
            [Globals.elasticsearchUrl]
              .some((testUrl) => {
                try {
                  const normalizedUrl = normalizeUrl(testUrl);
                  elasticsearchUrl = new URL(datasets + '/' + eq.esVerb, normalizedUrl);
                } catch (err) {
                  elasticsearchUrl = undefined;
                  return false;
                }
                return true;
              });
            if (!elasticsearchUrl) {
              return eq.res.status(400).end('{"status":"ERROR: Bad elasticsearch Url"}');
            }
            const uri = elasticsearchUrl.toString();
            const requestOptions = {
              uri,
              method: eq.req.method,
              json: eq.req.body
            };

            //request(requestOptions).pipe(eq.res);
            const requestStream = request(requestOptions);

            function streamErrorHandler(err: Error) {
              eq.res.status(400).end(err.message);
            }

            requestStream
              .on('error', streamErrorHandler)
              .pipe(eq.res)
              .on('error', streamErrorHandler);
          });
        }
      });
    cb(null, {message: 'Initialized Elasticsearch Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    cb(null, {message: 'Initialized Elasticsearch'});
  }
}
