module.exports = function (app) {
  //This should be used only in production
  let path = require('path');
  let loopback = require('loopback');
  let wwwPath = (process.env.NODE_ENV === 'production')
    ? '../../client/dist'
    : '../../client/dist';
  console.log(path.resolve(__dirname, wwwPath));
  app.use(loopback.static(path.resolve(__dirname, wwwPath)));
};
