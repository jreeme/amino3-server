import {LoopBackApplication} from 'loopback';
import {Server} from 'http';

interface WebSocketConn {
  sendText(text: string);

  close();
}

interface WatcherConfig {
  ignoreInitial: string;
}

interface FileWatcherConfig {
  folderMonitorPath: string;
  watcherConfig: WatcherConfig;
}

interface FileWatcherPayload {
  fullPath: string;
  size: string;
  createDate: string;
}

//Plugin related interfaces, make sure any changes here are reflected in client custom-typings.ts
//Someday I'll make a module
interface PluginRoutes {
  path: string;
}

interface PluginMenuRoutes extends PluginRoutes {
  loadChildren: string;
}

interface PluginToolRouteChild extends PluginRoutes {
  data: { menu: { title: string } };
}

interface PluginToolRoutes extends PluginRoutes {
  children: PluginToolRouteChild[];
}

interface PluginManifest {
  pluginId: string;
  pluginName: string;
  pluginDescription: string;
  menuRoutes: PluginMenuRoutes[];
  toolRoutes: PluginToolRoutes[];
}

interface LoopBackApplication2 extends LoopBackApplication {
  on: (eventName: string, cb: () => void) => void;
  start: () => Server;
  http: Server;
  models: any;
  dataSources: any;
  emit: (eventName: string, data?: any) => void;
}

