import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseServiceImpl} from '../base-service';
import {Logger} from '../../util/logging/logger';
import kernel from '../../inversify.config';
import * as _ from 'lodash';
import * as Rx from 'rxjs';
import * as SocketIO from 'socket.io';
import {Globals} from "../../globals";

@injectable()
export class WebSocketManagerImpl extends BaseServiceImpl {
  private socketIo: SocketIO.Server;
  private postalSocketConnections: Set<PostalSocketConnection> = new Set();
  private serverHeartbeatIntervalMS = 10000;
  private lastHeartbeatTimeBroadcast = 0;

  constructor(@inject('Logger') private log: Logger,
              @inject('IPostal') private postal: IPostal) {
    super();
  }

  private subscribeToPing(channel: string) {
    const me = this;
    me.postal
      .subscribe({
        channel,
        topic: 'Ping',
        callback: (data) => {
          me.log.debug('Received PING');
          data.cb && data.cb({
            channel: 'ServiceBus',
            topic: 'Pong',
            data: {}
          });
        }
      });
  }

  initSubscriptions(cb: (err: Error, result: any) => void) {
    super.initSubscriptions();
    const me = this;
    me.subscribeToPing('ServiceBus');
    me.subscribeToPing('WebSocketManager');
    me.postal
      .subscribe({
        channel: 'WebSocketManager',
        topic: 'getWebSocketInfo',
        callback: (data) => {
          const {res, req} = data;
          try {
            res.status(200).send(
              {
                serverWebSocketPath: Globals.serverWebSocketPath,
                clientUrl: `http://${req.connection.remoteAddress}:${req.connection.remotePort}`
              }
            );
          } catch(err) {
            res.status(500).send(err);
          }
        }
      });
    me.postal
      .subscribe({
        channel: 'ServiceBus',
        topic: 'RemovePostalSocketConnection',
        callback: (postalSocketConnection: PostalSocketConnection) => {
          me.removePostalSocketConnection(postalSocketConnection);
        }
      });
    me.postal
      .subscribe({
        channel: 'ServiceBus',
        topic: 'BroadcastToClients',
        callback: (aminoMessage: AminoMessage) => {
          me.postalSocketConnections.forEach((postalSocketConnection) => {
            postalSocketConnection.publishToClient(_.clone(aminoMessage));
          });
        }
      });
    me.postal
      .subscribe({
        channel: 'ServiceBus',
        topic: 'SetSocketIO',
        callback: (data) => {
          me.log.debug(`Setting SocketIO`);
          me.socketIo = <SocketIO.Server>data.io;
          me.socketIo.on('connection', me.addPostalSocketConnection.bind(me));
        }
      });
    cb(null, {message: 'Initialized WebSocketManagerImpl Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    this.startHeartbeat();
    cb(null, {message: 'Initialized WebSocketManagerImpl'});
  }

  private removePostalSocketConnection(postalSocketConnection: PostalSocketConnection) {
    const me = this;
    try {
      me.postalSocketConnections.delete(postalSocketConnection);
      me.log.notice(`Removing PostalSocketConnection'${postalSocketConnection.id}' from WebSocketManager`)
    } catch(err) {
      me.log.error(`ERROR Removing PostalSocketConnection'${postalSocketConnection.id}'`);
    }
  }

  private addPostalSocketConnection(socket: any) {
    const me = this;
    try {
      const postalSocketConnection = kernel.get<PostalSocketConnection>('PostalSocketConnection');
      postalSocketConnection.init(socket);
      me.log.notice(`Created PostalSocketConnection '${postalSocketConnection.id}'`);
      me.postalSocketConnections.add(postalSocketConnection);
    } catch(err) {
      me.log.error(`ERROR creating/adding PostalSocketConnection`);
    }
  }

  private startHeartbeat() {
    const me = this;
    Rx
      .Observable
      .interval(1000)
      .subscribe((ticks) => {
        const serverTime = Date.now();
        if(serverTime < (me.lastHeartbeatTimeBroadcast + me.serverHeartbeatIntervalMS)) {
          return;
        }
        me.lastHeartbeatTimeBroadcast = serverTime;
        const data = {
          ticks,
          serverTime
        };
        me.postal.publish({
          channel: 'ServiceBus',
          topic: 'ServerHeartbeat',
          data
        });
        if(Globals.suppressServerHeartbeatBroadcastToClients) {
          return;
        }
        me.postal.publish({
          channel: 'ServiceBus',
          topic: 'BroadcastToClients',
          data: {
            topic: 'ServerHeartbeat',
            data
          }
        });
      })
  }
}
