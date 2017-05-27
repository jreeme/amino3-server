export interface BaseService {
  server:any;
  initSubscriptions(cb:(err:Error,result:any)=>void):void;
  init(cb:(err:Error,result:any)=>void):void;
}
