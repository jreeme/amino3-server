import {injectable, inject} from 'inversify';
import {LogService} from "../../../services/interfaces/log-service";
import {PostgresHelper, PostgresSettings} from "../interfaces/postgres-helper";

const async = require('async');

@injectable()
export class PostgresHelperImpl implements PostgresHelper {
  constructor(@inject('LogService') private log: LogService) {
    this.log.info('PostgresHelperImpl created');
  }

  get connectorName(): string {
    return 'postgresql';
  }

  configure(dataSource: any, cb: (err: Error) => void) {
    const me = this;
    try {
      const {Client} = require('pg');
      const ps = <PostgresSettings>dataSource.settings;
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
        dataSource.connect((err) => {
          me.log.logIfError(err);
          dataSource.automigrate((err) => {
            me.log.logIfError(err);
            cb(err);
          });
        });
      });
    } catch (err) {
      me.log.logIfError(err);
      cb(err);
    }
  }
}
