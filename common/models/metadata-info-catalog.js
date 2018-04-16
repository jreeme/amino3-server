'use strict';

module.exports = function(MetadataInfoCatalog) {

  MetadataInfoCatalog.remoteMethod('deleteAll', {
    isStatic: true,
    description: 'Delete all instances based on where criteria from the data source',
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
