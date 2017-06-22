import path = require('path');

export class Globals {
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
}
