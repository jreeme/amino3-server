import kernel from './inversify.config';
import {LogService} from './services/interfaces/log-service';

const loopback = require('loopback');
const app = module.exports = loopback();
//-->Begin datasource fixup
/*import {Globals} from './globals';
import path = require('path');

const ConfigLoader = require(path.resolve(Globals.projectRootPath, 'node_modules/loopback-boot/lib/config-loader.js'));
const models = ConfigLoader.loadModels(Globals.serverFolder, Globals.env);
const dataSources = ConfigLoader.loadDataSources(Globals.serverFolder, Globals.env);
try {
  const key = 'mysql';
  const ds = app.dataSource(key, dataSources[key]);
  ds.connector.client.getConnection((a, b, c) => {
    let aa = a;
  });
} catch (err) {
  let e = err;
}*/
//-->End datasource fixup

(() => {
  const boot = require('loopback-boot');
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
  boot(app, __dirname, function (err: Error) {
    if (err) {
      log.error(`Error booting loopback application: ${err.message}`);
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

