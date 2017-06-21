import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseService} from '../interfaces/base-service';
import {NewmanProxy} from "../interfaces/newman-proxy";
import path = require('path');
import httpRequest = require('request');
import fs = require('fs');

//noinspection JSUnusedGlobalSymbols
@injectable()
export class NewmanProxyImpl implements NewmanProxy {
  private static baseNewmanUrl = 'https://ec2-52-222-55-155.us-gov-west-1.compute.amazonaws.com';
  private static newmanHttpRequestOptions = {
    url: ''
  };

  constructor(@inject('BaseService') private baseService: BaseService,
              @inject('IPostal') private postal: IPostal) {
  }

  get server(): any {
    return this.baseService.server;
  }

  initSubscriptions(cb: (err: Error, result: any) => void) {
    const me = this;
    /*    me.postal.subscribe({
     channel: 'NewmanProxy',
     topic: 'HttpGet',
     callback: () => {
     httpRequest.get(NewmanProxyImpl.newmanHttpRequestOptions, function (err, res, body) {
     me.postal.publish({
     channel: 'WebSocket',
     topic: 'Broadcast',
     data: {
     channel: 'NewmanProxy',
     topic: 'HttpGetResponse',
     data: {body}
     }
     });
     });
     }
     });*/
    me.server.get('/newman', function (req, res) {
      me.newmanHttpGet(NewmanProxyImpl.baseNewmanUrl, res);
    });
    /*    me.server.get('/static/images/:image', function (req, res) {
     me.newmanHttpGet(NewmanProxyImpl.baseNewmanUrl + req.originalUrl, res);
     });
     me.server.get('/api/:apicall', function (req, res) {
     me.newmanHttpGet(NewmanProxyImpl.baseNewmanUrl + req.originalUrl, res);
     });
     me.server.get('/static/bundles/:bundle', function (req, res) {
     me.newmanHttpGet(NewmanProxyImpl.baseNewmanUrl + req.originalUrl, res);
     });*/
    cb(null, {message: 'Initialized NewmanProxy Subscriptions'});
  }

  private newmanHttpGet(url, res) {
    NewmanProxyImpl.newmanHttpRequestOptions.url = url;
    try {
      httpRequest.get(NewmanProxyImpl.newmanHttpRequestOptions)
        .on('error', (err) => {
          let e = err;
        })
        .pipe(res);
    } catch (err) {
      let e = err;
    }
  }

  init(cb: (err: Error, result: any) => void) {
    cb(null, {message: 'Initialized NewmanProxy'});
  }
}
