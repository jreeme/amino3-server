import {injectable, inject} from 'inversify';
import {InitializeDatabase} from '../interfaces/initialize-database';
import {CommandUtil, IPostal} from 'firmament-yargs';
import {BaseService} from '../interfaces/base-service';
import {LogService} from "../interfaces/log-service";
import {IConnectionConfig, IConnectionOptions, IMySql} from "mysql";

const async = require('async');

interface PostgresSettings {
  host: string,
  port: number,
  database: string,
  name: string,
  admin_user: string,
  admin_password: string,
  user: string,
  password: string,
  connector: string
}

//noinspection JSUnusedGlobalSymbols
@injectable()
export class InitializeDatabaseImpl implements InitializeDatabase {
//noinspection JSUnusedLocalSymbols
  constructor(@inject('BaseService') private baseService: BaseService,
              @inject('LogService') private log: LogService,
              @inject('IPostal') private postal: IPostal,
              @inject('CommandUtil') private commandUtil: CommandUtil) {
  }

  get server(): any {
    return this.baseService.server;
  }

  private verifyDataSources(cb: (err?: Error) => void) {
    const me = this;
    const dataSources = me.server.dataSources;
    if (!dataSources || typeof dataSources !== 'object') {
      cb();
      return;
    }
    const uniqueDataSources = new Set(Object.keys(dataSources).map((key) => {
      return dataSources[key];
    }));
    async.reject(uniqueDataSources,
      (dataSource, cb) => {
        function test(err: Error) {
          this.removeListener('error', test);
          this.removeListener('connected', test);
          this.error = err;
          cb(null, !err);
        }

        dataSource.once('connected', test);
        dataSource.once('error', test);
      }, (err, dataSourcesBadConnection: any[]) => {
        if (dataSourcesBadConnection.length) {
          //TODO: Fix any DataSource errors here
          cb(null);
        } else {
          cb(null);
        }
      });
  }

  initSubscriptions(cb: (err: Error, result: any) => void) {
    const me = this;
    me.verifyDataSources((err) => {
      if (me.commandUtil.callbackIfError(cb, err)) {
        return;
      }
      const AminoUser = me.server.models.AminoUser;
      const ds = AminoUser.dataSource;
      AminoUser.find((err) => {
        if (err) {
          if (ds.settings.connector === 'mysql') {
            const mysql: IMySql = require('mysql');
            const cnxOptions = <IConnectionConfig> ds.settings;
            const cnx = mysql.createConnection({
              host: cnxOptions.host,
              user: cnxOptions.user,
              password: cnxOptions.password,
              database: cnxOptions.database
            });

            cnx.connect((err)=>{
              let e = err;
            });
          } else if (ds.settings.connector === 'postgresql') {
            try {
              const {Client} = require('pg');
              const ps = <PostgresSettings>ds.settings;
              const clientConfig = {
                host: ps.host,
                port: ps.port,
                user: ps.admin_user,
                password: ps.admin_password,
                database: 'postgres'
              };
              async.series([
                (cb) => {
                  const client = new Client(clientConfig);
                  client.connect((err) => {
                    me.log.logIfError(err);
                    client.query(`create user ${ps.user};`, (err) => {
                      me.log.logIfError(err);
                      client.query(`alter user ${ps.user} password '${ps.password}';`, (err) => {
                        me.log.logIfError(err);
                        client.query(`create database ${ps.database}`, (err) => {
                          me.log.logIfError(err);
                          client.query(`grant all on database ${ps.database} to ${ps.user}`, (err) => {
                            me.log.logIfError(err);
                            client.end((err) => {
                              me.log.logIfError(err);
                              cb();
                            });
                          });
                        });
                      });
                    });
                  });
                },
                (cb) => {
                  clientConfig.database = ps.database;
                  const client = new Client(clientConfig);
                  client.connect((err) => {
                    me.log.logIfError(err);
                    client.query(`grant all on all tables in schema public to ${ps.user};`, (err) => {
                      me.log.logIfError(err);
                      client.end((err) => {
                        me.log.logIfError(err);
                        cb();
                      });
                    });
                  });
                }
              ], (err) => {
                me.log.logIfError(err);
                ds.connect((err) => {
                  me.log.logIfError(err);
                  ds.automigrate((err) => {
                    me.log.logIfError(err);
                    cb(null, {message: 'Initialized InitializeDatabase Subscriptions'});
                  });
                });
              });
            } catch (err) {
              me.log.logIfError(err);
              const message = 'InitializeDatabase FAILED';
              cb(err, {message});
            }
          }
          else {
            const message = 'InitializeDatabase FAILED';
            cb(new Error(message), {message});
          }
          return;
        }
        cb(null, {message: 'Initialized InitializeDatabase Subscriptions'});
      });
    });
  }

  init(cb: (err: Error, result: any) => void) {
    cb(null, {message: 'Initialized InitializeDatabase'});
  }
}
