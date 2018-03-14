import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {Logger} from '../util/logging/logger';
import {Globals} from "../globals";
import {ServiceManager} from "../util/service-manager";

export interface BootManager {
  start(loopback: any, loopbackApplication: LoopBackApplication2, applicationFolder: string, startListening: boolean);
}

@injectable()
export class BootManagerImpl implements BootManager {
  private loopback: any;
  private app: LoopBackApplication2;
  private startListening: boolean;

  constructor(@inject('Logger') private log: Logger,
              @inject('ServiceManager') private serviceManager: ServiceManager,
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

    //Tell loopback to use AminoAccessToken for auth
    me.app.use(me.loopback.token({
      model: me.app.models.AminoAccessToken
    }));

    //Loopback App booted so all configs are loaded (and available via app.get('config-name')
    //so this is a good time to initialize our Globals object
    Globals.init(me.app);

    //Sign up to hear back from ServiceManager when all the services (if any) are started
    me.postal
      .subscribe({
        channel: 'Amino3Startup',
        topic: 'services-started',
        callback: () => {
          me.log.info(`[RECV] 'Amino3Startup:services-started': `);
          //Sometimes, for building the client, etc., you just don't want to sit and listen
          if (!me.startListening || Globals.noListen) {
            process.exit(0);
          }
          me.log.info(`Starting Amino3 by 'node server.js'`);
          me.log.info(`Starting Socket.IO server`);
          me.postal
            .publish({
              channel: 'ServiceBus',
              topic: 'SetSocketIO',
              data: {io: require('socket.io')(me.listen())}
            });
          me.app.emit('started');
        }
      });

    //Bring ServiceManager to life
    me.serviceManager.initSubscriptions(me.app, (err: Error) => {
      if (err) {
        const errorMsg = `Failed to initialize 'ServiceManager': ${err.message}`;
        me.log.error(errorMsg);
        throw new Error(errorMsg);
      }
      me.postal
        .publish({
          channel: 'Amino3Startup',
          topic: 'loopback-booted'
        });
    });
  }

  private listen() {
    const me = this;
    return me.app.listen(() => {
      let baseUrl = me.app.get('url').replace(/\/$/, '');
      if (me.app.get('loopback-component-explorer')) {
        let explorerPath = me.app.get('loopback-component-explorer').mountPath;
        me.log.notice(`Browse your REST API at ${baseUrl} ${explorerPath}`);
      }
      me.log.notice(`Web server listening at: ${baseUrl}`);
    });
  }
}
