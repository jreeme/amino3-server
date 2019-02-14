import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseServiceImpl} from '../base-service';
import {Logger} from '../../util/logging/logger';
import * as jwt from 'jsonwebtoken';
import * as request from 'request';
import * as _ from 'lodash';
import * as normalizeUrl from 'normalize-url';
import {Globals} from '../../globals';
import async = require('async');
import {TokenExpiredError} from "jsonwebtoken";

const {chain} = require('stream-chain');
const {parser} = require('stream-json');
const {pick} = require('stream-json/filters/Pick');
const {streamValues} = require('stream-json/streamers/StreamValues');
const {URL} = require('url');

interface ElasticsearchQuery {
  esVerb: string,
  esQueryJson: string,
  req: {
    method: string,
    body: string,
    query: {
      access_token: string
    }
  },
  res: {
    send: (body: string) => void,
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
        topic: 'Verb',
        callback: me.elasticsearchQuery.bind(me)
      });
    me.postal
      .subscribe({
        channel: 'Elasticsearch',
        topic: 'IndicesVerb',
        callback: me.elasticsearchQuery.bind(me)
      });
    me.postal
      .subscribe({
        channel: 'Elasticsearch',
        topic: 'IndicesDoctypesVerb',
        callback: me.elasticsearchQuery.bind(me)
      });
    cb(null, {message: 'Initialized Elasticsearch Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    cb(null, {message: 'Initialized Elasticsearch'});
  }

  private findUserFromAccessToken(eq: ElasticsearchQuery, excludeDataSetIds, cb) {
    try {
      const accessToken = eq.req.query.access_token;
      const decoded: any = jwt.verify(accessToken, Globals.jwtSecret);
      this.app.models.AminoUser.findById(decoded.id, {include: 'roles'}, (err, user) => {
        cb(err, eq, user, excludeDataSetIds)
      })
    } catch(err) {
      cb(err);
    }
  }

  private convertRolesToDatasetIds(eq: ElasticsearchQuery, user: {toObject: () => {roles: {datasets: any[]}[]}}, excludeDataSetIds, cb) {
    const roles = user.toObject().roles;
    if(!roles) {
      const msg = 'ERROR: User has no authentication roles.';
      this.log.error(msg);
      return cb(new Error(msg), null);
    }
    const datasetIds = _.flatMap(roles, ((role) => {
      return role.datasets;
    }));
    cb(null, eq, datasetIds, excludeDataSetIds);
  }

  private getDatasetsFromIds(eq: ElasticsearchQuery, dataSetIds: string[], excludeDataSetIds, cb) {
    this.app.models.DataSet.find({'where': {'datasetUID': {'inq': dataSetIds}}}, (err, dataSets) => {
      cb(err, eq, dataSets, excludeDataSetIds,)
    })
  }

  private convertDatasetToIndexNames(eq, dataSets, excludeDataSetIds, cb) {
    const pathArray = _.uniq(_.flatten(dataSets.map((dataSet) => dataSet.indices)));
    const newPathArray = _.without(pathArray, ...excludeDataSetIds);
    const path = newPathArray.join(',').toLowerCase();
    if(!path) {
      const msg = 'ERROR: Access to data sets not granted in users roles.';
      this.log.error(msg);
      return cb(new Error(msg), null);
    }
    cb(null, eq, path)
  }

  private createESUrl(eq, dataSets, cb) {
    let elasticsearchUrl = '';
    try {
      const testUrl = Globals.elasticsearchUrl;
      const normalizedUrl = normalizeUrl(testUrl);
      if(_.has(eq, 'esIndices')) {
        const datasetArray = dataSets.split(',');
        dataSets = eq.esIndices.split(',').filter((index) => datasetArray.includes(index));
      }
      if(_.isEmpty(dataSets)) {
        elasticsearchUrl = undefined;
      } else {
        let doctypes = '';
        if(_.has(eq, 'esDoctypes') && (typeof eq.esDoctypes != 'undefined' && eq.esDoctypes)) {
          doctypes = '/' + eq.esDoctypes
        }
        elasticsearchUrl = new URL(`/${dataSets}${doctypes}/${eq.esVerb}`, normalizedUrl);
      }
    } catch(err) {
      elasticsearchUrl = undefined;
    }
    if(!elasticsearchUrl) {
      return cb(new Error('ERROR: Bad elasticsearch Url'), null);
    }
    cb(null, elasticsearchUrl.toString());
  }

  private elasticsearchQuery(eq: ElasticsearchQuery, envelope: any, excludeDataSetIds: Array<string> = [], foundErrors = true) {
    const me = this;
    async.waterfall([
      (cb) => cb(null, eq, excludeDataSetIds),
      //find User from access token including AminoRoles
      me.findUserFromAccessToken.bind(me),
      //Convert AminoRoles to a list of DataSet Ids
      me.convertRolesToDatasetIds.bind(me),
      //Find all DataSets with UIDs contained within our data set id list
      me.getDatasetsFromIds.bind(me),
      //Convert the resulting DataSet list into a unique list of data set names
      me.convertDatasetToIndexNames.bind(me),
      //Create the ES url using approved DataSet names and verb
      me.createESUrl.bind(me)
    ], (err: Error, uri) => {
      if(err) {
        const status = (err.constructor.name === 'TokenExpiredError') ? 401 : 400;
        return eq.res.status(status).end(err.message);
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

      //Keep it simple & streams for now. Might be cool to look at:
      //https://www.npmjs.com/package/stream-json if we work with BIG responses from ES
      const rs = requestStream
        .on('error', streamErrorHandler)
        .on('response', (res) => {
          let indexToExclude = '';
          if(!foundErrors)
            return rs.pipe(eq.res).on('error', streamErrorHandler);
          switch(res.statusCode) {
            case(404):
              chain([
                res
                , parser()
                , pick({filter: 'error'})
                , pick({filter: 'index'})
                , streamValues()
                , (o) => o.value
              ])
                .on('data', (data) => {
                  indexToExclude = data;
                })
                .on('end', () => {
                  if(indexToExclude.length == 0)
                    return me.elasticsearchQuery(eq, envelope, [indexToExclude], false);
                  else
                    me.elasticsearchQuery(eq, envelope, [indexToExclude].concat(excludeDataSetIds));
                });
              break;
            case(200):
            default:
              return rs.pipe(eq.res).on('error', streamErrorHandler);
          }
        });
    });
  }
}
