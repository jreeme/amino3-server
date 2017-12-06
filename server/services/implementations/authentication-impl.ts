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
      const R = me.server.models.AminoRole;
      R.create({
        "name": "superuser",
        "description": "big, strong user"
      }, (err, result) => {
        const role = result;
        const U = me.server.models.AminoUser;
        U.create([
          {
            "firstname": "John",
            "lastname": "Reeme",
            "username": "jreeme",
            "description": "Remo the magnifico",
            "email": "john@reeme.com",
            "password": "password"
          },
          {
            "firstname": "froot",
            "lastname": "lroot",
            "username": "root",
            "description": "I'm rooting for me!",
            "email": "root@reeme.com",
            "password": "password"
          }
        ], (err, result) => {
          const RM = me.server.models.AminoRoleMapping;
          const user = result[1];
          RM.create({
            "principalType": RM.USER,
            "principalId": user.id,
            "aminoRoleId": role.id
          }, (err, result) => {
            const ACL = me.server.models.ACL;
            ACL.create([
              {
                model: 'AminoUser',
                accessType: '*',
                property: '*',
                principalType: 'ROLE',
                principalId: '$everyone',
                permission: 'DENY'
              },
              {
                model: 'AminoUser',
                accessType: '*',
                property: '*',
                principalType: 'ROLE',
                principalId: 'superuser',
                permission: 'ALLOW'
              },
              {
                model: 'AminoUser',
                accessType: 'EXECUTE',
                property: 'createUser',
                principalType: 'ROLE',
                principalId: 'superuser',
                permission: 'ALLOW'
              },
              {
                model: 'AminoUser',
                accessType: 'EXECUTE',
                property: 'aminoLogin',
                principalType: 'ROLE',
                principalId: '$everyone',
                permission: 'ALLOW'
              }
            ], (err, result) => {
              cb(null);
            });
          });
        });
      });
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
      'AminoRole',
      'AminoRoleMapping',
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
      firstname: Globals.adminUserName,
      lastname: Globals.adminUserName,
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
