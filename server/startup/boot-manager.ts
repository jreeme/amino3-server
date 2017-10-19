import {injectable, inject} from 'inversify';
import {LogService} from '../services/interfaces/log-service';
import {LoopBackApplication2} from '../custom-typings';
import nodeUrl = require('url');
import {IPostal} from "firmament-yargs";

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
    me.io.on('connection', (socket) => {
      socket.on('add-message', (message) => {
        socket.emit('message', {type: 'new-message', text: message});
      });
      socket.on('disconnect', () => {
      });
    });
    me.app.get('/util/get-websocket-info', (req, res) => {
      try {
        const os = require('os');
        let interfaces = os.networkInterfaces();
        let addresses = [];
        for (let k in interfaces) {
          for (let k2 in interfaces[k]) {
            let address = interfaces[k][k2];
            if (address.family === 'IPv4' && !address.internal) {
              addresses.push(address.address);
            }
          }
        }

        res.status(200).send(nodeUrl.parse(`http://${req.headers.host}`));
      } catch (err) {
        return res.status(500).send(err);
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
