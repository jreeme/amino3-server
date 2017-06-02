import {kernel} from 'firmament-bash';

import {ServiceManager} from './services/interfaces/service-manager';
import {ServiceManagerImpl} from './services/implementations/service-manager-impl';
import {InitializeDatabase} from './services/interfaces/initialize-database';
import {InitializeDatabaseImpl} from './services/implementations/initialize-database-impl';
import {BaseService} from './services/interfaces/base-service';
import {BaseServiceImpl} from './services/implementations/base-service-impl';
import {RebuildClient} from "./services/interfaces/rebuild-client";
import {RebuildClientImpl} from "./services/implementations/rebuild-client-impl";
import {PluginManager} from "./services/interfaces/plugin-manager";
import {PluginManagerImpl} from "./services/implementations/plugin-manager-impl";
import {Authentication} from "./services/interfaces/authentication";
import {AuthenticationImpl} from "./services/implementations/authentication-impl";
import {StaticService} from "./services/interfaces/static-service";
import {StaticServiceImpl} from "./services/implementations/static-service-impl";
import {RootService} from "./services/interfaces/root-service";
import {RootServiceImpl} from "./services/implementations/root-service-impl";
import {WebSocketService} from "./services/interfaces/web-socket-service";
import {WebSocketServiceImpl} from "./services/implementations/web-socket-service-impl";
import {FolderMonitor} from "./services/interfaces/folder-monitor";
import {FolderMonitorImpl} from "./services/implementations/folder-monitor-impl";

kernel.bind<BaseService>('BaseService').to(BaseServiceImpl).inSingletonScope();
kernel.bind<ServiceManager>('ServiceManager').to(ServiceManagerImpl).inSingletonScope();
kernel.bind<InitializeDatabase>('InitializeDatabase').to(InitializeDatabaseImpl).inSingletonScope();
kernel.bind<RebuildClient>('RebuildClient').to(RebuildClientImpl).inSingletonScope();
kernel.bind<Authentication>('Authentication').to(AuthenticationImpl).inSingletonScope();
kernel.bind<PluginManager>('PluginManager').to(PluginManagerImpl).inSingletonScope();
kernel.bind<StaticService>('StaticService').to(StaticServiceImpl).inSingletonScope();
kernel.bind<RootService>('RootService').to(RootServiceImpl).inSingletonScope();
kernel.bind<WebSocketService>('WebSocketService').to(WebSocketServiceImpl).inSingletonScope();
kernel.bind<FolderMonitor>('FolderMonitor').to(FolderMonitorImpl).inSingletonScope();

export default kernel;
