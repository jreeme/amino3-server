'use strict';

module.exports = function (UploadedFile) {
  //destroyAll
  UploadedFile.aminoDestroyAll = function (cb) {
    UploadedFile.destroyAll((err, info) => {
      cb(err, info);
    });
  };
  UploadedFile.remoteMethod('aminoDestroyAll', {
      accepts: [],
      returns: [
        {
          arg: 'info',
          type: 'object',
          root: true,
          description: 'DestroyAll info'
        }
      ],
      http: {path: '/aminoDestroyAll', verb: 'post'}
    }
  );
  //ingestUploadedJsonFile
  UploadedFile.ingestUploadedJsonFile = function (uploadedFile, cb) {
    const DS = UploadedFile.app.models.DataSet;
    DS.create({
      name: 'Goony Byrd'
    }, (err, result) => {
      cb(new Error('sorry, man'));
      //cb(err, result);
    });
  };

  UploadedFile.remoteMethod('ingestUploadedJsonFile', {
      accepts: [
        {
          arg: 'uploadedFile',
          type: 'UploadedFile',
          required: true,
          description: 'Uploaded file model to ingest',
          http: {source: 'body'}
        }
      ],
      returns: [
        {
          arg: 'dataSet',
          type: 'DataSet',
          root: true,
          description: 'DataSet created by JSON file ingest'
        }
      ],
      http: {path: '/ingestUploadedJsonFile', verb: 'post'}
    }
  );
};
