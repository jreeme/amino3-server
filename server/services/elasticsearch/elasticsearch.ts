import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseServiceImpl} from '../base-service';
import {Logger} from '../../util/logging/logger';
import {IncomingMessage} from 'http';
import * as request from 'request';
import * as normalizeUrl from 'normalize-url';
import {Globals} from "../../globals";

const {URL} = require('url');

interface ElasticsearchQuery {
  esVerb: string,
  esQueryJson: string,
  req: {
    method: string,
    body: string
  },
  res: {
    status: (returnCode: number) => {
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
          [Globals.elasticsearchUrl]
            .some((testUrl) => {
              try {
                const normalizedUrl = normalizeUrl(testUrl);
                elasticsearchUrl = new URL(eq.esVerb, normalizedUrl);
              } catch (err) {
                const e = err;
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
          /*          request(requestOptions, (err, res, body) => {
                    });*/
          request(requestOptions).pipe(eq.res);
        }
      });
    cb(null, {message: 'Initialized Elasticsearch Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    cb(null, {message: 'Initialized Elasticsearch'});
  }
}
