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

kernel.bind<BaseService>('BaseService').to(BaseServiceImpl).inSingletonScope();
kernel.bind<ServiceManager>('ServiceManager').to(ServiceManagerImpl).inSingletonScope();
kernel.bind<InitializeDatabase>('InitializeDatabase').to(InitializeDatabaseImpl).inSingletonScope();
kernel.bind<RebuildClient>('RebuildClient').to(RebuildClientImpl).inSingletonScope();
kernel.bind<PluginManager>('PluginManager').to(PluginManagerImpl).inSingletonScope();

export default kernel;
