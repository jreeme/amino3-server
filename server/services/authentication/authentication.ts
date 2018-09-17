import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import async = require('async');
import {BaseServiceImpl} from '../base-service';
import {Logger} from '../../util/logging/logger';
import {Globals} from '../../globals';

@injectable()
export class AuthenticationImpl extends BaseServiceImpl{
  static GlobalAdminUsers = [
    {
      user: {
        username: Globals.adminUserName,
        firstname: Globals.adminUserName,
        lastname: Globals.adminUserName,
        email: Globals.adminUserEmail,
        password: Globals.adminUserDefaultPassword
      },
      primaryRole: {
        name: Globals.adminRoleName
      }
    },
    {
      user: {
        username: Globals.elasticsearchUserName,
        firstname: Globals.elasticsearchUserName,
        lastname: Globals.elasticsearchUserName,
        email: Globals.elasticsearchUserEmail,
        password: Globals.elasticsearchUserDefaultPassword
      },
      primaryRole: {
        name: Globals.elasticsearchRoleName
      }
    }
  ];

  constructor(@inject('Logger') private log: Logger,
              @inject('IPostal') private postal: IPostal){
    super();
  }

  initSubscriptions(cb: (err: Error, result?: any)=>void){
    super.initSubscriptions();
    const me = this;
    //Required to enable LoopBack authentication
    me.app.enableAuth();
    me.postal.subscribe({
      channel: me.servicePostalChannel,
      topic: 'CreateRootUserAndAdminRole',
      callback: (data)=>{
        me.createRootUserAndAdminRole((err)=>{
          me.log.logIfError(err);
          data.cb(err);
        })
      }
    });
    cb(null, {message: 'Initialized Authentication Subscriptions'});
  }

  init(cb: (err: Error, result: any)=>void){
    const me = this;
    //me.dropAllLoopbackSystemTables((err) => {
    me.postal.publish({
      channel: me.servicePostalChannel,
      topic: 'CreateRootUserAndAdminRole',
      data: {
        cb: (err)=>{
          cb(err, {message: 'Initialized Authentication'});
        }
      }
    });
    //});
  }

  /*  private dropAllLoopbackSystemTables(cb: (err, result?) => void) {
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
    }*/
  private appendAcls(acls: any[], cb: (err: Error)=>void){
    const me = this;
    const ACL = me.app.models.ACL;
    async.each(acls, ACL.findOrCreate.bind(ACL), cb);
  }

  private findOrCreateRole(role: {name: string}, cb: (err: Error, role: any, created: boolean)=>void){
    const me = this;
    const R = me.app.models.AminoRole;
    R.findOrCreate({where: {name: role.name}}, <any>role,
      ((err: Error, role: any, created: boolean)=>{
        cb(err, role, created);
      }));
  }

  private findOrCreateUser(user: {username: string}, cb: (err: Error, user: any, created: boolean)=>void){
    const me = this;
    const U = me.app.models.AminoUser;
    U.findOrCreate({where: {username: user.username}}, <any>user, (error: Error, user: any, created: boolean)=>{
      cb(error, user, created);
    });
  }

  private associateUserWithRole(user: any, role: any, cb: (err: Error)=>void){
    const me = this;
    const RM = me.app.models.AminoRoleMapping;
    RM.findOrCreate({
      principalType: RM.USER,
      principalId: user.id,
      roleId: role.id
    }, cb);
  }

  private createUserWithRole(user: {username: string}, role: {name: string}, cb: (err: Error)=>void){
    const me = this;
    async.waterfall([
      (cb)=>{
        me.findOrCreateUser(user, cb);
      },
      (user, created, cb)=>{
        me.findOrCreateRole(role, (err: Error, role: any/*, created: boolean*/)=>{
          cb(err, user, role);
        });
      },
      (user, role, cb)=>{
        me.associateUserWithRole(user, role, (err: Error)=>{
          cb(err);
        });
      }
    ], cb);
  }

  private createRootUserAndAdminRole(cb: (err: Error, principal?: any)=>void){
    const me = this;
    async.series([
      (cb)=>{
        //Blast default user acls, they're too restrictive for our needs. We'll add some better ones below
        Object.keys(me.app.models).forEach((key)=>{
          const model = me.app.models[key];
          if(model && model.settings && model.settings.acls){
            return model.settings.acls.length = 0;
          }
        });
        cb();
      },
      (cb)=>{
        //Add 'permanent' users + primaryRole
        async.each(AuthenticationImpl.GlobalAdminUsers, (globalAdminUser, cb)=>{
          me.createUserWithRole(globalAdminUser.user, globalAdminUser.primaryRole, cb);
        }, cb);
      },
      (cb)=>{
        //Now deny everyone everything
        return cb();
        const modelsToExclude = ['ACL'];
        const acls = [];
        Object.keys(me.app.models).forEach((model)=>{
          if(modelsToExclude.indexOf(model) === -1){
            acls.push({
              model,
              accessType: '*',
              property: '*',
              principalType: 'ROLE',
              principalId: '$everyone',
              permission: 'DENY'
            });
          }
        });
        me.appendAcls(acls, cb);
      },
      (cb)=>{
        //Now open up a few routes, carefully
        const acls = [
          {
            model: 'Elasticsearch',
            accessType: '*',
            property: '*',
            principalType: 'ROLE',
            principalId: '$everyone',
            permission: 'DENY'
          }
          , {
            model: 'Elasticsearch',
            accessType: '*',
            property: '*',
            principalType: 'ROLE',
            principalId: 'elasticsearch',
            permission: 'ALLOW'
          }
        ];
        me.appendAcls(acls, cb);
      }
    ], cb);
  }
}
