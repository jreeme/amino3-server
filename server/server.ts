import kernel from './inversify.config';
import {BootManager} from './startup/boot-manager';
import {IPostal} from 'firmament-yargs';
import {Globals} from './globals';
import {Logger} from './util/logging/logger';

let logger: Logger;

//Install UncaughtException handler
process.on('uncaughtException', err => {
  const uncaughtExceptionMessage = `UncaughtException [HALT]: ${err}`;
  logger
    ? logger.critical(uncaughtExceptionMessage)
    : console.error(uncaughtExceptionMessage);
  //No way to recover from uncaughtException, bail out now
  process.exit(1);
});

try {
  // Attach some things to <global> so loopback javascripts can have access to them
  logger = (<any>global).logger = kernel.get<Logger>('Logger');
  (<any>global).postal = kernel.get<IPostal>('IPostal');
  (<any>global).accessTokenTimeToLiveSeconds = Globals.accessTokenTimeToLiveSeconds;

  const bootManager: BootManager = kernel.get<BootManager>('BootManager');
  const loopback = require('loopback');
  const loopbackApplication = loopback();
  module.exports = loopbackApplication;
  logger.notice('Starting LoopBack bootManager >>>');
  bootManager.start(
    loopback,
    loopbackApplication,
    __dirname,
    (require.main === module)
  );
} catch (err) {
  logger
    ? logger.error(err.message)
    : console.error(err.message);
  throw err;//Rethrow to exit process (will be caught by 'uncaughtException' event handler above)
} finally {
  const finallyMessage = '** Pre-Loopback Server Startup Complete **';
  logger
    ? logger.notice(finallyMessage)
    : console.log(finallyMessage);
}
