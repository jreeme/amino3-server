import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseService} from '../interfaces/base-service';
import {MosaicProxy} from "../interfaces/mosaic-proxy";
import path = require('path');
import httpRequest = require('request');
import fs = require('fs');

//noinspection JSUnusedGlobalSymbols
@injectable()
export class MosaicProxyImpl implements MosaicProxy {
  private static mosaicSslCertPath = path.resolve(__dirname, '../../ssl-certs/cert.p12');
  private static mosaicSslCert = fs.readFileSync(MosaicProxyImpl.mosaicSslCertPath);
  private static baseMosaicUrl = 'https://ec2-52-222-42-142.us-gov-west-1.compute.amazonaws.com';
  private static mosaicHttpRequestOptions = {
    url: '',
    agentOptions: {
      pfx: MosaicProxyImpl.mosaicSslCert,
      passphrase: 'password',
      securityOptions: 'SSL_OP_NO_SSLv3'
    }
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
      me.mosaicHttpGet(req, res);
    });
    me.server.get('/static/images/:image', function (req, res) {
      me.mosaicHttpGet(req, res);
    });
    me.server.get('/api/:apicall', function (req, res) {
      me.mosaicHttpGet(req, res);
    });
    me.server.get('/static/bundles/:bundle', function (req, res) {
      me.mosaicHttpGet(req, res);
    });
    cb(null, {message: 'Initialized MosaicProxy Subscriptions'});
  }

  private mosaicHttpGet(req, outerRes) {
    MosaicProxyImpl.mosaicHttpRequestOptions.url = MosaicProxyImpl.baseMosaicUrl + req.originalUrl;
    httpRequest.get(MosaicProxyImpl.mosaicHttpRequestOptions).pipe(outerRes);
  }

  init(cb: (err: Error, result: any) => void) {
    cb(null, {message: 'Initialized MosaicProxy'});
  }
}