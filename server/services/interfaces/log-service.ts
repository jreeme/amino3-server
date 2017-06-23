import {BaseService} from "./base-service";
export interface LogService extends BaseService {
  debug(msg: string);
  info(msg: string);
  notice(msg: string);
  warning(msg: string);
  error(msg: string);
  critical(msg: string);
  alert(msg: string);
  emergency(msg: string);
  logIfError(err: Error):void;
}
