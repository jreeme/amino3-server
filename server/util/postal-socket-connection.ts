import {injectable, inject} from 'inversify';
import {BootManager} from "../startup/boot-manager";
import {IPostal} from "firmament-yargs";
import {LogService} from "../services/interfaces/log-service";
import {Observable} from "rxjs/Observable";

export interface PostalSocketConnection {
  id: string;
  init(_bootManager: BootManager, _socket: any);
}

@injectable()
export class PostalSocketConnectionImpl implements PostalSocketConnection {
  _id: string;
  private socket: any;
  private bootManager: BootManager;

  get id() {
    return this._id;
  }

  constructor(@inject('LogService') private log: LogService,
              @inject('IPostal') private postal: IPostal) {
  }

  init(_bootManager: BootManager, _socket: any) {
    const me = this;
    me.bootManager = _bootManager;
    me.socket = _socket;
    me._id = me.socket.id;
    me.bootManager.addPostalSocketConnection(me);
    //socket.emit('message', {type: 'new-message', text: 'hello'});
    /*    me.socket
          .fromEvent('disconnect')
          .subscribe((data) => {
            const d = data;
          })
          .catch(PostalSocketConnectionImpl.handleError);
        me.socket
          .fromEvent('message')
          .subscribe((data) => {
            const d = data;
          })
          .catch(PostalSocketConnectionImpl.handleError);*/
    //TODO: Get on the Observable/Subject<> bandwagon here!
    me.socket.on('message', (message) => {
    });
    me.socket.on('disconnect', () => {
    });
  }

  private static handleError(err: any) {
    return Observable.throw(new Error());
  }
}

