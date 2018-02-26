import {injectable, inject} from 'inversify';
import {IConnectionConfig2, MysqlHelper} from '../interfaces/mysql-helper';
import {IMySql, IConnection} from 'mysql';
import {CommandUtil} from "firmament-yargs";
import {Logger} from "../../logging/logger";

//const async = require('async');
const mysql: IMySql = require('mysql');

@injectable()
export class MysqlHelperImpl implements MysqlHelper {
  constructor(@inject('Logger') private log: Logger,
              @inject('CommandUtil') private commandUtil: CommandUtil) {
    this.log.info('MysqlHelperImpl created');
  }

  get connectorName(): string {
    return 'mysql';
  }

  configure(dataSource: any, cb: (err?: Error) => void) {
    const me = this;
    const cnxOptions = <IConnectionConfig2> dataSource.settings;
    let cnx = MysqlHelperImpl.createConnection(cnxOptions, false, true);

    cnx.connect((err) => {
      if (err) {
        if (err.code === 'ER_ACCESS_DENIED_ERROR') {
          cnx.destroy();
          cnx = MysqlHelperImpl.createConnection(cnxOptions, true);
          cnx.connect((err) => {
            if (me.commandUtil.callbackIfError(cb, err)) {
              return;
            }
            MysqlHelperImpl.createUser(cnx, cnxOptions.user, cnxOptions.password, (err) => {
              cnx.destroy();
              if (me.commandUtil.callbackIfError(cb, err)) {
                return;
              }
              me.configure(dataSource, cb);
            });
          });
        } else if (err.code === 'ER_DBACCESS_DENIED_ERROR') {
          cnx.destroy();
          cnx = MysqlHelperImpl.createConnection(cnxOptions, true);
          me.createDatabase(cnx, cnxOptions.database, cnxOptions.user, (err) => {
            cnx.destroy();
            if (me.commandUtil.callbackIfError(cb, err)) {
              return;
            }
            me.configure(dataSource, cb);
          });
        } else {
          cb(err);
        }
        return;
      }
      cnx.destroy();
      dataSource.connect((err)=>{
        if (me.commandUtil.callbackIfError(cb, err)) {
          return;
        }
        dataSource.automigrate((err)=>{
          cb(err);
        });
      });
    });
  }

  private createDatabase(cnx: IConnection, database: string, user: string, cb: (err: Error) => void) {
    const me = this;
    const sql = `create database ${database};`;
    cnx.query(sql, (err) => {
      if (me.commandUtil.callbackIfError(cb, err)) {
        return;
      }
      const sql = `grant all on ${database}.* to '${user}';`;
      cnx.query(sql, cb);
    });
  }

  private static createUser(cnx: IConnection, user: string, password: string, cb: (err: Error) => void) {
    const sql = `create user '${user}' identified by '${password}' password expire never;`;
    cnx.query(sql, cb);
  }

  private static createConnection(cnxOptions: IConnectionConfig2, asRoot: boolean = false, connectToDb: boolean = false): IConnection {
    return mysql.createConnection({
      host: cnxOptions.host,
      port: cnxOptions.port,
      user: asRoot ? cnxOptions.admin_user : cnxOptions.user,
      password: asRoot ? cnxOptions.admin_password : cnxOptions.password,
      database: connectToDb ? cnxOptions.database : null
    });
  }
}
