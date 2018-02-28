import kernel from './inversify.config';
import {BootManager} from './startup/boot-manager';
import {IPostal} from 'firmament-yargs';
import {Globals} from './globals';

// Attach some things to <global> so loopback javascripts can have access to them
(<any>global).postal = kernel.get<IPostal>('IPostal');
(<any>global).accessTokenTimeToLiveSeconds = Globals.accessTokenTimeToLiveSeconds;

const bootManager: BootManager = kernel.get<BootManager>('BootManager');
const loopback = require('loopback');
const loopbackApplication = loopback();
module.exports = loopbackApplication;
process.env.LB_LAZYCONNECT_DATASOURCES = 1;
bootManager.start(
  loopback,
  loopbackApplication,
  __dirname,
  (require.main === module) && !Globals.noListen
);


