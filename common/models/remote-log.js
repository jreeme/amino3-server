'use strict';

module.exports = function (RemoteLog) {
  {
    //>>>log
    RemoteLog.log = function (remoteLogModel, cb) {
      global.postal.publish({
        channel: 'RemoteLogging',
        topic: 'IncomingMessage',
        data: remoteLogModel.toObject()
      });
      cb(null, {status: 'OK'});
    };

    const accepts = [
      {
        arg: 'remoteLogModel',
        type: 'RemoteLog',
        required: true,
        description: 'Object representing remote logging message',
        http: {source: 'body'}
      }
    ];

    const returns = [
      {
        arg: 'result',
        type: 'object',
        root: true,
        description: 'Remote logging result'
      }
    ];

    const http = {
      path: '/log',
      verb: 'post'
    };

    RemoteLog.remoteMethod('log', {
      accepts,
      returns,
      http
    });
    //<<<log
  }
};
