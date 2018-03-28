'use strict';

module.exports = function (ServerService) {

  //resetServer
  ServerService.resetServer = function (cb) {
    cb(null, {status: 'OK'});
    process.exit(0);
  };

  ServerService.remoteMethod('resetServer', {
      accepts: [],
      returns: {
        arg: 'results',
        type: 'string',
        root: true,
        description: 'Server reset results'
      },
      http: {path: '/resetServer', verb: 'post'}
    }
  );
};
