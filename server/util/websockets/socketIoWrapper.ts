import {injectable, inject} from 'inversify';
import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import {Globals} from '../../globals';
import {IPostal} from 'firmament-yargs';
import {Logger} from '../logging/logger';
import * as SocketIO from 'socket.io';

const Rx = require('rxjs');

export interface SocketIoWrapper {
  id: string;
  init(socket: SocketIO.Socket, postalSocketConnection: PostalSocketConnection);
  publishToClient(aminoMessage: AminoMessage);
}

@injectable()
export class SocketIoWrapperImpl implements SocketIoWrapper {
  private postalSocketConnection: PostalSocketConnection;
  private socket: SocketIO.Socket;
  private _id: string;

  constructor(@inject('Logger') private log: Logger,
              @inject('IPostal') private postal: IPostal) {
  }

  get id(): string {
    return this._id;
  }

  publishToClient(aminoMessage: AminoMessage) {
    const me = this;
    if (!aminoMessage || !(typeof aminoMessage === 'object')) {
      me.log.warning('Attempt to publish empty or invalid AminoMessage to client');
      return;
    }
    try {
      aminoMessage.data = aminoMessage.data || {};
      me.socket.emit(Globals.serverChannel, aminoMessage);
    } catch (err) {
      me.log.error(`${JSON.stringify(err)}`);
    }
  }

  init(_socket: SocketIO.Socket, _postalSocketConnection: PostalSocketConnection) {
    const me = this;
    me.postalSocketConnection = _postalSocketConnection;
    me.socket = _socket;
    me._id = me.socket.id;

    me.log.notice(`Initializing SocketIoWrapper ${me.id}`);

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
  }

  private onSocketDisconnect(observer: Observer<any>) {
    const me = this;
    try {
      me.socket.disconnect(true);//maybe unnecessary but try to make sure underlying socket is closed
      observer.complete();
    } catch (err) {
    } finally {
      me.postalSocketConnection.destroy();
    }
  }
}

