module.exports = function (Elasticsearch) {
  Elasticsearch.elasticsearchAction = function (esVerb, esQueryJson, req, res) {
    global.postal.publish({
      channel: 'Elasticsearch',
      topic: 'Query',
      //See: server/services/elasticsearch/elasticsearch.ts + ElasticsearchQuery interface
      data: {
        esVerb,
        esQueryJson,
        req,
        res
      }
    });
  };

  const accepts = [
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
    path: '/es/:esVerb',
    verb: 'all'
  };

  Elasticsearch.remoteMethod('elasticsearchAction', {
    accepts,
    returns,
    http
  });
};

