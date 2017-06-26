import kernel from './inversify.config';
import {LogService} from "./services/interfaces/log-service";

(() => {
  const loopback = require('loopback');
  const boot = require('loopback-boot');
  const path = require('path');
  const fs = require('fs');
  const app = module.exports = loopback();
  const log = kernel.get<LogService>('LogService');

  app.start = () => {
    // start the web server
    return app.listen(function () {
      let baseUrl = app.get('url').replace(/\/$/, '');
      if (app.get('loopback-component-explorer')) {
        let explorerPath = app.get('loopback-component-explorer').mountPath;
        log.info(`Browse your REST API at ${baseUrl} ${explorerPath}`);
      }
      log.info(`Web server listening at: ${baseUrl}`);
      app.emit('started');
    });
  };

  log.info(`Booting Amino3 using 'loopback-boot'`);
  boot(app, __dirname, function (err) {
    if (err) {
      throw err;
    }
    // start the server if `$ node server.js`
    if (require.main === module) {
      log.info(`Starting Amino3 by 'node server.js'`);
      app.start();
      return;
    }
    log.info(`Starting Amino3`);
  });
})();

