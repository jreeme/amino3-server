import 'mocha';

const chakram = require('chakram');
const expect = chakram.expect;

const config = require('../config.test.json');
let urlBuilder = config.restApiTest.testTargetHost;
urlBuilder += `:${config.restApiTest.testTargetPort}`;
urlBuilder += config.restApiTest.testTargetRestApiRoot;
const apiUrlBase = `http://${urlBuilder}`;

describe('AminoUsers static operations', () => {
  const aminoUsersUrlBase = `${apiUrlBase}/AminoUsers`;
  beforeEach(()=>{

  });
  it('should create test amino user', () => {
    const response = chakram.post(`${aminoUsersUrlBase}/create-user`,
      {
        username: 'testAminoUser',
        firstName: 'testAminoUser-firstName',
        lastName: 'testAminoUser-lastName',
        email: 'testAminoUser@email.com',
        password: 'testAminoUser-password'
      });
    expect(response).to.have.status(200);
    expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
    expect(response).not.to.be.encoded.with.gzip;
    expect(response).to.comprise.of.json({
      args: {test: 'chakram'}
    });
    return chakram.wait();
  });
});
