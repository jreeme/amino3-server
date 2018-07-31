import {kernel} from 'firmament-bash';

import {Logger, LoggerImpl} from './util/logging/logger';
import {BootManager, BootManagerImpl} from './startup/boot-manager';
import {BaseService} from './services/base-service';
import {StaticServiceImpl} from './services/static-service/static-service';
import {AuthenticationImpl} from './services/authentication/authentication';
import {FileUploadImpl} from './services/file-upload/file-upload';
import {FolderMonitorImpl} from './services/folder-monitor/folder-monitor';
import {PluginManagerImpl} from './services/plugin-manager/plugin-manager';
import {RebuildClientImpl} from './services/rebuild-client/rebuild-client';
import {PostgresHelperImpl} from './util/database-helpers/implementations/postgres-helper-impl';
import {BaseDatabaseHelper} from './util/database-helpers/interfaces/base-database-helper';
import {RemoteLoggingImpl} from './services/remote-logging/remote-logging';
import {ElasticsearchImpl} from './services/elasticsearch/elasticsearch';
import {MysqlHelperImpl} from './util/database-helpers/implementations/mysql-helper-impl';
import {PostalSocketConnectionImpl} from './util/websockets/postal-socket-connection-impl';
import {SocketIoWrapper, SocketIoWrapperImpl} from './util/websockets/socketIoWrapper';
import {WebSocketManagerImpl} from './services/web-socket-manager/web-socket-manager';
import {ServiceManager, ServiceManagerImpl} from './startup/service-manager';
import {ServerServicesManagerImpl} from './services/server-services-manager/server-services-manager';
import {BackdoorImpl} from "./services/backdoor/backdoor";

//Singletons
kernel.bind<ServiceManager>('ServiceManager').to(ServiceManagerImpl).inSingletonScope();
//Services
kernel.bind<BaseService>('BaseService').to(StaticServiceImpl).inSingletonScope();
kernel.bind<BaseService>('BaseService').to(AuthenticationImpl).inSingletonScope();
kernel.bind<BaseService>('BaseService').to(FileUploadImpl).inSingletonScope();
kernel.bind<BaseService>('BaseService').to(BackdoorImpl).inSingletonScope();
kernel.bind<BaseService>('BaseService').to(FolderMonitorImpl).inSingletonScope();
kernel.bind<BaseService>('BaseService').to(PluginManagerImpl).inSingletonScope();
kernel.bind<BaseService>('BaseService').to(ElasticsearchImpl).inSingletonScope();
kernel.bind<BaseService>('BaseService').to(RebuildClientImpl).inSingletonScope();
kernel.bind<BaseService>('BaseService').to(WebSocketManagerImpl).inSingletonScope();
kernel.bind<BaseService>('BaseService').to(ServerServicesManagerImpl).inSingletonScope();
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

