'use strict';
const async = require("async");

module.exports = function (MetadataInfoCatalog) {
  MetadataInfoCatalog.observe('before delete', (ctx, next) => {
    //return next();
    global.postal.publish({
      channel: 'PostalChannel-DataSetLaunchEtl',
      topic: 'BeforeMetadataInfoCatalogDelete',
      data: {
        ctx,
        next
      }
    });
  });

  MetadataInfoCatalog.deleteDatasetInfo = function (datasetUID, cb) {
    global.postal.publish({
      channel: 'PostalChannel-DataSetLaunchEtl',
      topic: 'DeleteDatasetInfo',
      data: {
        datasetUID,
        cb
      }
    });
  };

  MetadataInfoCatalog.remoteMethod('deleteDatasetInfo', {
    isStatic: true,
    description: 'Delete all instances from the data source based on filter criteria',
    accessType: 'WRITE',
    accepts: {arg: 'datasetUID', type: 'string', required: true, description: 'Criteria to match model instances'},
    returns: [
      {
        arg: 'info',
        type: 'object',
        root: true,
        description: 'deleteDatasetInfo result'
      }
    ],
    http: {verb: 'del', path: '/deleteDatasetInfo'}
  });
};
