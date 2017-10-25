import {IO, ioEvent} from 'rxjs-socket.io'
import {Subscription} from 'rxjs/Subscription';
import {Observer} from 'rxjs/Observer';
import {Subject} from "rxjs/Subject";

const url = 'http://localhost:3000';


/** create a new pointer to the SocketIO wrapper */
const socket = new IO();

/** create a new Event which will be pushed into @socket on connection */
const onHelloWorld: ioEvent = new ioEvent('amino-message');

/** since ioEvent returns an observable in one of its props, lets go ahead and define a subscription*/

/** tell socket io to listen to the hello world event and subscribe to the result */
let observable = socket
    .listenToEvent(onHelloWorld)
    .event$;

const observer: Observer<any> = {
    complete: (() => {
        console.log('complete');
    }),
    error: ((err) => {
        console.log(err.message);
    }),
    next: ((value) => {
        socket.emit('amino-message', value);
    })
};

const helloWorld$: Subject<any> = Subject
    .create(observer, observable);

const subscription: Subscription = helloWorld$
    .subscribe((newState) => {
        console.dir(newState);
    });

setTimeout(() => {
    helloWorld$.next({type: 'new-message', text: 'goodbye'});
}, 3000);


/** the hello world event we just created will be pushed once the connection is established */
socket.connect(url);

