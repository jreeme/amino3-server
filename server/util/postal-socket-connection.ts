import {injectable, inject} from 'inversify';
import {IEnvelope, IPostal, ISubscriptionDefinition} from "firmament-yargs";
import {LogService} from "../services/interfaces/log-service";
import {Observable} from "rxjs/Observable";
import {Observer} from "rxjs/Observer";
import {Globals} from "../globals";

const Rx = require('rxjs');

export interface PostalSocketConnection {
  id: string;
  init(_socket: any);
  socket: any;
}

interface AminoMessage extends IEnvelope<any> {
  clientSocketId: string
}

interface SocketConnectionInfo {
  serverUrl: string,
  clientUrl: string
}

@injectable()
export class PostalSocketConnectionImpl implements PostalSocketConnection {
  private static postalSocketConnections: Set<PostalSocketConnection> = new Set();
  private postalSubscriptions: Set<ISubscriptionDefinition<any>> = new Set();
  private socketConnectionInfo: SocketConnectionInfo;
  private _id: string;
  socket: any;

  get id() {
    return this._id;
  }

  private tmpId: string;

  constructor(@inject('LogService') private log: LogService,
              @inject('IPostal') private postal: IPostal) {
    this.tmpId = Math.random().toString();
  }

  init(_socket) {
    const me = this;
    me.socket = _socket;
    me._id = me.socket.id;

    me.log.debug(`Initializing PostalSocketConnection ${me.id}`);

    me.createPostalSubscriptions();

    //Create an observable to monitor socket events
    const socketObservable: Observable<any> = Rx.Observable.create((observer: Observer<any>) => {
      //Listen for amino-messages
      me.socket.on(Globals.serverChannel, (aminoMessage: AminoMessage) => {
        //Notify subscribers that we received a message
        aminoMessage.clientSocketId = me.id;
        observer.next(aminoMessage);
      });
      //Listen for client disconnect
      me.socket.on('disconnect', () => {
        me.log.debug(`Receiving DISCONNECT notification from client ${me.id}`);
        me.onSocketDisconnect(observer);
      });
    });

    //Subscribe to socketSubject to receive aminoMessages from clients
    socketObservable.subscribe(me.onAminoMessageReceived.bind(me));

    //Register us with BootManager
    PostalSocketConnectionImpl.postalSocketConnections.add(me);

    //Shake hands with client
    me.log.debug(`Shaking hands with client ${me.id}`);
    me.socket.emit(Globals.serverChannel, {
      channel: Globals.serverChannel,
      topic: 'socket.handshake',
      data: {
        id: me.id
      }
    });
  }

  private onAminoMessageReceived(aminoMessage: AminoMessage) {
    const me = this;
    //aminoMessage.channel = aminoMessage.clientSocketId || aminoMessage.channel;
    me.postal.publish(aminoMessage);
  }

  private createPostalSubscriptions() {
    const me = this;
    me.postalSubscriptions.add(
      me.postal
        .subscribe({
          topic: 'BroadcastToClients',
          callback: (data) => {
            Rx
              .Observable
              .from(PostalSocketConnectionImpl.postalSocketConnections)
              .subscribe(
                (psc: PostalSocketConnection) => {
                  psc.socket.emit(Globals.serverChannel, {
                    topic: data.topic
                  });
                },
                (err) => {
                  me.log.error(`BroadcastToClient FAILED: ${JSON.stringify(err)}`);
                },
                () => {
                  me.log.debug(`BroadcastToClient SUCCESSFUL`);
                }
              );
          }
        })
    );
    me.postalSubscriptions.add(
      me.postal.subscribe({
        topic: 'socket.handshake',
        callback: (socketConnectionInfo: SocketConnectionInfo) => {
          me.socketConnectionInfo = socketConnectionInfo;
        }
      })
    );
    me.postalSubscriptions.add(
      me.postal
        .channel(me.id)
        .subscribe('*', (data: any) => {
          me.log.debug(`Processing aminoMessage from client ${me.id} at ${me.socketConnectionInfo.clientUrl}`);
          const topic = data.topic;
          delete data.topic;
          me.log.info(`aminoMessage: ${JSON.stringify({topic, data})}`);
          me.postal.publish({
            topic,
            data
          });
        })
    );
  }

  private onSocketDisconnect(observer: Observer<any>) {
    const me = this;
    //Unregister us with BootManager and notify subscribers that we're out
    Rx
      .Observable
      .from(me.postalSubscriptions)
      .subscribe(
        (postalSubscription: ISubscriptionDefinition<any>) => {
          me.log.debug(`Unsubscribing topic ${postalSubscription.topic} from ${me.id}`);
          postalSubscription.unsubscribe();
        },
        (err) => {
          me.log.error(`Unsubscribing postalSubscription from ${me.id} FAILED: ${JSON.stringify(err)}`);
        },
        () => {
          me.log.debug(`Unsubscribing postalSubscription topics from ${me.id} SUCCESSFUL`);
        }
      );
    me.postalSubscriptions.clear();
    PostalSocketConnectionImpl.postalSocketConnections.delete(me);
    me.socket.disconnect(true);//maybe unnecessary but try to make sure underlying socket is closed
    observer.complete();
  }
}

