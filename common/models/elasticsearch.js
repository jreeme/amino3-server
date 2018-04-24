const request = require('request');
module.exports = function (Elasticsearch) {
  Elasticsearch.elasticsearchAction = function (verb, req, res) {
    const uri = `http://192.168.104.33:9200/${verb}?pretty`;
    const requestOptions = {
      uri,
      method: req.method,
      json: req.body
    };
    request.post(requestOptions).pipe(res);
  };

  const accepts = [
    {
      arg: 'verb',
      type: 'string',
      required: true,
      description: 'Elasticsearch action to perform (_search, _count, etc.)'
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
    path: '/es/:verb',
    verb: 'all'
  };

  Elasticsearch.remoteMethod('elasticsearchAction', {
    accepts,
    returns,
    http
  });
};

