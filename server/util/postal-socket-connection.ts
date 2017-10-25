import {injectable, inject} from 'inversify';
import {IPostal} from "firmament-yargs";
import {LogService} from "../services/interfaces/log-service";
import {Observable} from "rxjs/Observable";
import {Observer} from "rxjs/Observer";
import {Globals} from "../globals";

export interface PostalSocketConnection {
  id: string;
  init(_socket: any);
}

@injectable()
export class PostalSocketConnectionImpl implements PostalSocketConnection {
  private static postalSocketConnections: any = {};
  private _id: string;
  private socket: any;

  get id() {
    return this._id;
  }

  constructor(@inject('LogService') private log: LogService,
              @inject('IPostal') private postal: IPostal) {
  }

  init(_socket) {
    const me = this;
    me.socket = _socket;
    me._id = me.socket.id;

    me.createPostalSubscriptions();

    //Create an observable to monitor socket events
    const socketObservable: Observable<any> = Observable.create((observer: Observer<any>) => {
      //Listen for amino-messages
      me.socket.on(Globals.serverChannel, (aminoMessage) => {
        //Notify subscribers that we received a message
        observer.next(aminoMessage);
      });
      //Listen for client disconnect
      me.socket.on('disconnect', () => {
        me.onSocketDisconnect(observer);
      });
    });

    //Subscribe to socketSubject to receive aminoMessages from clients
    socketObservable.subscribe(me.onAminoMessageReceived.bind(me));

    //Register us with BootManager
    PostalSocketConnectionImpl.postalSocketConnections[me.id] = me;

    //Send client his socket.id
    me.socket.emit(Globals.serverChannel, {
      channel: Globals.serverChannel,
      topic: 'socket.id',
      data:{
        id: me.id
      }
    });
  }

  private onAminoMessageReceived(aminoMessage) {
    const me = this;
    me.postal.publish(aminoMessage);
  }

  private createPostalSubscriptions() {
    const me = this;
    me.postal
      .channel(me.id)
      .subscribe('*', (data) => {
        console.dir(data);
      });
  }

  private onSocketDisconnect(observer: Observer<any>) {
    const me = this;
    //Unregister us with BootManager and notify subscribers that we're out
    delete PostalSocketConnectionImpl.postalSocketConnections[me.id];
    me.socket.disconnect(true);//maybe unnecessary but try to make sure underlying socket is closed
    observer.complete();
  }
}

