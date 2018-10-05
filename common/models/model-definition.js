module.exports = function (ModelDefinition) {
  //https://stackoverflow.com/questions/28885282/how-to-store-files-with-meta-data-in-loopback
  ModelDefinition.compareLoopbackModels = function (info, cb) {
    global.postal.publish({
      channel: 'PostalChannel-FileUpload',
      topic: 'CompareLoopbackModels',
      data: {
        info,
        cb
      }
    });
  };

  ModelDefinition.remoteMethod('compareLoopbackModels', {
      accepts: [
        {
          arg: 'info',
          type: 'object',
          required: true,
          description: '{sourceModels,targetModels: http://lh:3000/amino-api/ModelDefinitions/models/files}',
          http: {source: 'body'}
        }
      ],
      returns: [
        {
          arg: 'info',
          type: 'object',
          root: true,
          description: 'Model comparison object'
        }
      ],
      http: {path: '/compare-loopback-models', verb: 'post'}
    }
  );
};
