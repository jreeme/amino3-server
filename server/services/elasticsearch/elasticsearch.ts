import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseServiceImpl} from '../base-service';
import {Logger} from '../../util/logging/logger';
import * as jwt from 'jsonwebtoken';
import {IncomingMessage} from 'http';
import * as request from 'request';
import * as _ from 'lodash';
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

  findUserFromAccessToken(eq, cb){
    const accessToken = eq.req.query.access_token;
    const decoded:any = jwt.verify(accessToken, Globals.jwtSecret);
    this.app.models.AminoUser.findById(decoded.id,{include:"roles"},(err,result)=>{cb(err,eq,result)})
  }

  static convertRolesToDatasetIds(eq:ElasticsearchQuery, user:any, cb) {
    const roles = user.toJSON().roles;
    if (!roles) {
      return cb(new Error("ERROR: User has no authentication roles."), null);
    }
    const datasetIds = _.flatMap(roles, ((role) => {
      return role.datasets;
    }));

    cb(null,eq, datasetIds);
  }

  getDatasetsFromIds(eq:ElasticsearchQuery, dataSetIds:string[], cb) {
    this.app.models.DataSet.find({"where": {"datasetUID": {"inq": dataSetIds}}}, (err,result)=>{cb(err,eq,result)})
  }

  static convertDatasetToUniqueNames(eq, dataSets, cb) {
    //use lodash uniq here
    const path = _.uniq(_.flatten(dataSets.map((dataSet) => dataSet.indices))).join(',').toLowerCase();
    if (!path) {
      return cb(new Error("ERROR: Access to data sets not granted in users roles."), null);
    }
    cb(null, eq, path)
  }

  createESUrl(eq, dataSets, cb) {
    let elasticsearchUrl = '';
    [Globals.elasticsearchUrl]
      .some((testUrl) => {
        try {
          const normalizedUrl = normalizeUrl(testUrl);
          elasticsearchUrl = new URL(`/${dataSets}/${eq.esVerb}`, normalizedUrl);
        } catch (err) {
          elasticsearchUrl = undefined;
          return false;
        }
        return true;
      });
    if (!elasticsearchUrl) {
      return cb(new Error("ERROR: Bad elasticsearch Url"), null);
    }
    const uri = elasticsearchUrl.toString();
    cb(null, uri);
  }

  initSubscriptions(cb: (err: Error, result: any) => void): void {
    super.initSubscriptions();
    const me = this;

    me.postal
      .subscribe({
        channel: 'Elasticsearch',
        topic: 'Query',
        callback: (eq: ElasticsearchQuery) => {
          async.waterfall([
            //find User from access token including AminoRoles
            (cb)=>{me.findUserFromAccessToken.bind(me)(eq,cb);},
            //Convert AminoRoles to a list of DataSet Ids
            ElasticsearchImpl.convertRolesToDatasetIds,
            //Find all DataSets with UIDs contained within our data set id list
            me.getDatasetsFromIds.bind(me),
            //Convert the resulting DataSet list into a unique list of data set names
            ElasticsearchImpl.convertDatasetToUniqueNames,
            //Create the ES url using approved DataSet names and verb
            me.createESUrl
          ], (err:Error,uri)=>{
            if(err){
              return eq.res.status(400).end(err.message);
            }

            const requestOptions = {
              uri,
              method: eq.req.method,
              json: eq.req.body
            };

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
