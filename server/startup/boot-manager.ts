import {injectable, inject} from 'inversify';
import {LogService} from '../services/interfaces/log-service';
import {LoopBackApplication2} from '../custom-typings';
import {IPostal} from "firmament-yargs";

export interface BootManager {
  start(loopback: any, loopbackApplication: LoopBackApplication2, applicationFolder: string, startListening: boolean);
}

@injectable()
export class BootManagerImpl implements BootManager {
  private loopback: any;
  private app: LoopBackApplication2;
  private startListening: boolean;

  constructor(@inject('LogService') private log: LogService,
              @inject('IPostal') private postal: IPostal) {
  }

  start(_loopback: any,
        _app: LoopBackApplication2,
        _applicationFolder: string,
        _startListening: boolean) {
    const me = this;
    me.loopback = _loopback;
    me.app = _app;
    me.startListening = _startListening;
    me.log.info(`Booting Amino3 using 'loopback-boot'`);
    require('loopback-boot')(me.app, _applicationFolder, me.bootCallback.bind(me));
  }

  private bootCallback(err: Error) {
    const me = this;
    if (err) {
      const errorMsg = `Error booting loopback application: ${err.message}`;
      me.log.error(errorMsg);
      throw new Error(errorMsg);
    }
    // tell loopback to use AminoAccessToken for auth
    me.app.use(me.loopback.token({
      model: me.app.models.AminoAccessToken
    }));
    // start the server if `$ node server.js`
    if (!me.startListening) {
      me.log.debug(`Starting Amino3`);
      return;
    }
    me.log.debug(`Starting Amino3 by 'node server.js'`);
    me.log.debug(`Starting Socket.IO server`);
    me
      .postal
      .publish({
        channel: 'ServiceBus',
        topic: 'SetSocketIO',
        data: {io: require('socket.io')(me.listen())}
      });
    me.app.emit('started');
  }

  private listen() {
    const me = this;
    return me.app.listen(() => {
      let baseUrl = me.app.get('url').replace(/\/$/, '');
      if (me.app.get('loopback-component-explorer')) {
        let explorerPath = me.app.get('loopback-component-explorer').mountPath;
        me.log.info(`Browse your REST API at ${baseUrl} ${explorerPath}`);
      }
      me.log.info(`Web server listening at: ${baseUrl}`);
    });
  }
}
