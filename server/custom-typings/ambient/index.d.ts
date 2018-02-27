import {LoopBackApplication} from 'loopback';
import {Server} from 'http';
import {IEnvelope} from "firmament-yargs";

declare global {
  interface UploadedFileInfoOptions {
    uploadDir: string
  }

  interface UploadedFileInfo {
    name: string,
    type: string,
    size: number,
    options: UploadedFileInfoOptions
  }

  interface UploadedFilesInfo {
    files: UploadedFileInfo[]
  }

  interface AminoMessage extends IEnvelope<any> {
  }

  interface PostalSocketConnection {
    id: string;
    init(_socket: any);
    publishToClient(aminoMessage: AminoMessage);
    destroy();
  }

  interface SocketConnectionInfo {
    serverUrl: string,
    clientUrl: string
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

// Type definitions for socket.io 1.4.4
// Project: http://socket.io/
// Definitions by: PROGRE <https://github.com/progre>, Damian Connolly <https://github.com/divillysausages>, Florent Poujol <https://github.com/florentpoujol>, KentarouTakeda <https://github.com/KentarouTakeda>, Alexey Snigirev <https://github.com/gigi>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

///<reference types="node" />

  /*declare module 'socket.io' {
    var server: SocketIOStatic;

    export = server;
  }*/

  interface SocketIOStatic {
    /**
     * Default Server constructor
     */
    (): SocketIO.Server;

    /**
     * Creates a new Server
     * @param srv The HTTP server that we're going to bind to
     * @param opts An optional parameters object
     */
    (srv: any, opts?: SocketIO.ServerOptions): SocketIO.Server;

    /**
     * Creates a new Server
     * @param port A port to bind to, as a number, or a string
     * @param An optional parameters object
     */
    (port: string | number, opts?: SocketIO.ServerOptions): SocketIO.Server;

    /**
     * Creates a new Server
     * @param A parameters object
     */
    (opts: SocketIO.ServerOptions): SocketIO.Server;

    /**
     * Backwards compatibility
     * @see io().listen()
     */
    listen: SocketIOStatic;
  }
}
