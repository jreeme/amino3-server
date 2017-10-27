import {injectable, inject} from 'inversify';
import {IPostal, ISubscriptionDefinition} from "firmament-yargs";
import {LogService} from "../services/interfaces/log-service";
import {Observable} from "rxjs/Observable";
import {Observer} from "rxjs/Observer";
import {Globals} from "../globals";
import {AminoMessage, PostalSocketConnection, SocketConnectionInfo} from "../custom-typings";

const Rx = require('rxjs');

@injectable()
export class PostalSocketConnectionImpl implements PostalSocketConnection {
  private postalSubscriptions: Set<ISubscriptionDefinition<any>> = new Set();
  private socketConnectionInfo: SocketConnectionInfo;
  private _id: string;
  private socket: any;

  get id(): string {
    return this._id;
  }

  private get myChannel(): string {
    return this.id;
  }

  constructor(@inject('LogService') private log: LogService,
              @inject('IPostal') private postal: IPostal) {
  }

  init(_socket) {
    const me = this;
    me.socket = _socket;
    me._id = me.socket.id;

    me.log.notice(`Initializing PostalSocketConnection ${me.id}`);

    me.createPostalSubscriptions();

    //Create an observable to monitor socket events
    const socketObservable: Observable<any> = Rx.Observable.create((observer: Observer<any>) => {
      //Listen for aminoMessages
      me.socket.on(Globals.serverChannel, (aminoMessage: AminoMessage) => {
        observer.next(aminoMessage);
      });
      //Listen for client disconnect
      me.socket.on('disconnect', () => {
        me.log.notice(`Receiving DISCONNECT notification from client ${me.id}`);
        me.onSocketDisconnect(observer);
      });
    });

    //Subscribe to socketSubject to receive aminoMessages from clients
    socketObservable
      .subscribe((aminoMessage: AminoMessage) => {
        aminoMessage.data = aminoMessage.data || {};
        aminoMessage.data._clientSocketId = me.id;
        me.postal.publish(aminoMessage);
      });

    //Shake hands with client
    me.log.notice(`Shaking hands with client ${me.id}`);
    me.socket.emit(Globals.serverChannel, {
      topic: 'socket.handshake',
      data: {
        id: me.id//Give client his socket ID so he write it in debug messages
      }
    });
  }

  publishToClient(aminoMessage: AminoMessage) {
    throw new Error("Method not implemented.");
  }

  private createPostalSubscriptions() {
    const me = this;
    const myPostalChannel = me.postal.channel(me.myChannel);
    //const myLocalPostalChannel = me.postal.channel(me.myLocalChannel);
    me.postalSubscriptions.add(
      myPostalChannel
        .subscribe('socket.handshake', (sci: SocketConnectionInfo) => {
          me.log.notice(`Handshake returned from ${me.id}: ${JSON.stringify(sci)}`);
          me.socketConnectionInfo = sci;
        }));
    /*    //Allow 4 sub-topics
        let topic = '*';
        for (let i = 0; i < 5; ++i) {
          me.postalSubscriptions.add(
            myPostalChannel
              .subscribe(topic, (data: any) => {
                const infoMessage = (me.socketConnectionInfo)
                  ? `Processing aminoMessage from client '${me.id}' at '${me.socketConnectionInfo.clientUrl}'`
                  : `Processing aminoMessage from client '${me.id}'`;
                me.log.info(infoMessage);
                const channel = (data.channel === me.myChannel)
                  ? me.myLocalChannel
                  : data.channel;
                delete data.channel;
                const topic = data.topic;
                delete data.topic;
                me.log.debug(`aminoMessage: ${JSON.stringify({topic, data})}`);
                me.postal.publish({
                  channel,
                  topic,
                  data
                });
              })
          );
          topic += '.*';
        }*/
  }

  private onSocketDisconnect(observer: Observer<any>) {
    const me = this;
    me.postal
      .publish({
        channel: 'ServiceBus',
        topic: 'DestroySocketIO',
        data: {me}
      });
    Rx
      .Observable
      .from(me.postalSubscriptions)
      .subscribe(
        (postalSubscription: ISubscriptionDefinition<any>) => {
          me.log.notice(`Unsubscribing topic ${postalSubscription.topic} from ${me.id}`);
          postalSubscription.unsubscribe();
        },
        (err) => {
          me.log.error(`Unsubscribing postalSubscription from ${me.id} FAILED: ${JSON.stringify(err)}`);
        },
        () => {
          me.log.notice(`Unsubscribing postalSubscription topics from ${me.id} SUCCESSFUL`);
        }
      );
    me.postalSubscriptions.clear();
    me.socket.disconnect(true);//maybe unnecessary but try to make sure underlying socket is closed
    observer.complete();
  }
}

