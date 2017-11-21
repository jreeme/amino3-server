import 'mocha';

const chakram = require('chakram');
const expect = chakram.expect;

describe("HTTP assertions", function () {
  it("should make HTTP assertions easy", function () {
    const response = chakram.get("http://httpbin.org/get?test=chakram");
    expect(response).to.have.status(200);
    expect(response).to.have.header("content-type", "application/json");
    expect(response).not.to.be.encoded.with.gzip;
    expect(response).to.comprise.of.json({
      args: {test: "chakram"}
    });
    return chakram.wait();
  });
});
