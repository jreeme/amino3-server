import 'mocha';

const chakram = require('chakram');
const request = require('request');
const async = require('async');
const fs = require('fs');
const path = require('path');
const Rx = require('rxjs');
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
              const testData = require(testDataFile);
              cb();
            },
            (err) => {
              cb();
            });
      }
    ], (err) => {
      done();
    });
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
