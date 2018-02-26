import {kernel} from 'firmament-bash';

import {Logger, LoggerImpl} from "./util/logging/logger";
import {BootManager, BootManagerImpl} from "./startup/boot-manager";
import {RootServiceImpl} from "./services/root-service";
import {BaseService} from "./services/base-service";
import {StaticServiceImpl} from "./services/static-service";
/*import {ServiceManager} from './services/interfaces/service-manager';
import {ServiceManagerImpl} from './services/implementations/service-manager-impl';
import {InitializeDatabase} from './services/interfaces/initialize-database';
import {InitializeDatabaseImpl} from './services/implementations/initialize-database-impl';
import {RebuildClient} from './services/interfaces/rebuild-client';
import {RebuildClientImpl} from './services/implementations/rebuild-client-impl';
import {PluginManager} from './services/interfaces/plugin-manager';
import {PluginManagerImpl} from './services/implementations/plugin-manager-impl';
import {Authentication} from './services/interfaces/authentication';
import {AuthenticationImpl} from './services/implementations/authentication-impl';
import {StaticService} from './services/interfaces/static-service';
import {StaticServiceImpl} from './services/implementations/static-service-impl';
import {FolderMonitor} from './services/interfaces/folder-monitor';
import {FolderMonitorImpl} from './services/implementations/folder-monitor-impl';
import {LogService} from './services/interfaces/log-service';
import {LogServiceImpl} from './services/implementations/log-service-impl';
import {PostgresHelperImpl} from './util/database-helpers/implementations/postgres-helper-impl';
import {MysqlHelperImpl} from './util/database-helpers/implementations/mysql-helper-impl';
import {BaseDatabaseHelper} from './util/database-helpers/interfaces/base-database-helper';
import {BootManager, BootManagerImpl} from './startup/boot-manager';
import {PostalSocketConnectionImpl} from './util/websockets/postal-socket-connection-impl';
import {WebSocketManager} from './services/interfaces/web-socket-manager';
import {WebSocketManagerImpl} from './services/implementations/web-socket-manager-impl';
import {SocketIoWrapper, SocketIoWrapperImpl} from './util/websockets/socketIoWrapper';
import {FileUpload} from "./services/interfaces/file-upload";
import {FileUploadImpl} from "./services/implementations/file-upload-impl";*/

//Singletons
//Services
/*
kernel.bind<Authentication>('Authentication').to(AuthenticationImpl).inSingletonScope();
kernel.bind<BaseService>('BaseService').to(BaseServiceImpl).inSingletonScope();
kernel.bind<FileUpload>('FileUpload').to(FileUploadImpl).inSingletonScope();
kernel.bind<FolderMonitor>('FolderMonitor').to(FolderMonitorImpl).inSingletonScope();
kernel.bind<InitializeDatabase>('InitializeDatabase').to(InitializeDatabaseImpl).inSingletonScope();
kernel.bind<LogService>('LogService').to(LogServiceImpl).inSingletonScope();
kernel.bind<PluginManager>('PluginManager').to(PluginManagerImpl).inSingletonScope();
kernel.bind<RebuildClient>('RebuildClient').to(RebuildClientImpl).inSingletonScope();
kernel.bind<RootService>('RootService').to(RootServiceImpl).inSingletonScope();
kernel.bind<ServiceManager>('ServiceManager').to(ServiceManagerImpl).inSingletonScope();
kernel.bind<StaticService>('StaticService').to(StaticServiceImpl).inSingletonScope();
kernel.bind<WebSocketManager>('WebSocketManager').to(WebSocketManagerImpl).inSingletonScope();
*/
/*
kernel.bind<BaseService>('BaseService').to(AuthenticationImpl).inSingletonScope();
kernel.bind<BaseService>('BaseService').to(BaseServiceImpl).inSingletonScope();
kernel.bind<BaseService>('BaseService').to(FileUploadImpl).inSingletonScope();
kernel.bind<BaseService>('BaseService').to(FolderMonitorImpl).inSingletonScope();
kernel.bind<BaseService>('BaseService').to(InitializeDatabaseImpl).inSingletonScope();
kernel.bind<BaseService>('BaseService').to(LogServiceImpl).inSingletonScope();
kernel.bind<BaseService>('BaseService').to(PluginManagerImpl).inSingletonScope();
kernel.bind<BaseService>('BaseService').to(RebuildClientImpl).inSingletonScope();
kernel.bind<BaseService>('BaseService').to(RootServiceImpl).inSingletonScope();
kernel.bind<BaseService>('BaseService').to(ServiceManagerImpl).inSingletonScope();
kernel.bind<BaseService>('BaseService').to(StaticServiceImpl).inSingletonScope();
*/
//kernel.bind<BaseService>('BaseService').to(BaseServiceImpl).inSingletonScope();
kernel.bind<BaseService>('BaseService').to(RootServiceImpl).inSingletonScope();
kernel.bind<BaseService>('BaseService').to(StaticServiceImpl).inSingletonScope();

//Non-services
kernel.bind<BootManager>('BootManager').to(BootManagerImpl).inSingletonScope();
/*kernel.bind<BaseDatabaseHelper>('BaseDatabaseHelper').to(PostgresHelperImpl).inSingletonScope();
kernel.bind<BaseDatabaseHelper>('BaseDatabaseHelper').to(MysqlHelperImpl).inSingletonScope();*/
kernel.bind<Logger>('Logger').to(LoggerImpl).inSingletonScope();
//Transients
/*kernel.bind<PostalSocketConnection>('PostalSocketConnection').to(PostalSocketConnectionImpl).inTransientScope();
kernel.bind<SocketIoWrapper>('SocketIoWrapper').to(SocketIoWrapperImpl).inTransientScope();*/
//noinspection JSUnusedGlobalSymbols
export default kernel;
