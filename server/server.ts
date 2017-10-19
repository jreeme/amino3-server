import kernel from './inversify.config';
import {BootManager} from "./startup/boot-manager";

const bootManager: BootManager = kernel.get<BootManager>('BootManager');
bootManager.start(
  module.exports = require('loopback')(),
  __dirname,
  require.main === module
);

