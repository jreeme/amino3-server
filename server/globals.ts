import path = require('path');

//this.server.use('/static-influent', require('loopback').static('/home/jreeme/src/amino3-server/static/influent-app-2.0.0'));
export class Globals {
  static logLevel = 'info';// debug, info, notice, warning, error, critical, alert, emergency
  static suppressLoadPlugins = false;
  static suppressClientRebuild = true;
  static projectRootPath = path.resolve(__dirname, '..');
  static clientFolder = path.resolve(Globals.projectRootPath, 'client');
  static serverFolder = path.resolve(Globals.projectRootPath, 'server');
  static clientDistFolder = path.resolve(Globals.projectRootPath, 'dist/client');
  static pluginUploadFolderToMonitor = path.resolve(Globals.serverFolder, 'amino3-plugins/files');
  static tmpUploaderFolder = path.resolve(Globals.serverFolder, 'amino3-plugins/tmp');
  static uploadedPluginUrl = '/amino3-plugins/files';
  static extractedPluginFolder = path.resolve(Globals.clientFolder, 'src/app/pages/plugins');
  static pagesRoutingTemplatePath = path.resolve(Globals.clientFolder, 'src/app/pages/pages.routing.template.ts');
  static pagesRoutingPath = path.resolve(Globals.clientFolder, 'src/app/pages/pages.routing.ts');
  static pagesMenuTemplatePath = path.resolve(Globals.clientFolder, 'src/app/pages/pages.menu.template.ts');
  static pagesMenuPath = path.resolve(Globals.clientFolder, 'src/app/pages/pages.menu.ts');
  static gitCloneClientExecutionGraph = path.resolve(Globals.serverFolder, 'firmament-bash/git-clone-client.json');
  static npmInstallClientExecutionGraph = path.resolve(Globals.serverFolder, 'firmament-bash/npm-install-client.json');
  static ngBuildClientExecutionGraph = path.resolve(Globals.serverFolder, 'firmament-bash/ng-build-client.json');
  static fileUploaderPath = path.resolve(Globals.serverFolder, 'util/blueimp-file-upload-expressjs/fileupload');
  static mosaicSslCertPath = path.resolve(Globals.serverFolder, 'ssl-certs/cert.p12');
  static logFilePath = path.resolve(Globals.projectRootPath, 'logs');
  static influentPath = path.resolve(Globals.projectRootPath, 'static/influent-app-2.0.0');
  static gartnerPath = path.resolve(Globals.projectRootPath, 'static/static-gartner');
  static mosaicPath = path.resolve(Globals.projectRootPath, 'static/static-mosaic');
  static chatterPath = path.resolve(Globals.projectRootPath, 'static/chatter');
  static lodashLibraryPath = path.resolve(Globals.projectRootPath, 'node_modules/lodash/lodash.min.js');
  static postalLibraryPath = path.resolve(Globals.projectRootPath, 'node_modules/postal/lib/postal.min.js');
  static clientSideWebSocketLibraryPath = path.resolve(Globals.serverFolder, 'util/clientSideWebSocket.js');
  static newmanUrl = 'http://localhost:5000';
  static influentUrl = 'http://192.168.56.101:8080';
}
