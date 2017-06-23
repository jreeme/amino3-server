import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseService} from '../interfaces/base-service';
import {NewmanProxy} from "../interfaces/newman-proxy";
import path = require('path');
import httpRequest = require('request');
import fs = require('fs');
import {Globals} from "../../globals";
import {LogService} from "../interfaces/log-service";

//noinspection JSUnusedGlobalSymbols
@injectable()
export class NewmanProxyImpl implements NewmanProxy {
  private static baseNewmanUrl = 'https://ec2-52-222-55-155.us-gov-west-1.compute.amazonaws.com';
  private static newmanHttpRequestOptions = {
    url: '',
    agentOptions: {
      pfx: null,
      passphrase: 'password',
      securityOptions: 'SSL_OP_NO_SSLv3'
    }
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
    me.server.get('/newman', function (req, res) {
      me.newmanHttpGet(NewmanProxyImpl.baseNewmanUrl, res);
    });
    me.server.get('/plugins/:p0/:p1', function (req, res) {
      me.newmanHttpGet(NewmanProxyImpl.baseNewmanUrl + req.originalUrl, res);
    });
    me.server.get('/plugins/:p0/:p1/:p2', function (req, res) {
      me.newmanHttpGet(NewmanProxyImpl.baseNewmanUrl + req.originalUrl, res);
    });
    me.server.get('/css/:c0', function (req, res) {
      me.newmanHttpGet(NewmanProxyImpl.baseNewmanUrl + req.originalUrl, res);
    });
    me.server.get('/js/:j0', function (req, res) {
      me.newmanHttpGet(NewmanProxyImpl.baseNewmanUrl + req.originalUrl, res);
    });
    me.server.get('/js/:j0/:j1', function (req, res) {
      me.newmanHttpGet(NewmanProxyImpl.baseNewmanUrl + req.originalUrl, res);
    });
    me.server.get('/imgs/:i0', function (req, res) {
      me.newmanHttpGet(NewmanProxyImpl.baseNewmanUrl + req.originalUrl, res);
    });
    me.server.get('/app_config/:a0', function (req, res) {
      me.newmanHttpGet(NewmanProxyImpl.baseNewmanUrl + req.originalUrl, res);
    });
    me.server.get('/datasource/:d0', function (req, res) {
      me.newmanHttpGet(NewmanProxyImpl.baseNewmanUrl + req.originalUrl, res);
    });
    me.server.get('/datasource/:d0/:d1', function (req, res) {
      me.newmanHttpGet(NewmanProxyImpl.baseNewmanUrl + req.originalUrl, res);
    });
    me.server.get('/email/:e0', function (req, res) {
      me.newmanHttpGet(NewmanProxyImpl.baseNewmanUrl + req.originalUrl, res);
    });
    me.server.get('/profile/:p0', function (req, res) {
      me.newmanHttpGet(NewmanProxyImpl.baseNewmanUrl + req.originalUrl, res);
    });
    me.server.get('/entity/:e0/:e1', function (req, res) {
      me.newmanHttpGet(NewmanProxyImpl.baseNewmanUrl + req.originalUrl, res);
    });
    me.server.get('/activity/:a0/:a1', function (req, res) {
      me.newmanHttpGet(NewmanProxyImpl.baseNewmanUrl + req.originalUrl, res);
    });
    me.server.get('/category/:a0/:a1', function (req, res) {
      me.newmanHttpGet(NewmanProxyImpl.baseNewmanUrl + req.originalUrl, res);
    });
    me.server.get('/topic/:a0/:a1/:a2', function (req, res) {
      me.newmanHttpGet(NewmanProxyImpl.baseNewmanUrl + req.originalUrl, res);
    });
    me.server.get('/attachment/:a0', function (req, res) {
      me.newmanHttpGet(NewmanProxyImpl.baseNewmanUrl + req.originalUrl, res);
    });
    me.server.get('/search/:s0/:s1', function (req, res) {
      me.newmanHttpGet(NewmanProxyImpl.baseNewmanUrl + req.originalUrl, res);
    });
    me.server.get('/geo/:g0', function (req, res) {
      me.newmanHttpGet(NewmanProxyImpl.baseNewmanUrl + req.originalUrl, res);
    });
    cb(null, {message: 'Initialized NewmanProxy Subscriptions'});
  }

  private newmanHttpGet(url, res) {
    const me = this;
    NewmanProxyImpl.newmanHttpRequestOptions.url = url;
    try {
      httpRequest.get(NewmanProxyImpl.newmanHttpRequestOptions)
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
    try {
      NewmanProxyImpl.newmanHttpRequestOptions.agentOptions.pfx = fs.readFileSync(Globals.mosaicSslCertPath);
    } catch (err) {
      me.log.logIfError(err);
    }
    cb(null, {message: 'Initialized NewmanProxy'});
  }
}
