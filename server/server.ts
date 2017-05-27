(() => {
  const loopback = require('loopback');
  const boot = require('loopback-boot');
  const path = require('path');
  const fs = require('fs');
  const app = module.exports = loopback();

  (<any>global).configFilePath = path.resolve(__dirname, 'config.json');
  if (process.env.CONFIG_FILE_FOLDER) {
    let configFilePath = path.resolve(process.env.CONFIG_FILE_FOLDER, 'config.json');
    if (fs.existsSync(configFilePath)) {
      (<any>global).configFilePath = configFilePath;
    }
  }

  app.start = function () {
    // start the web server
    return app.listen(function () {
      app.emit('started');
      let baseUrl = app.get('url').replace(/\/$/, '');
      console.log('Web server listening at: %s', baseUrl);
      if (app.get('loopback-component-explorer')) {
        let explorerPath = app.get('loopback-component-explorer').mountPath;
        console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
      }
    });
  };

  boot(app, __dirname, function (err) {
    if (err) {
      throw err;
    }
    // start the server if `$ node server.js`
    if (require.main === module) {
      app.start();
    }
  });
})();

