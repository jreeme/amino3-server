interface WebSocketConn {
  sendText(text: string),
  close()
}
interface WatcherConfig {
  ignoreInitial: string
}
interface FileWatcherConfig {
  folderMonitorPath: string,
  watcherConfig: WatcherConfig
}

interface FileWatcherPayload {
  fullPath: string,
  size: string,
  createDate: string
}
