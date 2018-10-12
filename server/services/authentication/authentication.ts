import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import async = require('async');
import {BaseServiceImpl} from '../base-service';
import {Logger} from '../../util/logging/logger';
import {Globals} from '../../globals';
import * as _ from 'lodash';
import * as path from 'path';
import * as jsonfile from 'jsonfile';
import * as Timer from 'timer-machine';

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
          if(Globals.node_env === 'development') {
            if(Globals.testAuthenticationServer) {
              me.loadTest();
            }
          }
          setInterval(() => {
            me.processUpdateRoleQueue();
          }, 3000);
        }
      }
    });
  }

  private loadTest() {
    const me = this;
    async.parallel([
      (cb) => {
        jsonfile.readFile(path.resolve(Globals.projectRootPath, 'mock-data/mock-users.json'), cb);
      },
      (cb) => {
        jsonfile.readFile(path.resolve(Globals.projectRootPath, 'mock-data/mock-roles.json'), cb);
      }
    ], (err, results) => {
      const users = <AminoRole[]>results[0];
      let roles = <AminoUser[]>results[1];
      const timer = Timer.get('loadTest');
      timer.start();
      setInterval(() => {
        const startTime = timer.time();
        //const role = roles.length < 90? null: roles.pop();
        const role = roles.pop();
        role && me.findOrCreateRole(role, (err, newRole) => {
          const stopTime = timer.time();
          me.log.info(`Creating role '${newRole.name}' took ${stopTime - startTime} ms`);
        });
      }, 45);
      setInterval(() => {
        const startTime = timer.time();
        //const user = users.length < 990? null: users.pop();
        const user = users.pop();
        user && me.findOrCreateUser(user, (err, newUser) => {
          const stopTime = timer.time();
          me.log.notice(`Creating user '${newUser.username}' took ${stopTime - startTime} ms`);
        });
      }, 50);
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

  private usersToUpdateRolesFor = {};
  private processing = false;

  private processUpdateRoleQueue() {
    const me = this;
    if(me.processing) {
      return;
    }
    const keys = Object.keys(me.usersToUpdateRolesFor);
    if(keys.length) {
      me.processing = true;
      const key = keys[0];
      me.log.warning(`Updating roles for user '${key}'`);
      const updatedUserInfo = me.usersToUpdateRolesFor[key];
      delete me.usersToUpdateRolesFor[key];
      me.updateAminoUserRolesWorker({
        updatedUserInfo, cb: (err) => {
          if(err) {
            me.log.error(err.message);
          } else {
            me.log.info(`Successfully updated roles for user '${key}'`);
          }
          me.processing = false;
        }
      });
    }
  };

  private updateAminoUserRoles(data:{updatedUserInfo:AminoUser, cb:(err:Error) => void}) {
    const me = this;
    const {updatedUserInfo, cb} = data;
    me.usersToUpdateRolesFor[updatedUserInfo.username] = updatedUserInfo;
    const keys = Object.keys(me.usersToUpdateRolesFor);
    me.log.warning(`Queuing ${updatedUserInfo.username} for role update. Queue is ${keys.length} long.`);
    cb(null);
  }

  private updateAminoUserRolesWorker(data:{updatedUserInfo:AminoUser, cb:(err:Error) => void}) {
    const me = this;
    const U = me.app.models.AminoUser;
    const R = me.app.models.AminoRole;
    const RM = me.app.models.AminoRoleMapping;
    const {updatedUserInfo, cb} = data;

    const timer = Timer.get('updateAminoUserRoles');
    timer.start();
    //Assume the roles in updatedUserInfo are "ground truth" and adjust DB to reflect that
    const startTime = timer.time();
    async.waterfall([
      (cb) => {
        U.findById(updatedUserInfo.id, {include: ['roles', 'potentialRoles']}, (err, user) => {
          user = user.toObject();
          cb(err, user.roles, user.potentialRoles);
        });
      },
      (oldRoles:any, oldPotentialRoles:any, cb) => {
        R.find((err, roles) => {
          cb(err, oldRoles, oldPotentialRoles, roles.map((role) => role.toObject()));
        });
      },
      (oldRoles:AminoRole[], oldPotentialRoles:AminoRole[], allRoles:AminoRole[], cb) => {
        const newRoles = updatedUserInfo.roles || [];

        const rolesToRemove = _.differenceWith(oldRoles, newRoles, (a, b) => a.id === b.id);
        const rolesToAdd = _.differenceWith(newRoles, oldRoles, (a, b) => a.id === b.id);

        const newPotentialRoles = _.differenceWith(allRoles, newRoles, (a, b) => a.id === b.id);

        const potentialRolesToRemove = _.differenceWith(oldPotentialRoles, newPotentialRoles, (a, b) => a.id === b.id);
        const potentialRolesToAdd = _.differenceWith(newPotentialRoles, oldPotentialRoles, (a, b) => a.id === b.id);

        const roleMappingsToAdd:AminoRoleMapping[] = rolesToAdd.map((role) => ({roleId: role.id}));
        const roleMappingsToRemove:AminoRoleMapping[] = rolesToRemove.map((role) => ({roleId: role.id}));
        const potentialRoleMappingsToAdd:AminoRoleMapping[] = potentialRolesToAdd.map((role) => ({potentialRoleId: role.id}));
        const potentialRoleMappingsToRemove:AminoRoleMapping[] = potentialRolesToRemove.map((role) => ({potentialRoleId: role.id}));

        function createRoleMapping(roleMapping:AminoRoleMapping) {
          return {
            principalType: RM.USER,
            principalId: updatedUserInfo.id,
            roleId: roleMapping.roleId,
            potentialRoleId: roleMapping.potentialRoleId
          };
        }

        const allRoleMappingsToAdd = potentialRoleMappingsToAdd.concat(roleMappingsToAdd).map(createRoleMapping);
        const allRoleMappingsToRemove = potentialRoleMappingsToRemove.concat(roleMappingsToRemove).map(createRoleMapping);

        async.parallel([
          (cb) => {
            async.each(allRoleMappingsToRemove, (roleMapping, cb) => {
              RM.destroyAll(roleMapping, cb);
            }, cb);
          },
          (cb) => {
            async.each(allRoleMappingsToAdd, (roleMapping, cb) => {
              RM.findOrCreate(roleMapping, cb);
            }, cb);
          }
        ], cb);
      }
    ], (err:Error) => {
      const stopTime = timer.time();
      me.log.notice(`Updating RoleMappings took ${stopTime - startTime} ms`);
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
    me.log.critical(`Request to update all user roles received (not doing it)`);
    return cb(null);
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

  private findOrCreateRole(role:AminoRole, cb:(err:Error, role:any, created:boolean) => void) {
    const me = this;
    const R = me.app.models.AminoRole;
    R.findOrCreate({where: {name: role.name}}, <any>role,
      ((err:Error, role:any, created:boolean) => {
        cb(err, role, created);
      }));
  }

  private findOrCreateUser(user:AminoUser, cb:(err:Error, user:any, created:boolean) => void) {
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
