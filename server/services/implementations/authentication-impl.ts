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
    //me.dropAllLoopbackSystemTables((err) => {
    me.postal.subscribe({
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
    });
    //});
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
    const R = me.server.models.AminoRole;
    const RM = me.server.models.AminoRoleMapping;
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
      //AminoUser.findOrCreate() does not work. Something to do with base loopback user implementation
      (cb) => {
        U.find({where: {email: Globals.adminUserEmail}}, (err, users) => {//find adminUser
          return cb(err, users.length ? users[0] : null);
        });
      },
      (user, cb) => {
        if (!user) {//create adminUser if not found
          return U.create(newRootUser, cb);
        }
        cb(null, user);
      },
      (user, cb) => {
        R.findOrCreate({name: Globals.adminRoleName}, (err, role/*, created*/) => {
          cb(null, user, role);
        });
      },
      (user, role, cb) => {
        //Create roleMapping to put adminUser in adminRole
        RM.findOrCreate({
          principalType: RM.USER,
          principalId: user.id,
          aminoRoleId: role.id
        }, cb);
      },
      (principal, created, cb) => {
        const adminAcls = [
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
        ];
        async.each(adminAcls, ACL.findOrCreate.bind(ACL), cb);
      }
    ], cb);
  }
}
