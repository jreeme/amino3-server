import {injectable, inject} from 'inversify';
import {PostgresHelper, PostgresSettings} from '../interfaces/postgres-helper';
import {Logger} from '../../logging/logger';
import {Client} from 'pg';
import * as async from 'async';

@injectable()
export class PostgresHelperImpl implements PostgresHelper {
  constructor(@inject('Logger') private log: Logger) {
    this.log.info('PostgresHelperImpl created');
  }

  get connectorName(): string {
    return 'postgresql';
  }

  configure(dataSource: any, cb: (err: Error) => void) {
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
        async.series([
          (cb) => {
            client.connect(cb);
          },
          (cb) => {
            client.query(`create user ${ps.user};`, cb);
          },
          (cb) => {
            client.query(`alter user ${ps.user} password '${ps.password}';`, cb);
          },
          (cb) => {
            client.query(`create database ${ps.database}`, cb);
          },
          (cb) => {
            client.query(`grant all on database ${ps.database} to ${ps.user}`, cb);
          },
          (cb) => {
            client.end(cb);
          }
        ], cb);
      },
      (cb) => {
        clientConfig.database = ps.database;
        const client = new Client(clientConfig);
        async.series([
          (cb) => {
            client.connect(cb);
          },
          (cb) => {
            client.query(`grant all on all tables in schema public to ${ps.user};`, cb);
          },
          (cb) => {
            client.end(cb);
          }
        ], cb);
      }
    ], cb);
  }
}
