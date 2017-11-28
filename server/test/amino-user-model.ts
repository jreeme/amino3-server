import 'mocha';

const chakram = require('chakram');
const async = require('async');
const fs = require('fs');
const path = require('path');
/*const request = require('request');
const Rx = require('rxjs');*/
const camelCase = require('camelcase');
const expect = chakram.expect;

const config = require('../config.test.json');
let urlBuilder = config.restApiTest.testTargetHost;
urlBuilder += `:${config.restApiTest.testTargetPort}`;
urlBuilder += config.restApiTest.testTargetRestApiRoot;
const apiUrlBase = `http://${urlBuilder}`;

const testUsers = {
  admin: {
    username: 'adminUser',
    firstName: 'adminUser-firstName',
    lastName: 'adminUser-lastName',
    email: 'adminUser@email.com',
    password: 'adminUser-password'
  },
  guest: {
    username: 'guestUser',
    firstName: 'guestUser-firstName',
    lastName: 'guestUser-lastName',
    email: 'guestUser@email.com',
    password: 'guestUser-password'
  },
  authenticated: {
    username: 'authenticatedUser',
    firstName: 'authenticatedUser-firstName',
    lastName: 'authenticatedUser-lastName',
    email: 'authenticatedUser@email.com',
    password: 'authenticatedUser-password'
  }
};

describe('AminoUsers static operations', () => {
  const aminoUsersUrlBase = `${apiUrlBase}/AminoUsers`;
  const dataSetsUrlBase = `${apiUrlBase}/DataSets`;
  before((done) => {
    async.parallel([
        (cb) => {
          chakram.delete(`${aminoUsersUrlBase}/delete-all-users`)
            .then((response) => {
              expect(response).to.have.status(200);
              cb();
            });
        },
        (cb) => {
          const testDataFolder = path.resolve(__dirname, './test-data');
          const testDataFiles = fs.readdirSync(testDataFolder)
            .map((testDataFile) => path.resolve(testDataFolder, testDataFile));
          async
            .each(testDataFiles, (testDataFile, cb) => {
                const testDataRows = require(testDataFile);
                const dataSetModelName = camelCase(path.basename(testDataFile/*,'.json'*/));
                const dataSetModelNamePlural = dataSetModelName + 's';
                const newDataSet = {name: dataSetModelName};
                const response = chakram.post(`${dataSetsUrlBase}/create-dataset`, newDataSet);
                response.then((res) => {
                  if (res.body.name !== dataSetModelName) {
                    return cb(new Error(`Creation of DataSet '${dataSetModelName}' FAILED`));
                  }
                  const newDataSetModel = {
                    modelName: dataSetModelName,
                    model: testDataRows.shift(),//Use first row create db schema
                    options: {
                      idInjection: true,
                      strict: true,
                      plural: dataSetModelNamePlural
                    }
                  };
                  const response = chakram.post(`${dataSetsUrlBase}/create-dataset-model`, newDataSetModel);
                  response.then((res) => {
                    if (res.body.error) {
                      return cb(res.body.error);
                    }
                    const dataSetModelsUrlBase = `${apiUrlBase}/${dataSetModelNamePlural}`;
                    async
                      .each(testDataRows, (testDataRow, cb) => {
                          //TODO: Chunk testDataRows and send in array of rows to create
                          const response = chakram.post(`${dataSetModelsUrlBase}`, testDataRow);
                          response.then((res) => {
                            cb(res.body.error);
                          });
                        },
                        (err) => {
                          if (err) {
                            return cb(err);
                          }
                          //Update record count in DataSet entry
                          const response = chakram.get(`${dataSetModelsUrlBase}/count`);
                          response.then((res) => {
                            if (res.body.error) {
                              return cb(res.body.error);
                            }
                            const count = res.body.count;
                            const response = chakram.get(`${dataSetsUrlBase}?filter={"where":{"name":"dataSet01Json"}}`);
                            response.then((res) => {
                              let r = res;
                              cb();
                            });
                          })
                          ;
                        });
                  });
                });
              },
              (err) => {
                cb(err);
              });
        }
      ],
      (/*err*/) => {
        done();
      }
    )
    ;
  });
  it('should create test amino users', () => {
    const responses = [];
    for (let user in testUsers) {
      const newUser = testUsers[user];
      const response = chakram.post(`${aminoUsersUrlBase}/create-user`, newUser);
      responses.push(response);
      checkResponseStatusAndHeaders(response);
      expect(response).to.comprise.of.json({
        username: newUser.username,
        fullname: `${newUser.firstName} ${newUser.lastName}`,
        email: newUser.email
      });
    }
    return chakram.waitFor(responses);
  });
  it('should get the test users', () => {
    const response = chakram.get(`${aminoUsersUrlBase}`);
    return response.then((response) => {
      checkResponseStatusAndHeaders(response);
      expect(response.body).to.be.instanceOf(Array);
      expect(response.body).to.be.lengthOf(4);//Test users + system created superuser
    });
  });
});

function checkResponseStatusAndHeaders(response) {
  expect(response).to.have.status(200);
  expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
}
