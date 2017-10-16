import {LoopBackApplication2} from "../../custom-typings";

export interface BaseService {
  servicePostalChannel?: string;
  server: LoopBackApplication2;

  initSubscriptions(cb: (err: Error, result: any) => void): void;

  init(cb: (err: Error, result: any) => void): void;
}
