import kernel from './inversify.config';
import {BootManager} from "./startup/boot-manager";
import {IPostal} from "firmament-yargs";

//Bit of a hack to let LoopBack (in general) participate in
(<any>global).postal = kernel.get<IPostal>('IPostal');
const bootManager: BootManager = kernel.get<BootManager>('BootManager');
bootManager.start(
  module.exports = require('loopback')(),
  __dirname,
  require.main === module
);

