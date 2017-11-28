'use strict';

module.exports = function (DataSet) {
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
  DataSet.createDataSet = function (name, cb) {
    DataSet.create({
      name
    }, (err, newDataSet) => {
      cb(err, {name: newDataSet.name, created: !err});
    });
  };
  DataSet.remoteMethod('createDataSet', {
      accepts: [
        {
          arg: 'name',
          type: 'string',
          required: true,
          description: 'DataSet name'
        }
      ],
      returns: [
        {
          arg: 'name',
          type: 'string',
          root: true,
          description: 'DataSet name'
        },
        {
          arg: 'created',
          type: 'boolean',
          root: true,
          description: 'DataSet created'
        }
      ],
      http: {path: '/create-dataset', verb: 'post'}
    }
  );
};
