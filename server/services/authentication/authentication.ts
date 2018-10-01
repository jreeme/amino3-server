import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import async = require('async');
import {BaseServiceImpl} from '../base-service';
import {Logger} from '../../util/logging/logger';
import {Globals} from '../../globals';
import * as _ from 'lodash';

interface AminoRoleMapping {
  id?:any,
  principalType?:string,
  principalId?:string,
  roleId?:number,
  potentialRoleId?:number
}

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

  private updateAminoUserRolesBusy = false;

  constructor(@inject('Logger') private log:Logger,
              @inject('IPostal') private postal:IPostal) {
    super();
  }

  initSubscriptions(cb:(err:Error, result?:any) => void) {
    super.initSubscriptions();
    const me = this;

    //Required to enable LoopBack authentication
    me.app.enableAuth();

    me.postal.subscribe({
      channel: me.servicePostalChannel,
      topic: 'AfterRoleAddRemoveToDatabase',
      callback: me.afterRoleAddRemoveToDatabase.bind(me)
    });
    me.postal.subscribe({
      channel: me.servicePostalChannel,
      topic: 'AfterUserAddRemoveToDatabase',
      callback: me.afterUserAddRemoveToDatabase.bind(me)
    });
    me.postal.subscribe({
      channel: me.servicePostalChannel,
      topic: 'UpdateAminoUser',
      callback: me.updateAminoUserRoles.bind(me)
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
      (cb) => {//Add bogus roles for test
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
    ], (err:Error) => {
      me.updateAllUsersRolesAndPotentialRoles(cb);
    });
  }

  private updateAminoUserRoles(data:{updatedUserInfo:AminoUser, cb:(err:Error) => void}) {
    const me = this;
    const R = me.app.models.AminoRole;
    const RM = me.app.models.AminoRoleMapping;
    const {updatedUserInfo, cb} = data;
    //Assume the roles in updatedUserInfo are "ground truth" and adjust DB to reflect that
    if(me.updateAminoUserRolesBusy) {
      return setImmediate(() => {
        me.updateAminoUserRoles(data);
      });
    }
    me.updateAminoUserRolesBusy = true;
    async.waterfall([
      (cb) => {
        //Start with a clean RoleMapping slate
        RM.destroyAll({principalId: updatedUserInfo.id, principalType: RM.USER}, cb);
      },
      (result:{count:number}, cb) => {
        R.find((err, roles) => {
          cb(err, roles.map((role) => role.toObject()));
        });
      },
      (roles:AminoRole[], cb) => {
        const newRoles = updatedUserInfo.roles || [];
        const newPotentialRoles = _.differenceWith(roles, newRoles, (a, b) => a.id === b.id);

        const potentialRoleMappings:AminoRoleMapping[] = newPotentialRoles.map((role) => ({potentialRoleId: role.id}));
        const roleMappings:AminoRoleMapping[] = newRoles.map((role) => ({roleId: role.id}));

        const allRoleMappings = potentialRoleMappings.concat(roleMappings).map((roleMapping:AminoRoleMapping) => ({
          principalType: RM.USER,
          principalId: updatedUserInfo.id,
          roleId: roleMapping.roleId,
          potentialRoleId: roleMapping.potentialRoleId
        }));
        RM.create(allRoleMappings, cb);
      }
    ], (err:Error) => {
      me.updateAminoUserRolesBusy = false;
      cb(err);
    });
  }

  private afterRoleAddRemoveToDatabase(data:{next:() => void}) {
    const me = this;
    me.updateAllUsersRolesAndPotentialRoles((err:Error) => {
      me.log.logIfError(err);
      data.next();
    });
  }

  private updateAllUsersRolesAndPotentialRoles(cb:(err:Error) => void) {
    const me = this;
    const U = me.app.models.AminoUser;
    //Update roles for all users
    async.waterfall([
      (cb) => {
        U.find({include: 'roles'}, cb);
      },
      (users:any[], cb) => {
        async.each(users, (user, cb) => {
          me.updateAminoUserRoles({updatedUserInfo: user.toObject(), cb});
        }, cb);
      }
    ], (err:Error) => {
      cb(err);
    });
  }

  private afterUserAddRemoveToDatabase(data:{ctx:any, next:() => void}) {
    const me = this;
    const {ctx, next} = data;
    return me.updateAminoUserRoles({updatedUserInfo: ctx.instance.toObject(), cb: next});
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

  private associateUserWithRole(user:{id:any}, role:{id:any}, cb:(err:Error) => void) {
    const me = this;
    const RM = me.app.models.AminoRoleMapping;
    const newRoleMapping = {
      principalType: RM.USER,
      principalId: user.id,
      roleId: role.id
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
        me.associateUserWithRole(user, role, (err:Error) => {
          cb(err);
        });
      }
    ], cb);
  }
}
