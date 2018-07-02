'use strict';

module.exports = function (DataSet) {
  //destroyAll
  DataSet.aminoDestroyAll = function (cb) {
    DataSet.destroyAll((err, info) => {
      cb(err, info);
    });
  };
  DataSet.remoteMethod('aminoDestroyAll', {
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

  //createDataSetModel
  DataSet.createDataSetModel = function (modelCreateInfo, cb) {
    const db = DataSet.app.dataSources.db;
    const DataSetModel = db.buildModelFromInstance(
      modelCreateInfo.modelName,
      modelCreateInfo.model,
      modelCreateInfo.options
    );
    DataSet.app.model(DataSetModel);
    DataSetModel.create(modelCreateInfo.model, (err/*, newModel*/) => {
      cb(err, modelCreateInfo.modelName);
    });
  };
  DataSet.remoteMethod('createDataSetModel', {
      accepts: [
        {
          arg: 'modelCreateInfo',
          type: 'object',
          required: true,
          description: 'JSON object describing model to create',
          http: {source: 'body'}
        }
      ],
      returns: [
        {
          arg: 'name',
          type: 'string',
          root: true,
          description: 'DataSetModel name'
        }
      ],
      http: {path: '/create-dataset-model', verb: 'post'}
    }
  );
  //createDataSet
  DataSet.createDataSet = function (dataSetToCreate, cb) {
    DataSet.create(dataSetToCreate, (err, newDataSet) => {
      cb(err, newDataSet);
    });
  };
  DataSet.remoteMethod('createDataSet', {
      accepts: [
        {
          arg: 'dataSetToCreate',
          type: 'DataSet',
          required: true,
          description: 'JSON object containing new data set info',
          http: {source: 'body'}
        }
      ],
      returns: [
        {
          arg: 'createdDataSet',
          type: 'DataSet',
          root: true,
          description: 'Created DataSet'
        }
      ],
      http: {path: '/create-dataset', verb: 'post'}
    }
  );

  DataSet.observe('before save', function initializeDataSetName(ctx, next) {
    ctx.instance.datasetName = ctx.instance.contactAgency + '-' + ctx.instance.caseName;
    next();
  });
};
