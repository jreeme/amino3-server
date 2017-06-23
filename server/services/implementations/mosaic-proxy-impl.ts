import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseService} from '../interfaces/base-service';
import {MosaicProxy} from "../interfaces/mosaic-proxy";
import path = require('path');
import httpRequest = require('request');
import fs = require('fs');
import {Globals} from "../../globals";
import {LogService} from "../interfaces/log-service";

//noinspection JSUnusedGlobalSymbols
@injectable()
export class MosaicProxyImpl implements MosaicProxy {
  private static baseMosaicUrl = 'https://ec2-52-222-42-142.us-gov-west-1.compute.amazonaws.com';
  private static mosaicHttpRequestOptions = {
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
    /*    me.postal.subscribe({
     channel: 'MosaicProxy',
     topic: 'HttpGet',
     callback: () => {
     httpRequest.get(MosaicProxyImpl.mosaicHttpRequestOptions, function (err, res, body) {
     me.postal.publish({
     channel: 'WebSocket',
     topic: 'Broadcast',
     data: {
     channel: 'MosaicProxy',
     topic: 'HttpGetResponse',
     data: {body}
     }
     });
     });
     }
     });*/
    me.server.get('/dashboard', function (req, res) {
      me.mosaicHttpGet(MosaicProxyImpl.baseMosaicUrl + '/dashboard', res);
    });
    me.server.get('/static/images/:image', function (req, res) {
      me.mosaicHttpGet(MosaicProxyImpl.baseMosaicUrl + req.originalUrl, res);
    });
    me.server.get('/api/:apicall', function (req, res) {
      me.mosaicHttpGet(MosaicProxyImpl.baseMosaicUrl + req.originalUrl, res);
    });
    me.server.get('/static/bundles/:bundle', function (req, res) {
      me.mosaicHttpGet(MosaicProxyImpl.baseMosaicUrl + req.originalUrl, res);
    });
    cb(null, {message: 'Initialized MosaicProxy Subscriptions'});
  }

  private mosaicHttpGet(url, res) {
    const me = this;
    MosaicProxyImpl.mosaicHttpRequestOptions.url = url;
    httpRequest.get(MosaicProxyImpl.mosaicHttpRequestOptions)
      .on('error', (err) => {
        me.log.logIfError(err);
      })
      .pipe(res);
  }

  init(cb: (err: Error, result: any) => void) {
    const me = this;
    try {
      MosaicProxyImpl.mosaicHttpRequestOptions.agentOptions.pfx = fs.readFileSync(Globals.mosaicSslCertPath);
    } catch (err) {
      me.log.logIfError(err);
    }
    cb(null, {message: 'Initialized MosaicProxy'});
  }
}
