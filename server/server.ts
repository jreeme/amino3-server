import kernel from './inversify.config';
import {BootManager} from './startup/boot-manager';
import {IPostal} from 'firmament-yargs';

// Attach postal to <global> so loopback javascripts can send messages
(<any>global).postal = kernel.get<IPostal>('IPostal');

const bootManager: BootManager = kernel.get<BootManager>('BootManager');
const loopback = require('loopback');
const loopbackApplication = loopback();
module.exports = loopbackApplication;
bootManager.start(
  loopback,
  loopbackApplication,
  __dirname,
  require.main === module
);

