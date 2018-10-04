module.exports = function (ModelDefinition) {
  //https://stackoverflow.com/questions/28885282/how-to-store-files-with-meta-data-in-loopback
  ModelDefinition.tmpCompareLoopbackModels = function (info, cb) {
    global.postal.publish({
      channel: 'PostalChannel-FileUpload',
      topic: 'TmpCompareLoopbackModels',
      data: {
        info,
        cb
      }
    });
  };

  ModelDefinition.remoteMethod('tmpCompareLoopbackModels', {
      accepts: [
        {
          arg: 'info',
          type: 'object',
          required: true,
          description: 'JSON object info',
          http: {source: 'body'}
        }
      ],
      returns: [
        {
          arg: 'info',
          type: 'object',
          root: true,
          description: 'info'
        }
      ],
      http: {path: '/tmp', verb: 'post'}
    }
  );
};
