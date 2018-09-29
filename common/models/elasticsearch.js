module.exports = function (Elasticsearch) {
  Elasticsearch.elasticsearchVerb = function (esVerb, esQueryJson, req, res) {
    //Due to loopback-sdk-builder implementation "feature" we have to do route variable
    //substitution ourselves. Fortunately loopback-sdk-builder sends the substitutions
    //in the query string
    esVerb = (esVerb === ':esVerb') ? req.query.esVerb : esVerb;
    global.postal.publish({
      channel: 'Elasticsearch',
      topic: 'Verb',
      //See: server/services/elasticsearch/elasticsearch.ts + ElasticsearchQuery interface
      data: {
        esVerb,
        esQueryJson,
        req,
        res
      }
    });
  };
  Elasticsearch.remoteMethod('elasticsearchVerb', {
    accepts:[
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
    ],
    returns:[
      {
        arg: 'result',
        type: 'object',
        root: true,
        description: 'Result of Elasticsearch query'
      }
    ],
    http:{
      path: '/es/:esVerb',
      verb: 'all'
    }
  });


  Elasticsearch.elasticsearchIndicesVerb = function (esIndices, esVerb, esQueryJson, req, res) {
    //Due to loopback-sdk-builder implementation "feature" we have to do route variable
    //substitution ourselves. Fortunately loopback-sdk-builder sends the substitutions
    //in the query string
    esIndices = (esIndices === ':esIndices') ? req.query.esIndices : esIndices;
    esVerb = (esVerb === ':esVerb') ? req.query.esVerb : esVerb;
    global.postal.publish({
      channel: 'Elasticsearch',
      topic: 'IndicesVerb',
      //See: server/services/elasticsearch/elasticsearch.ts + ElasticsearchQuery interface
      data: {
        esIndices,
        esVerb,
        esQueryJson,
        req,
        res
      }
    });
  };

  Elasticsearch.remoteMethod('elasticsearchIndicesVerb', {
    accepts:[
      {
        arg: 'esIndices',
        type: 'string',
        required: true,
        description: 'Elasticsearch indices to perform the verb on (indice1,indice2)'
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
    ],
    returns:[
      {
        arg: 'result',
        type: 'object',
        root: true,
        description: 'Result of Elasticsearch query'
      }
    ],
    http:{
      path: '/es/:esIndices/:esVerb',
      verb: 'all'
    }
  });


};

