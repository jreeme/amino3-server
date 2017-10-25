import {injectable, inject} from 'inversify';
import kernel from '../inversify.config';
import {LogService} from '../services/interfaces/log-service';
import {LoopBackApplication2} from '../custom-typings';
import {IPostal} from "firmament-yargs";
import {PostalSocketConnection} from "../util/postal-socket-connection";

export interface BootManager {
  start(loopbackApplication: LoopBackApplication2, applicationFolder: string, startListening: boolean);
}

@injectable()
export class BootManagerImpl implements BootManager {
  private app: LoopBackApplication2;
  private startListening: boolean;
  private io: any;//We have @types/socket.io but it's not working for some reason

  constructor(@inject('LogService') private log: LogService,
              @inject('IPostal') private postal: IPostal) {
  }

  start(_app: LoopBackApplication2, _applicationFolder: string, _startListening: boolean) {
    const me = this;
    me.app = _app;
    me.app.on('started', me.started.bind(me));
    me.startListening = _startListening;
    me.log.info(`Booting Amino3 using 'loopback-boot'`);
    require('loopback-boot')(me.app, _applicationFolder, me.bootCallback.bind(me));
  }

  private started() {
    const me = this;
    me.createSystemRoutes();
    me.configurePostalAndSocketIO();
    //BEGIN --> Remove Me!
    me.postal.subscribe({
      channel: 'testChannel',
      topic: 'testTopic',
      callback: (data) => {
        console.dir(data);
      }
    });
    //END --> Remove Me!
  }

  private configurePostalAndSocketIO() {
    const me = this;
    me.io.on('connection', (socket) => {
      const postalSocketConnection = kernel.get<PostalSocketConnection>('PostalSocketConnection');
      postalSocketConnection.init(socket);
    });
  }

  private createSystemRoutes() {
    const me = this;
    me.app.get('/util/get-websocket-info', (req, res) => {
      try {
        const url = {url: `http://${req.connection.localAddress}:${req.connection.localPort}`};
        res.status(200).send(url);
      } catch (err) {
        res.status(500).send(err);
      }
    });
  }

  private bootCallback(err: Error) {
    const me = this;
    if (err) {
      const errorMsg = `Error booting loopback application: ${err.message}`;
      me.log.error(errorMsg);
      throw new Error(errorMsg);
    }
    // start the server if `$ node server.js`
    if (!me.startListening) {
      me.log.info(`Starting Amino3`);
      return;
    }
    me.log.info(`Starting Amino3 by 'node server.js'`);
    me.log.info(`Starting Socket.IO server`);
    me.io = require('socket.io')(me.listen());
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
