import 'mocha';

const chakram = require('chakram');
const request = require('request');
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
    chakram.delete(`${aminoUsersUrlBase}/delete-all-users`)
      .then((response) => {
        expect(response).to.have.status(200);
        done();
      });
  });
  it('should create test amino users', () => {
    const responses = [];
    for (let user in testUsers) {
      const newUser = testUsers[user];
      const response = chakram.post(`${aminoUsersUrlBase}/create-user`, newUser);
      responses.push(response);
      expect(response).to.have.status(200);
      expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
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
      expect(response).to.have.status(200);
      expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
      expect(response.body).to.be.instanceOf(Array);
      expect(response.body).to.be.lengthOf(3);
    });
  });
});
