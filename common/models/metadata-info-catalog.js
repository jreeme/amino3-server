'use strict';

module.exports = function(MetadataInfoCatalog) {

  MetadataInfoCatalog.remoteMethod('deleteAll', {
    isStatic: true,
    description: 'Delete all instances from the data source based on where criteria',
    accessType: 'WRITE',
    accepts: {arg: 'where', type: 'object', description: 'Criteria to match model instances'},
    returns: [
      {
        arg: 'info',
        type: 'object',
        root: true,
        description: 'deleteAll info'
      }
    ],
    http: {verb: 'del', path: '/deleteAll'}
  });
};
