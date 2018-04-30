const request = require('request');
module.exports = function (Elasticsearch) {
  Elasticsearch.elasticsearchAction = function (esOverrideUrl, esVerb, esQueryJson, req, res) {
    const uri = `http://192.168.104.33:9200/${esVerb}?pretty`;
    const requestOptions = {
      uri,
      method: req.method,
      json: req.body
    };
    /*    request(requestOptions, (err, res, body) => {
          let e = err;
        });*/
    //request(requestOptions).pipe(res);
    global.postal.publish({
      channel: 'Elasticsearch',
      topic: 'Query',
      data: {
        esOverrideUrl,
        esVerb,
        esQueryJson,
        req,
        res
      }
    });
  };

  const accepts = [
    {
      arg: 'esOverrideUrl',
      type: 'string',
      required: true,
      description: `Override server's idea of ES Url`
    },
    {
      arg: 'esVerb',
      type: 'string',
      required: true,
      description: 'Elasticsearch action to perform (_search, _count, etc.)'
    },
    {
      arg: 'esQueryJson',
      type: 'object',
      http: {source: 'body'}
    },
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
      description: 'Result of Elasticsearch query'
    }
  ];

  const http = {
    path: '/es/:esOverrideUrl/:esVerb',
    verb: 'all'
  };

  Elasticsearch.remoteMethod('elasticsearchAction', {
    accepts,
    returns,
    http
  });
};

