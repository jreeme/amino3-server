'use strict';

module.exports = function (WebSocket) {
  {
    //>>>getWebSocketInfo
    WebSocket.getWebSocketInfo = function (req, res) {
      global.postal.publish({
        channel: 'WebSocketManager',
        topic: 'Ping',
        data: {
          cb: () => {
            req && res && global.postal.publish({
              channel: 'WebSocketManager',
              topic: 'getWebSocketInfo',
              data: {req, res}
            });
            req = res = undefined;
          }
        }
      });
      setTimeout(() => {
        try {
          res && res.status(405).send({status: 'Unavailable'});
        } catch (err) {
          console.error(err.toString());
        }
        req = res = undefined;
      }, 2000);
    };

    const accepts = [
      {
        arg: 'req',
        type: 'object',
        http: {source: 'req'}
      },
      {
        arg: 'res',
        type: 'object',
        http: {source: 'res'}
      }
    ];

    const returns = [
      {
        arg: 'result',
        type: 'object',
        root: true,
        description: 'Result of LoggerCalledFromFiles query'
      }
    ];

    const http = {
      path: '/get-web-socket-info',
      verb: 'get'
    };

    WebSocket.remoteMethod('getWebSocketInfo', {
      accepts,
      returns,
      http
    });
    //<<<getWebSocketInfo
  }
};
