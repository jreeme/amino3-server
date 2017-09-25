const loopback = require('loopback');
const fs = require('fs');
const path = require('path');
const modelConfigPath = path.resolve(__dirname, '../../model-config.json');
const modelsPath = path.resolve(__dirname, '../../../common/models');
const dataSource = loopback.createDataSource('mysql', {
  //host: "127.0.0.1",
  host: "10.1.70.196",
  port: 3306,
  url: "",
  database: "aml",
  name: "mysql",
  user: "influent",
  password: "influent",
  acquireTimeout: 30000,
  connectTimeout: 30000,
  connector: "mysql"
});

function convertModelNameToFileName(modelName) {
  return modelName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function defaultJsFileContents(modelName) {
  return 'module.exports = function(/*' + modelName + '*/){};'
}

function updateModelConfig(schema, dataSource) {
  const cfg = JSON.parse(fs.readFileSync(modelConfigPath));

  cfg[schema.name] = {
    dataSource: dataSource.name,
    'public': true
  };

  fs.writeFileSync(modelConfigPath, JSON.stringify(cfg, null, 2));
}

function writeFilesForModelSchema(schema) {
  const filePath = modelsPath + '/' + convertModelNameToFileName(schema.name);
  fs.writeFileSync(filePath + '.json', JSON.stringify(schema, null, 2));
  fs.writeFileSync(filePath + '.js', defaultJsFileContents(schema.name));
  updateModelConfig(schema, dataSource);
}

dataSource.discoverModelDefinitions({
  views: true,
  all: false,
  owner: 'aml',
  limit: 100
}, (err, tables) => {
  tables.forEach((table) => {
    dataSource.discoverSchema(
      table.name,
      //{relations: true, all: true, views: true},
      {owner: 'aml'},
      (err, schema) => {
        writeFilesForModelSchema(schema);
      });
  });
});

