import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {Logger} from '../util/logging/logger';

export interface BootManager {
  start(loopback: any, loopbackApplication: LoopBackApplication2, applicationFolder: string, startListening: boolean);
}

@injectable()
export class BootManagerImpl implements BootManager {
  private loopback: any;
  private app: LoopBackApplication2;
  private startListening: boolean;

  constructor(@inject('Logger') private log: Logger,
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
    const loopbackBoot = require('loopback-boot');
    loopbackBoot(me.app, _applicationFolder, me.bootCallback.bind(me));
  }

  private bootCallback(err: Error) {
    const me = this;
    if (err) {
      const errorMsg = `Error booting loopback application: ${err.message}`;
      me.log.error(errorMsg);
      throw new Error(errorMsg);
    }
    //Sometimes, for building the client, etc., you just don't want to sit and listen
    if (!me.startListening) {
      me.log.warning(`Environment variable 'AMINO3_NO_LISTEN' was defined so bailing out!`);
      process.exit(0);
    }
    // tell loopback to use AminoAccessToken for auth
    me.app.use(me.loopback.token({
      model: me.app.models.AminoAccessToken
    }));
    me.log.debug(`Starting Amino3 by 'node server.js'`);
    me.log.debug(`Starting Socket.IO server`);
    me.postal
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
