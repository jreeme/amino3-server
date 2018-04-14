import * as path from 'path';
import * as _ from 'lodash';
import * as boolifyString from 'boolify-string';

//process.env.LB_LAZYCONNECT_DATASOURCES = 1;
export class Globals {
  static init(app: LoopBackApplication2) {
    const amino3Config = app.get('amino3Config');
    //Override Global properties with loopback config values
    Object.keys(Globals).forEach((key) => {
      if (typeof Globals[key] === 'function') {
        return;
      }
      const envVarName = `AMINO3_${_.toUpper(_.snakeCase(key))}`;
      const value: any = process.env[envVarName] || amino3Config[key] || Globals[key];
      switch (typeof Globals[key]) {
        case('boolean'):
          //boolifyString also handles non-string values correctly enough
          return Globals[key] = boolifyString(value);
        case('number'):
          return Globals[key] = _.toNumber(value);
        case('string'):
          return Globals[key] = _.toString(value);
        default:
          return Globals[key] = value;
      }
    });
  }

  static suppressedServices: string[] = [];
  static loggerCallerFilenamesToIgnore: string[] = [];
  static node_env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';
  //I like to start the logLevel at 'debug' to get all the startup log messages before the loopback-boot
  //sequence gets the logLevel from configs (either from the database or loopback config files)
  static logLevel = 'debug';// debug, info, notice, warning, error, critical, alert, emergency
  static noListen = false;
  static noServices = false;
  static noClientRebuild = false;

  static serverChannel = 'server-channel';
  static adminUserName = 'root';
  static adminUserDefaultPassword = 'password';
  static adminUserEmail = 'root@amino3.com';
  static adminRoleName = 'superuser';
  static accessTokenTimeToLiveSeconds = 60 * 60;

  //Resolve some server side paths
  static projectRootPath = path.resolve(__dirname, '..');
  static serverFolder = path.resolve(Globals.projectRootPath, 'server');
  static loopbackModelRelativePath = 'common/models';
  static loopbackModelFolder = path.resolve(Globals.projectRootPath, Globals.loopbackModelRelativePath);
  static serverServicesRelativePath = 'server/services';
  static serverServicesFolder = path.resolve(Globals.projectRootPath, Globals.serverServicesRelativePath);
  static clientFolder = path.resolve(Globals.projectRootPath, 'client');
  static inversifyConfigFilePath = path.resolve(Globals.serverFolder, 'inversify.config.ts');
  static clientDistFolder = path.resolve(Globals.projectRootPath, 'dist/client');
  //File uploader, etc.
  static fileUploaderPath = path.resolve(Globals.serverFolder, 'util/blueimp-file-upload-expressjs/fileupload');
  static uploadedFilesBaseFolder = path.resolve(Globals.serverFolder, 'uploaded-files');
  static uploadedFilesTmpFolder = path.resolve(Globals.uploadedFilesBaseFolder, 'tmp');
  static uploadedFilesFolder = path.resolve(Globals.uploadedFilesBaseFolder, 'files');
  //Plugin uploader, etc.
  static uploadedPluginUrl = '/amino3-plugins/files';
  static pluginUploadFolderToMonitor = path.resolve(Globals.serverFolder, 'amino3-plugins/files');
  static tmpUploaderFolder = path.resolve(Globals.serverFolder, 'amino3-plugins/tmp');
  static extractedPluginFolder = path.resolve(Globals.clientFolder, 'src/app/pages/plugins');
  static pagesRoutingTemplatePath = path.resolve(Globals.clientFolder, 'src/app/pages/pages.routing.template.ts');
  static pagesRoutingPath = path.resolve(Globals.clientFolder, 'src/app/pages/pages.routing.ts');
  static pagesMenuTemplatePath = path.resolve(Globals.clientFolder, 'src/app/pages/pages.menu.template.ts');
  static pagesMenuPath = path.resolve(Globals.clientFolder, 'src/app/pages/pages.menu.ts');
  //
  static gitCloneClientExecutionGraph = path.resolve(Globals.serverFolder, 'firmament-bash/git-clone-client.json');
  static npmInstallClientExecutionGraph = path.resolve(Globals.serverFolder, 'firmament-bash/npm-install-client.json');
  static ngBuildClientExecutionGraph = path.resolve(Globals.serverFolder, 'firmament-bash/ng-build-client.json');
  static npmRebuildServerExecutionGraph = path.resolve(Globals.serverFolder, 'firmament-bash/npm-rebuild-server.json');
  static logFilePath = path.resolve(Globals.projectRootPath, 'logs');
  //URLs
  static uploadFileUrl = '/uploaded-files/files';
  static serverServiceUploadFileUrl = '/server-service-upload-files';
  static uploadFilePostUrl = '/upload-files';
  static remoteLoggingUrl = '/log';
}

