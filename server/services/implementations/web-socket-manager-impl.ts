import kernel from '../../inversify.config';
import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseService} from '../interfaces/base-service';
import {LogService} from '../interfaces/log-service';
import {WebSocketManager} from "../interfaces/web-socket-manager";
import {AminoMessage, LoopBackApplication2, PostalSocketConnection, SocketConnectionInfo} from "../../custom-typings";
import {Globals} from "../../globals";

const Rx = require('rxjs');

//noinspection JSUnusedGlobalSymbols
@injectable()
export class WebSocketManagerImpl implements WebSocketManager {
  private postalSocketConnections: Set<PostalSocketConnection> = new Set();

  //noinspection JSUnusedLocalSymbols
  constructor(@inject('BaseService') private baseService: BaseService,
              @inject('LogService') private log: LogService,
              @inject('IPostal') private postal: IPostal) {
  }

  get server(): LoopBackApplication2 {
    return this.baseService.server;
  }

  initSubscriptions(cb: (err: Error, result: any) => void) {
    const me = this;
    me.postal
      .subscribe({
        channel: 'ServiceBus',
        topic: 'BroadcastToClients',
        callback: (aminoMessage:AminoMessage) => {
          Rx
            .Observable
            .from(me.postalSocketConnections)
            .subscribe(
              (psc: PostalSocketConnection) => {
                psc.publishToClient(aminoMessage);
              },
              (err) => {
                me.log.error(`BroadcastToClient FAILED: ${JSON.stringify(err)}`);
              },
              () => {
                me.log.debug(`BroadcastToClient SUCCESSFUL`);
              }
            );
        }
      });
    me
      .postal
      .subscribe({
        channel: 'ServiceBus',
        topic: 'SetSocketIO',
        callback: (data) => {
          me.log.debug(`Setting SocketIO`);
          data.io.on('connection', (socket) => {
            me.log.debug(`Creating PostalSocketConnection`);
            const psc = kernel.get<PostalSocketConnection>('PostalSocketConnection')
            me.postalSocketConnections.add(psc);
            psc.init(socket);
          });
        }
      });
    me
      .postal
      .subscribe({
        channel: 'ServiceBus',
        topic: 'DestroySocketIO',
        callback: (psc: PostalSocketConnection) => {
          me.log.debug(`Destroying SocketIO`);
          me.postalSocketConnections.delete(psc);
        }
      });
    cb(null, {message: 'Initialized WebSocketManagerImpl Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    const me = this;
    me.server.get('/util/get-websocket-info', (req, res) => {
      try {
        res.status(200).send({
          serverUrl: `http://${req.connection.localAddress}:${req.connection.localPort}`,
          clientUrl: `http://${req.connection.remoteAddress}:${req.connection.remotePort}`
        });
      } catch (err) {
        res.status(500).send(err);
      }
    });
    cb(null, {message: 'Initialized WebSocketManagerImpl'});
  }
}
