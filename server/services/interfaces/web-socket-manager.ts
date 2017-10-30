import {BaseService} from "./base-service";
import {PostalSocketConnection} from "../../custom-typings";

export interface WebSocketManager extends BaseService {
  removePostalSocketConnection(postalSocketConnection: PostalSocketConnection);
}
