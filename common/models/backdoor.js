'use strict';

module.exports = function (Backdoor) {
  //createDataSetModel
  Backdoor.createBackdoor = function (createInfo, cb) {
    global.postal.publish({
      channel: 'Backdoor',
      topic: 'EvaluateJsonObject',
      data: {
        jsonObject: createInfo,
        cb
      }
    });
  };
  Backdoor.remoteMethod('createBackdoor', {
      accepts: [
        {
          arg: 'createInfo',
          type: 'object',
          required: true,
          description: 'JSON object describing backdoor',
          http: {source: 'body'}
        }
      ],
      returns: [
        {
          arg: 'name',
          type: 'object',
          root: true,
          description: 'Backdoor name'
        }
      ],
      http: {path: '/create-backdoor', verb: 'post'}
    }
  );
};
