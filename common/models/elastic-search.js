const request = require('request');
module.exports = function (ElasticSearch) {
  ElasticSearch.elasticsearchAction = function (verb, req, res) {
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
      description: 'ElasticSearch action to perform (_search, _count, etc.)'
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
      description: 'Result of ElasticSearch query'
    }
  ];

  const http = {
    path: '/es/:verb',
    verb: 'all'
  };

  ElasticSearch.remoteMethod('elasticsearchAction', {
    accepts,
    returns,
    http
  });
};

