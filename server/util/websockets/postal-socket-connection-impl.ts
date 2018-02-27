import {injectable, inject} from 'inversify';
import {IPostal, ISubscriptionDefinition} from 'firmament-yargs';
import {SocketIoWrapper} from "./socketIoWrapper";
import {Logger} from "../logging/logger";

const Rx = require('rxjs');

@injectable()
export class PostalSocketConnectionImpl implements PostalSocketConnection {
  private postalSubscriptions: Set<ISubscriptionDefinition<any>> = new Set();
  private socketConnectionInfo: SocketConnectionInfo;

  get id(): string {
    const me = this;
    if (!me.socketIoWrapper) {
      me.log.error('Attempt to get id of non-existent socket');
      return null;
    }
    return this.socketIoWrapper.id;
  }

  private get myChannel(): string {
    return this.id;
  }

  constructor(@inject('Logger') private log: Logger,
              @inject('SocketIoWrapper') private socketIoWrapper: SocketIoWrapper,
              @inject('IPostal') private postal: IPostal) {
  }

  init(socket) {
    const me = this;
    me.log.notice(`Initializing PostalSocketConnection ${me.id}`);
    me.socketIoWrapper.init(socket, me);
    me.createPostalSubscriptions();
    //Shake hands with client
    me.log.notice(`Shaking hands with client ${me.id}`);
    me.publishToClient({
      topic: 'socket.handshake',
      data: {
        id: me.id
      }
    });
  }

  publishToClient(aminoMessage: AminoMessage) {
    const me = this;
    me.log.debug(`Publishing to client '${me.id}', AminoMessage: '${JSON.stringify(aminoMessage)}'`);
    me.socketIoWrapper.publishToClient(aminoMessage);
  }

  destroy() {
    const me = this;
    me.destroyPostalSubscriptions(() => {
      me.socketIoWrapper = null;
    });
  }

  private destroyPostalSubscriptions(cb: () => void) {
    const me = this;
    me.postal.publish({
      channel: 'ServiceBus',
      topic: 'RemovePostalSocketConnection',
      data: me
    });

    Rx
      .Observable
      .from(me.postalSubscriptions)
      .subscribe(
        (postalSubscription: ISubscriptionDefinition<any>) => {
          me.log.debug(`Unsubscribing topic '${postalSubscription.topic}' from ${me.id}`);
          postalSubscription.unsubscribe();
        },
        (err) => {
          me.log.error(`Unsubscribing postalSubscription from ${me.id} FAILED: ${JSON.stringify(err)}`);
        },
        () => {
          me.log.notice(`Unsubscribing postalSubscription topics from ${me.id} SUCCESSFUL`);
          cb();
        }
      );
    me.postalSubscriptions.clear();
  }

  private createPostalSubscriptions() {
    const me = this;
    const myPostalChannel = me.postal.channel(me.myChannel);
    me.postalSubscriptions.add(
      myPostalChannel
        .subscribe('socket.handshake', (sci: SocketConnectionInfo) => {
          if (me.socketConnectionInfo) {
            me.log.warning(`Setting non-null SocketConnectionInfo in '${me.id}': ${JSON.stringify(sci)}`);
          }
          me.log.notice(`Handshake returned from ${me.id}: ${JSON.stringify(sci)}`);
          me.socketConnectionInfo = sci;
        }));
  }
}

