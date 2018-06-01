'use strict';

module.exports = function (LogEntry) {
  {
    //>>>getLoggerCalledFromFiles
    LogEntry.getLoggerCalledFromFiles = function (req, res) {
      global.postal.publish({
        channel: 'Logger',
        topic: 'getLoggerCalledFromFiles',
        data: {req, res}
      });
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
      path: '/get-logger-called-from-files',
      verb: 'get'
    };

    LogEntry.remoteMethod('getLoggerCalledFromFiles', {
      accepts,
      returns,
      http
    });
    //<<<getLoggerCalledFromFiles
  }

  {
    //>>>setLoggerCallingFilesToIgnore
    LogEntry.setLoggerCallingFilesToIgnore = function (req, res) {
      global.postal.publish({
        channel: 'Logger',
        topic: 'setLoggerCallingFilesToIgnore',
        data: {req, res}
      });
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
        type: 'string',
        root: true,
        description: 'Result of LoggerCallingFilesToIgnore call'
      }
    ];

    const http = {
      path: '/set-logger-calling-files-to-ignore',
      verb: 'get'
    };

    LogEntry.remoteMethod('setLoggerCallingFilesToIgnore', {
      accepts,
      returns,
      http
    });
    //<<<setLoggerCallingFilesToIgnore
  }
};
