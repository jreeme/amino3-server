import {injectable, inject} from 'inversify';
import {InitializeDatabase} from '../interfaces/initialize-database';
import {CommandUtil, IPostal} from 'firmament-yargs';
import {BaseService} from '../interfaces/base-service';
import {LogService} from "../interfaces/log-service";

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

  initSubscriptions(cb: (err: Error, result: any) => void) {
    const me = this;
    const AminoUser = me.server.models.AminoUser;
    AminoUser.find((err) => {
      if (err) {
        const ds = AminoUser.dataSource;
        if (ds.settings.connector === 'postgresql') {
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
  }

  init(cb: (err: Error, result: any) => void) {
    cb(null, {message: 'Initialized InitializeDatabase'});
  }
}
