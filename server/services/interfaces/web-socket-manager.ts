import {BaseService} from "./base-service";

export interface WebSocketManager extends BaseService {
  removePostalSocketConnection(postalSocketConnection: PostalSocketConnection);
}
