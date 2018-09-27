import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import async = require('async');
import {BaseServiceImpl} from '../base-service';
import {Logger} from '../../util/logging/logger';
import {Globals} from '../../globals';

interface AminoRole {
  id?:any,
  name?:string,
  datasets?:string[]
}

interface AminoUser {
  id?:any,
  username?:string,
  password?:string,
  email?:string,
  firstname?:string,
  lastname?:string,
  phone?:string,
  roles?:AminoRole[],
  potentialRoles?:AminoRole[]
}

@injectable()
export class AuthenticationImpl extends BaseServiceImpl {
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

  constructor(@inject('Logger') private log:Logger,
              @inject('IPostal') private postal:IPostal) {
    super();
  }

  initSubscriptions(cb:(err:Error, result?:any) => void) {
    super.initSubscriptions();
    const me = this;
    const U = me.app.models.AminoUser;
    const RM = me.app.models.AminoRoleMapping;

    //Required to enable LoopBack authentication
    me.app.enableAuth();

    me.postal.subscribe({
      channel: me.servicePostalChannel,
      topic: 'UpdateAminoUser',
      callback: (data:{updatedUserInfo:AminoUser, cb:(err:Error, user:AminoUser) => void}) => {
        const {updatedUserInfo, cb} = data;
        U.findById(updatedUserInfo.id,{include:'roles'},(err,user)=>{
          const e = err;
        });
/*        async.each(updatedUserInfo.roles, (role, cb) => {
          RM.destroyById(role.id, cb);
        }, (err) => {
          RM.findOrCreate({
            principalType: RM.USER,
            principalId: updatedUserInfo.id,
            roleId: updatedUserInfo.roles[0].id
          }, (err, newUser) => {
            cb(err, newUser);
          });
        });*/
      }
    });
    me.postal.subscribe({
      channel: me.servicePostalChannel,
      topic: 'AfterRoleMappingAddRemoveToDatabase',
      callback: me.afterRoleMappingAddRemoveToDatabase.bind(me)
    });
    me.postal.subscribe({
      channel: me.servicePostalChannel,
      topic: 'CreateRootUserAndAdminRole',
      callback: me.createRootUserAndAdminRole.bind(me)
    });
    cb(null, {message: 'Initialized Authentication Subscriptions'});
  }

  init(cb:(err:Error, result:any) => void) {
    const me = this;
    me.postal.publish({
      channel: me.servicePostalChannel,
      topic: 'CreateRootUserAndAdminRole',
      data: {
        cb: (err) => {
          cb(err, {message: 'Initialized Authentication'});
        }
      }
    });
  }

  private createRootUserAndAdminRole(data:{cb:() => void}) {
    const me = this;
    const {cb} = data;
    async.series([
      (cb) => {
        //Blast default user acls, they're too restrictive for our needs. We'll add some better ones below
        Object.keys(me.app.models).forEach((key) => {
          const model = me.app.models[key];
          if(model && model.settings && model.settings.acls) {
            return model.settings.acls.length = 0;
          }
        });
        cb();
      },
      (cb) => {
        async.each(['boneHeads', 'niceGuys', 'wimps', 'gradStudents'], (name, cb) => {
          me.findOrCreateRole({name}, cb);
        }, cb);
      },
      (cb) => {
        //Add 'permanent' users + primaryRole
        async.each(AuthenticationImpl.GlobalAdminUsers, (globalAdminUser, cb) => {
          me.createUserWithRole(globalAdminUser.user, globalAdminUser.primaryRole, cb);
        }, cb);
      },
      (cb) => {
        me.associateUserWithPotentialRole({id: 2}, {id: 4}, false, (err:Error) => {
          me.associateUserWithRole({id: 2}, {id: 2}, false, (err:Error) => {
            cb(err);
          });
        });
      },
      (cb) => {
        //Now deny everyone everything
        return cb();
        const modelsToExclude = ['ACL'];
        const acls = [];
        Object.keys(me.app.models).forEach((model) => {
          if(modelsToExclude.indexOf(model) === -1) {
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
      (cb) => {
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

  private afterRoleMappingAddRemoveToDatabase(data:{ctx:any, next:() => void}) {
    const me = this;
    const {ctx, next} = data;
    const ctxRoleMapping:{principalId:string} = ctx.instance.toObject();
    const R = me.app.models.AminoRole;
    const RM = me.app.models.AminoRoleMapping;
    async.waterfall([
      (cb) => {
        R.find((err, roles) => {
          cb(err, roles.map((role) => role.toObject()));
        });
      },
      (roles, cb) => {
        RM.find({where: {principalId: ctxRoleMapping.principalId}}, (err, roleMappings) => {
          cb(err, roles, roleMappings.map((roleMapping) => roleMapping.toObject()));
        });
      },
      (roles:any[], roleMappings:any[], cb) => {
        async.filter(roles, (role, cb) => {
          const realRoleMapping = roleMappings.filter((roleMapping) => role.id === roleMapping.roleId);
          cb(null, realRoleMapping.length === 0);
        }, (err, potentialRoles) => {
          async.series([(cb) => {
            //Blast all potentialRoles for this user
            RM.destroyAll({where: {principalId: ctxRoleMapping.principalId}}, cb);
          }, (cb) => {
            return cb();
            async.each(potentialRoles, (potentialRole, cb) => {
              RM.findOrCreate({
                principalType: RM.USER,
                principalId: ctxRoleMapping.principalId,
                potentialRoleId: potentialRole.id
              }, cb);
            }, cb);
          }], cb);
        });
      }
    ], next);
  }

  private appendAcls(acls:any[], cb:(err:Error) => void) {
    const me = this;
    const ACL = me.app.models.ACL;
    async.each(acls, ACL.findOrCreate.bind(ACL), cb);
  }

  private findOrCreateRole(role:{name:string}, cb:(err:Error, role:any, created:boolean) => void) {
    const me = this;
    const R = me.app.models.AminoRole;
    R.findOrCreate({where: {name: role.name}}, <any>role,
      ((err:Error, role:any, created:boolean) => {
        cb(err, role, created);
      }));
  }

  private findOrCreateUser(user:{username:string}, cb:(err:Error, user:any, created:boolean) => void) {
    const me = this;
    const U = me.app.models.AminoUser;
    U.findOrCreate({where: {username: user.username}}, <any>user, (error:Error, user:any, created:boolean) => {
      cb(error, user, created);
    });
  }

  private associateUserWithRole(user:{id:any}, role:{id:any}, ignoreDbTriggers:boolean, cb:(err:Error) => void) {
    this.addRoleOrPotentialRoleMapping({user, role}, cb);
  }

  private associateUserWithPotentialRole(user:{id:any}, potentialRole:{id:any}, ignoreDbTriggers:boolean, cb:(err:Error) => void) {
    this.addRoleOrPotentialRoleMapping({user, potentialRole}, cb);
  }

  private addRoleOrPotentialRoleMapping(roleMappingFragment:{
    user:{id:any}, role?:{id:any}, potentialRole?:{id:any}, ignoreDbTriggers?:boolean
  }, cb:(err:Error) => void) {
    const me = this;
    const RM = me.app.models.AminoRoleMapping;
    const newRoleMapping = {
      ignoreDbTriggers: roleMappingFragment.ignoreDbTriggers,
      principalType: RM.USER,
      principalId: roleMappingFragment.user.id,
      roleId: roleMappingFragment.role? roleMappingFragment.role.id: undefined,
      potentialRoleId: roleMappingFragment.potentialRole? roleMappingFragment.potentialRole.id: undefined
    };
    RM.findOrCreate(newRoleMapping, cb);
  }

  private createUserWithRole(user:{username:string}, role:{name:string}, cb:(err:Error) => void) {
    const me = this;
    async.waterfall([
      (cb) => {
        me.findOrCreateUser(user, cb);
      },
      (user, created, cb) => {
        me.findOrCreateRole(role, (err:Error, role:any/*, created: boolean*/) => {
          cb(err, user, role);
        });
      },
      (user, role, cb) => {
        me.associateUserWithRole(user, role, false, (err:Error) => {
          cb(err);
        });
      }
    ], cb);
  }
}
