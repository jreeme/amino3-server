import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseService} from '../interfaces/base-service';
import {MosaicProxy} from "../interfaces/mosaic-proxy";

@injectable()
export class MosaicProxyImpl implements MosaicProxy {
  constructor(@inject('BaseService') private baseService: BaseService,
              @inject('IPostal') private postal: IPostal) {
    //this.server.on('started', () => { });
  }

  get server(): any {
    return this.baseService.server;
  }

  initSubscriptions(cb: (err: Error, result: any) => void) {
/*    var fs = require('fs');
    var cert = fs.readFileSync('./cert.p12');

    var fs = require('fs')
      , path = require('path')
      , request = require('request');

    var options = {
      url: 'https://ec2-52-222-42-142.us-gov-west-1.compute.amazonaws.com',
      agentOptions: {
        pfx: cert,
        passphrase: 'password',
        securityOptions: 'SSL_OP_NO_SSLv3'
      }
    };

    request.get(options, function (e, r, user) {
      var ee = e;
    });*/
  }

  init(cb: (err: Error, result: any) => void) {
  }
}
