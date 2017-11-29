import kernel from './inversify.config';
import {BootManager} from "./startup/boot-manager";

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

