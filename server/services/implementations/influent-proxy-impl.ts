import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseService} from '../interfaces/base-service';
import {InfluentProxy} from '../interfaces/influent-proxy';
import path = require('path');
import httpRequest = require('request');
import fs = require('fs');
import {Globals} from '../../globals';
import {LogService} from '../interfaces/log-service';

//noinspection JSUnusedGlobalSymbols
@injectable()
export class InfluentProxyImpl implements InfluentProxy {
  //private static baseInfluentUrl = 'http://192.168.104.67:8080';
  private static baseInfluentUrl = Globals.influentUrl;
  private static influentHttpRequestOptions = {
    url: ''
  };

  //noinspection JSUnusedLocalSymbols
  constructor(@inject('BaseService') private baseService: BaseService,
              @inject('LogService') private log: LogService,
              @inject('IPostal') private postal: IPostal) {
  }

  get server(): any {
    return this.baseService.server;
  }

  initSubscriptions(cb: (err: Error, result: any) => void) {
    const me = this;
    me.server.post('/influent/rest/:r0', function (req, res) {
      me.influentHttpPost(req, res);
    });
    /*    me.server.post('/influent/rest/:r0/:r1', function (req, res) {
     me.influentHttpPost(req, res);
     });
     me.server.post('/influent/rest/:r0/:r1/:r2', function (req, res) {
     me.influentHttpPost(req, res);
     });
     me.server.post('/influent/rest/:r0/:r1/:r2/:r3', function (req, res) {
     me.influentHttpPost(req, res);
     });*/
    me.server.get('/influent/rest/:r0/:r1/:r2', function (req, res) {
      me.influentHttpGet(req, res);
    });
    me.server.get('/influent/rest/:r0', function (req, res) {
      me.influentHttpGet(req, res);
    });
    cb(null, {message: 'Initialized InfluentProxy Subscriptions'});
  }

  private influentHttpPost(req, res) {
    const me = this;
    const url = InfluentProxyImpl.baseInfluentUrl + req.originalUrl;
    try {
      const jsonBody = JSON.stringify(req.body);
      httpRequest.post({
        url,
        headers: req.headers,
        body: jsonBody
      })
        .on('error', (err) => {
          me.log.logIfError(err);
        })
        .pipe(res);
      /*      httpRequest.post({
       url,
       headers: req.headers,
       body: jsonBody
       }, function optionalCallback(err, httpResponse, body) {
       if (err) {
       return console.error('upload failed:', err);
       }
       console.log('Upload successful!  Server responded with:', body);
       });*/
      /*      httpRequest.post(url, JSON.stringify(postBuffer))
       .on('error', (err) => {
       me.log.logIfError(err);
       })
       .pipe(res);*/
    } catch (err) {
      me.log.logIfError(err);
    }
  }

  private influentHttpGet(req, res) {
    const me = this;
    const url = InfluentProxyImpl.baseInfluentUrl + req.originalUrl;
    try {
      httpRequest.get({
        url
      })
        .on('error', (err) => {
          me.log.logIfError(err);
        })
        .pipe(res);
    } catch (err) {
      me.log.logIfError(err);
    }
  }

  init(cb: (err: Error, result: any) => void) {
    const me = this;
    cb(null, {message: 'Initialized InfluentProxy'});
  }
}
