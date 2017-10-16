import kernel from './inversify.config';
import {LogService} from './services/interfaces/log-service';
import {LoopBackApplication2} from "./custom-typings";

(() => {
  const log = kernel.get<LogService>('LogService');
  const app: LoopBackApplication2 = module.exports = require('loopback')();

  app.start = () => {
    // start the web server
    return app.listen(function () {
      let baseUrl = app.get('url').replace(/\/$/, '');
      if (app.get('loopback-component-explorer')) {
        let explorerPath = app.get('loopback-component-explorer').mountPath;
        log.info(`Browse your REST API at ${baseUrl} ${explorerPath}`);
      }
      log.info(`Web server listening at: ${baseUrl}`);
    });
  };

  log.info(`Booting Amino3 using 'loopback-boot'`);
  const boot = require('loopback-boot');
  boot(app, __dirname, function (err: Error) {
    if (err) {
      log.error(`Error booting loopback application: ${err.message}`);
      process.exit(1);
    }
    // start the server if `$ node server.js`
    if (require.main === module) {
      log.info(`Starting Amino3 by 'node server.js'`);
      //app.start() return the http server object (I learned by reading the source)
      //Having the underlying http server object available on the app object is useful
      //for hooking up socket.io later
      app.http = app.start();
      app.emit('started');
      return;
    }
    log.info(`Starting Amino3`);
  });
})();

