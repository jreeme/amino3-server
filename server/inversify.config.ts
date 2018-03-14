import {kernel} from 'firmament-bash';

import {Logger, LoggerImpl} from './util/logging/logger';
import {BootManager, BootManagerImpl} from './startup/boot-manager';
import {BaseService} from './services/base-service';
import {StaticServiceImpl} from './services/static-service';
import {AuthenticationImpl} from './services/authentication';
import {FileUploadImpl} from './services/file-upload';
import {FolderMonitorImpl} from './services/folder-monitor';
import {InitializeDatabaseImpl} from './services/initialize-database';
import {PluginManagerImpl} from './services/plugin-manager';
import {RebuildClientImpl} from './services/rebuild-client';
import {PostgresHelperImpl} from './util/database-helpers/implementations/postgres-helper-impl';
import {BaseDatabaseHelper} from './util/database-helpers/interfaces/base-database-helper';
import {MysqlHelperImpl} from './util/database-helpers/implementations/mysql-helper-impl';
import {PostalSocketConnectionImpl} from './util/websockets/postal-socket-connection-impl';
import {SocketIoWrapper, SocketIoWrapperImpl} from './util/websockets/socketIoWrapper';
import {WebSocketManagerImpl} from './services/web-socket-manager';
import {ServiceManager, ServiceManagerImpl} from './util/service-manager';
import {RemoteLoggingImpl} from "./services/remote-logging/remote-logging";

//Singletons
kernel.bind<ServiceManager>('ServiceManager').to(ServiceManagerImpl).inSingletonScope();
//Services
kernel.bind<BaseService>('BaseService').to(StaticServiceImpl).inSingletonScope();
kernel.bind<BaseService>('BaseService').to(AuthenticationImpl).inSingletonScope();
kernel.bind<BaseService>('BaseService').to(FileUploadImpl).inSingletonScope();
kernel.bind<BaseService>('BaseService').to(FolderMonitorImpl).inSingletonScope();
kernel.bind<BaseService>('BaseService').to(InitializeDatabaseImpl).inSingletonScope();
kernel.bind<BaseService>('BaseService').to(PluginManagerImpl).inSingletonScope();
kernel.bind<BaseService>('BaseService').to(RebuildClientImpl).inSingletonScope();
kernel.bind<BaseService>('BaseService').to(WebSocketManagerImpl).inSingletonScope();
kernel.bind<BaseService>('BaseService').to(RemoteLoggingImpl).inSingletonScope();

//Non-services
kernel.bind<BootManager>('BootManager').to(BootManagerImpl).inSingletonScope();
kernel.bind<BaseDatabaseHelper>('BaseDatabaseHelper').to(PostgresHelperImpl).inSingletonScope();
kernel.bind<BaseDatabaseHelper>('BaseDatabaseHelper').to(MysqlHelperImpl).inSingletonScope();
kernel.bind<Logger>('Logger').to(LoggerImpl).inSingletonScope();
//Transients
kernel.bind<PostalSocketConnection>('PostalSocketConnection').to(PostalSocketConnectionImpl).inTransientScope();
kernel.bind<SocketIoWrapper>('SocketIoWrapper').to(SocketIoWrapperImpl).inTransientScope();
//noinspection JSUnusedGlobalSymbols
export default kernel;
