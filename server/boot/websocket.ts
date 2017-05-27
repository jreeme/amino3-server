import kernel from '../inversify.config';
import {IPostal, IEnvelope, CommandUtil} from 'firmament-yargs';
import nodeUrl = require('url');
import * as _ from 'lodash';
const path = require('path');
const fs = require('fs');

const findPort = require('find-free-port');
const webSocket = require('nodejs-websocket');
const safeJsonParse = require('safe-json-parse/callback');

let webSocketPort: number;

interface WebSocketConn {
  sendText(text:string),
  close()
}

module.exports = function (server) {
  let postal: IPostal = kernel.get<IPostal>('IPostal');
  let commandUtil: CommandUtil = kernel.get<CommandUtil>('CommandUtil');
  let connections: any = {};
  findPort(7001, 8000, (err, port) => {
    if (err) {
      return;
    }
    //Serve up websocket
    let wsServer = webSocket.createServer();
    wsServer.on('connection',conn=>{
      connections[conn.key] = conn;
      commandUtil.log(`Connection from: ${conn.key}`);

      console.log(`Connection from: ${conn.key}`);
      conn.on('text', text => {
        //Incoming message from websocket, make sure it's shaped like Postal's IEnvelope<T> then
        //use Postal to ship it
        safeJsonParse(text, (err: Error, envelope: IEnvelope<any>) => {
          if (err) {
            console.log(err.message);
            return;
          }
          if (!envelope || !envelope.channel || !envelope.topic || !envelope.data) {
            console.log(`Received bad envelope on websocket: ${JSON.stringify(envelope)}`);
            return;
          }
          postal.publish(envelope);
        });
      });
      conn.on('close', (code, reason) => {
        console.log(`WebSocket Closed = key: ${conn.key}, code: ${code}, reason: ${reason}`);
      });
    });
    wsServer.listen(webSocketPort = port);
    //Give client a way to get websocket port
    server.get('/util/get-websocket-port', function (req, res) {
      let url = nodeUrl.parse(`http://${req.headers.host}`);
      return res.status(200).send({
        hostname: url.hostname,
        port: webSocketPort,
        uri: `ws://${url.hostname}:${webSocketPort}`
      });
    });
    postal.subscribe({
      channel: 'WebSocket',
      topic: 'Broadcast',
      callback: (data) => {
        _.values(connections).forEach((conn:WebSocketConn)=>{
          try{
            conn.sendText(JSON.stringify(data));
          }catch(err){
            conn.close();
          }
        });
      }
    });
  });
};
