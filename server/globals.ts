import * as path from 'path';
import * as _ from 'lodash';
import * as boolifyString from 'boolify-string';
import {Logger} from './util/logging/logger';

process.env.LB_LAZYCONNECT_DATASOURCES = '1';

export class Globals {
  static init(app: LoopBackApplication2) {
    const log = (<Logger>(<any>global).logger);
    log.info(`Initializing Globals static class`);
    const amino3Config = app.get('amino3Config');
    //Override Global properties with loopback config values
    const sourceOfGlobalValueMessage: string[] = [];
    Object.keys(Globals).forEach((key) => {
      if (typeof Globals[key] === 'function') {
        return;
      }
      const envVarName = `AMINO3_${_.toUpper(_.snakeCase(key))}`;
      let value: any = Globals[key];
      let valueSource = '[class: Globals]';
      if (amino3Config[key] !== undefined) {
        value = amino3Config[key];
        valueSource = '[amino3Config]';
      }
      if (process.env[envVarName] !== undefined) {
        value = process.env[envVarName];
        valueSource = `[env]:${envVarName}`;
      }

      switch (typeof Globals[key]) {
        case('boolean'):
          //boolifyString also handles non-string values correctly enough
          Globals[key] = boolifyString(value);
          break;
        case('number'):
          Globals[key] = _.toNumber(value);
          break;
        case('string'):
          Globals[key] = _.toString(value);
          break;
        default:
          Globals[key] = value;
          break;
      }

      const logMessageValue = _.toString(Globals[key]);
      sourceOfGlobalValueMessage.push(`Global-->> '${key}' set from ${valueSource} to '${logMessageValue}'`);
    });
    //Order of class init makes this HACK necessary
    log.setCallerFilenamesToIgnore(Globals.loggerCallerFilenamesToIgnore);
    //Now that log callers are set let's log the Global's sources
    sourceOfGlobalValueMessage.forEach((message) => {
      log.debug(message);
    });
  }
  static jwtSecret = 'irJ8EZnmUtliF9dFjL5g';
  static suppressServerHeartbeat: boolean = false;
  static suppressedServices: string[] = [];
  static loggerCallerFilenamesToIgnore: string[] = [];
  static postalPublishToClientTopicSuppressList: string[] = [];

  static node_env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';

  static logToFile: boolean = true;
  static logFileFolder: string = '/tmp';
  //***--> Notice LogLevel Comment
  //I like to start the logLevel at 'debug' to get all the startup log messages before the loopback-boot
  //sequence gets the logLevel from configs (either from the database or loopback config files)
  private static _logLevel = 'debug';// debug, info, notice, warning, error, critical, alert, emergency

  // noinspection JSUnusedGlobalSymbols
  static set logLevel(newLogLevel: string) {
    Globals._logLevel = newLogLevel;
    const log = (<Logger>(<any>global).logger);
    log.critical(`******************************** LogLevel changed to ${Globals.logLevel} ********************************`);
  }

  static get logLevel(): string {
    return Globals._logLevel;
  }

  //***-->

  static noListen = false;
  static noServices = false;
  //static noClientRebuild = false;

  static memoryDataSourceName = 'amino_admin_mem';
  static replaceBadDataSourceWithMemoryDataSource = true;

  static serverChannel = 'server-channel';

  static adminUserName = 'root';
  static adminUserDefaultPassword = 'password';
  static adminUserEmail = 'root@amino3.com';
  static adminRoleName = 'superuser';

  static elasticsearchUserName = 'elasticsearch';
  static elasticsearchUserDefaultPassword = 'password';
  static elasticsearchUserEmail = 'elasticsearch@amino3.com';
  static elasticsearchRoleName = 'elasticsearch';

  static accessTokenTimeToLiveSeconds = 60 * 60;
  static serverWebSocketPath = '/socket.io';

  //Resolve some server side paths
  static projectRootPath = path.resolve(__dirname, '..');
  static serverFolder = path.resolve(Globals.projectRootPath, 'server');
  static loopbackModelRelativePath = 'common/models';
  //static loopbackModelFolder = path.resolve(Globals.projectRootPath, Globals.loopbackModelRelativePath);
  static serverServicesRelativePath = 'server/services';
  static serverServicesFolder = path.resolve(Globals.projectRootPath, Globals.serverServicesRelativePath);
  static clientFolder = path.resolve(Globals.projectRootPath, 'client');
  static inversifyConfigFilePath = path.resolve(Globals.serverFolder, 'inversify.config.ts');
  //File uploader, etc.
  static dataSetFileUploadPath = '/mnt/data';
  /*  static clientDistFolder = path.resolve(Globals.projectRootPath, 'dist/client');
    static uploadedFilesBaseFolder = path.resolve(Globals.serverFolder, 'uploaded-files');
    static fileUploaderPath = path.resolve(Globals.serverFolder, 'util/blueimp-file-upload-expressjs/fileupload');
    static uploadedFilesTmpFolder = path.resolve(Globals.uploadedFilesBaseFolder, 'tmp');
    static uploadedFilesFolder = path.resolve(Globals.uploadedFilesBaseFolder, 'files');*/
  //Plugin uploader, etc.
  /*  static uploadedPluginUrl = '/amino3-plugins/files';
    static pluginUploadFolderToMonitor = path.resolve(Globals.serverFolder, 'amino3-plugins/files');
    static tmpUploaderFolder = path.resolve(Globals.serverFolder, 'amino3-plugins/tmp');
    static extractedPluginFolder = path.resolve(Globals.clientFolder, 'src/app/pages/plugins');
    static pagesRoutingTemplatePath = path.resolve(Globals.clientFolder, 'src/app/pages/pages.routing.template.ts');
    static pagesRoutingPath = path.resolve(Globals.clientFolder, 'src/app/pages/pages.routing.ts');
    static pagesMenuTemplatePath = path.resolve(Globals.clientFolder, 'src/app/pages/pages.menu.template.ts');
    static pagesMenuPath = path.resolve(Globals.clientFolder, 'src/app/pages/pages.menu.ts');*/
  //
  static gitCloneClientExecutionGraph = path.resolve(Globals.serverFolder, 'firmament-bash/git-clone-client.json');
  static npmInstallClientExecutionGraph = path.resolve(Globals.serverFolder, 'firmament-bash/npm-install-client.json');
  static ngBuildClientExecutionGraph = path.resolve(Globals.serverFolder, 'firmament-bash/ng-build-client.json');
  static ngBuildClientProductionExecutionGraph = path.resolve(Globals.serverFolder, 'firmament-bash/ng-build-client-production.json');
  static npmRebuildServerExecutionGraph = path.resolve(Globals.serverFolder, 'firmament-bash/npm-rebuild-server.json');
  //URLs
  /*  static uploadFileUrl = '/uploaded-files/files';
    static uploadFilePostUrl = '/upload-files';*/
  static serverServiceUploadFileUrl = '/server-service-upload-files';
  static elasticsearchUrl = 'http://elasticsearch:9200';
}

