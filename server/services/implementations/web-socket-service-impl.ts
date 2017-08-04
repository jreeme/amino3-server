import {injectable, inject} from 'inversify';
import {IEnvelope, IPostal} from 'firmament-yargs';
import {BaseService} from '../interfaces/base-service';
import {WebSocketService} from "../interfaces/web-socket-service";
import safeJsonParse = require('safe-json-parse/callback');
import findPort = require('find-free-port');
import webSocket = require('nodejs-websocket');
import kernel from '../../inversify.config';
import nodeUrl = require('url');
import fs = require('fs');
import * as _ from 'lodash';
import {LogService} from "../interfaces/log-service";
import {Globals} from "../../globals";

//noinspection JSUnusedGlobalSymbols
@injectable()
export class WebSocketServiceImpl implements WebSocketService {
  private webSocketPort: number;

  //noinspection JSUnusedLocalSymbols
  constructor(@inject('BaseService') private baseService: BaseService,
              @inject('LogService') private log: LogService,
              @inject('IPostal') private postal: IPostal) {
    //this.server.on('started', () => { });
  }

  get server(): any {
    return this.baseService.server;
  }

  initSubscriptions(cb: (err: Error, result: any) => void) {
    cb(null, {message: 'Initialized WebSocketService Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    const me = this;
    let postal: IPostal = kernel.get<IPostal>('IPostal');
    let connections: any = {};
    findPort(7001, 8000, (err, port) => {
      if (err) {
        return;
      }
      //Serve up websocket
      let wsServer = webSocket.createServer();
      wsServer.on('connection', conn => {
        connections[conn.key] = conn;
        me.log.debug(`Connection from: ${conn.key}`);
        conn.on('text', text => {
          //Incoming message from websocket, make sure it's shaped like Postal's IEnvelope<T> then
          //use Postal to ship it
          safeJsonParse(text, (err: Error, envelope: IEnvelope<any>) => {
            if (err) {
              conn.sendText(JSON.stringify({status: 'error', msg: 'WebSocket received invalid JSON'}));
              me.log.logIfError(err);
              return;
            }
            if (!envelope || !envelope.channel || !envelope.topic || !envelope.data) {
              me.log.error(`Received bad envelope on websocket: ${JSON.stringify(envelope)}`);
              return;
            }
            postal.publish(envelope);
          });
        });
        conn.on('close', (code, reason) => {
          me.log.info(`WebSocket Closed = key: ${conn.key}, code: ${code}, reason: ${reason}`);
        });
      });
      wsServer.listen(me.webSocketPort = port);
      //Give client a way to get websocket port
      me.server.get('/util/get-websocket-port', (req, res) => {
        let url = nodeUrl.parse(`http://${req.headers.host}`);
        return res.status(200).send({
          hostname: url.hostname,
          port: me.webSocketPort,
          uri: `ws://${url.hostname}:${me.webSocketPort}`
        });
      });
      //Give client a way to get websocket port
      me.server.get('/amino-lodash.js', (req, res) => {
        fs.readFile(Globals.lodashLibraryPath, (err, fileContents) => {
          const scriptContent = `(function(){console.log('hello from amino-lodash');})();${fileContents}`;
          res.status(200).send(scriptContent);
        });
      });
      me.server.get('/amino-postal.js', (req, res) => {
        let url = nodeUrl.parse(`http://${req.headers.host}`);
        fs.readFile(Globals.postalLibraryPath, (err, postalFileContents) => {
          const pfc = postalFileContents.toString();
          fs.readFile(Globals.clientSideWebSocketLibraryPath, (err, clientSideWebSocketFileContents) => {
            let wsfc = clientSideWebSocketFileContents.toString();
            wsfc = wsfc.replace('__WS_URL__', `ws://${url.hostname}:${me.webSocketPort}`);
            let scriptContent = `(function(){console.log('hello from amino-postal');})();`;
            scriptContent += `${pfc}`;
            scriptContent += `${wsfc}`;
            res.status(200).send(scriptContent);
          });
        });
      });
      postal.subscribe({
        channel: 'WebSocket',
        topic: 'Broadcast',
        callback: (data) => {
          _.values(connections).forEach((conn: WebSocketConn) => {
            try {
              conn.sendText(JSON.stringify(data));
            } catch (err) {
              conn.close();
            }
          });
        }
      });
    });
    cb(null, {message: 'Initialized WebSocketService'});
  }
}
