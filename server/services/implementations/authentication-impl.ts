import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseService} from '../interfaces/base-service';
import {Authentication} from '../interfaces/authentication';
import {LogService} from '../interfaces/log-service';
import {LoopBackApplication2} from '../../custom-typings';
import {Globals} from '../../globals';
import async = require('async');

//noinspection JSUnusedGlobalSymbols
@injectable()
export class AuthenticationImpl implements Authentication {
  //noinspection JSUnusedLocalSymbols
  constructor(@inject('BaseService') private baseService: BaseService,
              @inject('LogService') private log: LogService,
              @inject('IPostal') private postal: IPostal) {
  }

  get servicePostalChannel(): string {
    return 'Authentication';
  }

  get server(): LoopBackApplication2 {
    return this.baseService.server;
  }

  initSubscriptions(cb: (err: Error, result?: any) => void) {
    const me = this;
    //Required to enable LoopBack authentication
    me.server.enableAuth();
    this.dropAllLoopbackSystemTables((err) => {
      cb(null);
/*      me.postal.subscribe({
        channel: me.servicePostalChannel,
        topic: 'CreateRootUserAndAdminRole',
        callback: (data) => {
          me.createRootUserAndAdminRole((err) => {
            me.log.logIfError(err);
            data.cb(null, {message: 'Initialized Authentication Subscriptions'});
          })
        }
      });
      me.postal.publish({
        channel: me.servicePostalChannel,
        topic: 'CreateRootUserAndAdminRole',
        data: {cb}
      });*/
    });
  }

  init(cb: (err: Error, result: any) => void) {
    cb(null, {message: 'Initialized Authentication'});
  }

  private dropAllLoopbackSystemTables(cb: (err, result?) => void) {
    const me = this;
    const loopbackSystemTables = [
      'ACL',
      'AminoAccessToken',
      'AminoUser',
      'Role',
      'RoleMapping',
      'DataSet'
    ];
    async.each(loopbackSystemTables, (loopbackSystemTable, cb) => {
      const model = me.server.models[loopbackSystemTable];
      model.settings.acls = [];
      model.destroyAll((err, results) => {
        cb(err);
      });
    }, (err) => {
      cb(err);
    });
  }

  private createRootUserAndAdminRole(cb: (err: Error, principal?: any) => void) {
    const me = this;
    const R = me.server.models.Role;
    const RM = me.server.models.RoleMapping;
    const U = me.server.models.AminoUser;
    const ACL = me.server.models.ACL;
    const newRootUser = {
      username: Globals.adminUserName,
      fullname: Globals.adminUserName,
      email: Globals.adminUserEmail,
      password: Globals.adminUserDefaultPassword
    };
    async.waterfall([
      (cb) => {
        U.find({where: {email: Globals.adminUserEmail}}, (err, users) => {
          return cb(err, users.length ? users[0] : null);
        });
      },
      (user, cb) => {
        if (!user) {
          return U.create(newRootUser, cb);
        }
        cb(null, user);
      },
      (user, cb) => {
        R.find({where: {name: Globals.adminRoleName}}, (err, roles) => {
          return cb(err, user, roles.length ? roles[0] : null);
        });
      },
      (user, role, cb) => {
        if (!role) {
          return R.create({name: Globals.adminRoleName}, (err, role) => {
            cb(null, user, role);
          });
        }
        cb(null, user, role);
      },
      (user, role, cb) => {
        // Add admin user to admin role
        role.principals.create({
          principalType: RM.USER,
          principalId: user.id
        }, cb);
      },
      (principal, cb) => {
      return cb(null);
        /*        ACL.create([
                  {
                    accessType: '*',
                    principalType: 'ROLE',
                    principalId: '$everyone',
                    permission: 'DENY'
                  },
                  {
                    accessType: 'EXECUTE',
                    principalType: 'ROLE',
                    principalId: '$everyone',
                    permission: 'ALLOW',
                    property: 'aminoLogin'
                  },
                  {
                    accessType: 'EXECUTE',
                    principalType: 'ROLE',
                    principalId: 'superuser',
                    permission: 'ALLOW',
                    property: 'createUser'
                  },
                  {
                    accessType: '*',
                    principalType: 'ROLE',
                    principalId: 'superuser',
                    permission: 'ALLOW',
                    property: '*'
                  }
                ], (err, acls) => {
                  U.settings.acls = [];
                  acls.forEach((acl) => {
                    U.settings.acls.push(acl);
                  });
                  cb(err);
                });*/
      }
    ], (err, /*acl*/) => {
      cb(err);
    });
  }
}
