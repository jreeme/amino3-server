'use strict';
const async = require("async");

module.exports = function (MetadataInfoCatalog) {
  MetadataInfoCatalog.observe('before delete', (ctx, next) => {
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
    //check the count with limit of 1000
    //while ( check count limit 1000 > 0)
    //delete count of 1000 entries
    async.doWhilst((cb) => {
      MetadataInfoCatalog.find({limit: 1000, fields: {id: true}, where: {datasetUID}}, (err, results) => {
        async.eachLimit(results, 20, (result, cb) => {
          MetadataInfoCatalog.deleteById(result.id, cb);
        }, (err) => {
          if (err) return cb(err);
          MetadataInfoCatalog.count({datasetUID}, (err, result) => {
            cb(err, result);
          });
        });
      });
    }, (count) => {
      return count > 0;
    }, (err, results) => {
      cb(err)
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
        description: 'deleteAll info'
      }
    ],
    http: {verb: 'del', path: '/deleteDatasetInfo'}
  });
};
