'use strict';

module.exports = function (AminoPostalMessage) {
  //publish
  AminoPostalMessage.publish = function (envelope, cb) {
    envelope.data = envelope.data || {};
    envelope.data.cb = (response) => {
      cb(null, response);
    };
    global.postal.publish(envelope);
  };

  AminoPostalMessage.remoteMethod('publish', {
      accepts: [
        {
          arg: 'envelope',
          type: 'AminoPostalMessage',
          required: true,
          description: 'Postal message to publish',
          http: {source: 'body'}
        }
      ],
      returns: [
        {
          arg: 'envelope',
          type: 'AminoPostalMessage',
          root: true,
          description: 'Published postal message'
        }
      ],
      http: {path: '/publish', verb: 'post'}
    }
  );
};
