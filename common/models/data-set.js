'use strict';

module.exports = function (DataSet) {
  DataSet.observe('before save', function initializeDataSetName(ctx, next) {
    if(!ctx.instance){
      global.logger.debug(`DataSet 'before save' operation hook short circuited because 'ctx.instance === null'`);
      return next();
    }
    global.postal.publish({
      channel: 'PostalChannel-DataSetLaunchEtl',
      topic: 'BeforeDataSetSave',
      data: {
        ctx,
        next
      }
    });
  });
  DataSet.observe('after save', (ctx, next) => {
    global.postal.publish({
      channel: 'PostalChannel-DataSetLaunchEtl',
      topic: 'AfterDataSetSave',
      data: {
        ctx,
        next
      }
    });
  });
  {
    //>>>upload
    DataSet.upload = function (req, res) {
      global.postal.publish({
        channel: 'PostalChannel-DataSetUploadManager',
        topic: 'UploadFiles',
        data: {req, res}
      });
    };

    const accepts = [
      {
        arg: 'req',
        type: 'object',
        http: {source: 'req'}
      },
      {
        arg: 'res',
        type: 'object',
        http: {source: 'res'}
      }
    ];

    const returns = [
      {
        arg: 'result',
        type: 'object',
        root: true,
        description: 'Result of file upload'
      }
    ];

    const http = {
      path: '/upload',
      verb: 'post'
    };

    DataSet.remoteMethod('upload', {
      accepts,
      returns,
      http
    });
    //<<<upload
  }
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
};
