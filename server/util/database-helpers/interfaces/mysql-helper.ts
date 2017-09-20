import {BaseDatabaseHelper} from "./base-database-helper";
import {IConnectionConfig} from 'mysql';

export interface IConnectionConfig2 extends IConnectionConfig {
  admin_user: string;
  admin_password: string;
}

export interface MysqlHelper extends BaseDatabaseHelper {
}

