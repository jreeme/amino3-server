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
import {PersistedModel} from "loopback-datasource-juggler";

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

let U:any;
let R:any;
let RM:any;

@injectable()
export class AuthenticationImpl extends BaseServiceImpl {
  private timer = Timer.get('AuthenticationImplTimer');
  private roleMappingsToAdd:AminoRoleMapping[] = [];
  private roleMappingsToRemove:AminoRoleMapping[] = [];

  constructor(@inject('Logger') private log:Logger,
              @inject('IPostal') private postal:IPostal) {
    super();
    this.timer.start();
  }

  initSubscriptions(cb:(err:Error, result?:any) => void) {
    super.initSubscriptions();
    const me = this;

    U = this.app.models.AminoUser;
    R = this.app.models.AminoRole;
    RM = this.app.models.AminoRoleMapping;

    //Required to enable LoopBack authentication
    me.app.enableAuth();

    me.postal.subscribe({
      channel: me.servicePostalChannel,
      topic: 'AfterUserAddToDatabase',
      callback: me.afterUserAddToDatabase.bind(me)
    });
    me.postal.subscribe({
      channel: me.servicePostalChannel,
      topic: 'BeforeUserRemoveFromDatabase',
      callback: me.beforeUserRemoveFromDatabase.bind(me)
    });
    me.postal.subscribe({
      channel: me.servicePostalChannel,
      topic: 'AfterRoleAddToDatabase',
      callback: me.afterRoleAddToDatabase.bind(me)
    });
    me.postal.subscribe({
      channel: me.servicePostalChannel,
      topic: 'BeforeRoleRemoveFromDatabase',
      callback: me.beforeRoleRemoveFromDatabase.bind(me)
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
              //return;
              /*              setTimeout(() => {
                              R.destroyAll({name: 'role2'}, (err, result) => {
                                const e = err;
                              });
                            }, 15000);*/
              me.loadTest();
              /*              const users = [
                              {
                                username: 'user1',
                                firstname: 'user1',
                                lastname: 'user1',
                                email: 'user1@user1.com',
                                password: 'password'
                              },
                              {
                                username: 'user2',
                                firstname: 'user2',
                                lastname: 'user2',
                                email: 'user2@user1.com',
                                password: 'password'
                              }
                            ];
                            U.create(users, (err, users) => {
                              const e = err;
                            });*/
            }
          }
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
        //const role = roles.length < 90 ? null : roles.pop();
        //const role = roles.pop();
        AuthenticationImpl.findOrCreateEntities(R, roles, (err, newRoles) => {
          const stopTime = timer.time();
          me.log.info(`Creating roles took ${stopTime - startTime} ms`);
        });
      }, 45);
      setInterval(() => {
        const startTime = timer.time();
        //const user = users.length < 980 ? null : users.pop();
        AuthenticationImpl.findOrCreateEntities(U, users, (err, newUsers) => {
          const stopTime = timer.time();
          me.log.info(`Creating users took ${stopTime - startTime} ms`);
        });
        //const user = users.pop();
        /*        user && me.findOrCreateUser(user, (err, newUser) => {
                  const stopTime = timer.time();
                  //me.log.notice(`Creating user '${newUser.username}' took ${stopTime - startTime} ms`);
                });*/
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
        //Add 'permanent' users
        async.each(Globals.defaultUsers, (globalAdminUser, cb) => {
          async.waterfall([
            (cb:(err:Error, roles:AminoRole[]) => void) => {
              AuthenticationImpl.findOrCreateEntities(R, globalAdminUser.roles, cb);
            },
            (roles, cb:(err:Error, roles:AminoRole[], user:AminoUser) => void) => {
              AuthenticationImpl.findOrCreateEntities(U, [globalAdminUser.user], (err, users) => {
                cb(err, roles, users[0]);
              });
            },
            (roles, user, cb) => {
              AuthenticationImpl.associateUserWithRoles(user, roles, cb);
            }
          ], (err:Error, roleMappings:AminoRoleMapping[]) => {
            cb(err);
          });
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
        //me.appendAcls(acls, cb);
      },
      (cb) => {
        return cb();
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
        //me.appendAcls(acls, cb);
      }
    ], (err:Error) => {
      me.updateAllUsersRolesAndPotentialRoles(cb);
    });
  }

  private processUpdateRoleQueue(cb:(err) => void) {
    const me = this;
    async.parallel([
      (cb) => {
        const roleMappingsToRemove = me.roleMappingsToRemove.splice(0, me.roleMappingsToRemove.length);
        AuthenticationImpl.destroyAllEntities(RM, roleMappingsToRemove, cb);
      },
      (cb) => {
        const roleMappingsToAdd = me.roleMappingsToAdd.splice(0, me.roleMappingsToAdd.length);
        AuthenticationImpl.findOrCreateEntities(RM, roleMappingsToAdd, cb);
      }
    ], cb);
  };

  private updateAminoUserRoles(data:{updatedUserInfo:AminoUser, cb:(err:Error) => void}) {
    const me = this;
    const {updatedUserInfo, cb} = data;
    const startTime = me.timer.time();
    async.waterfall([
      (cb) => {
        async.parallel([
          (cb) => {
            U.findById(updatedUserInfo.id, {include: ['roles', 'potentialRoles']}, (err, user) => {
              user = user.toObject();
              cb(err, {oldRoles: user.roles, oldPotentialRoles: user.potentialRoles});
            });
          },
          (cb) => {
            R.find((err, roles) => {
              cb(err, {allRoles: roles.map((role) => role.toObject())});
            });
          }
        ], (err:Error, results:any) => {
          const {oldRoles, oldPotentialRoles} = results[0];
          const {allRoles} = results[1];
          cb(err, oldRoles, oldPotentialRoles, allRoles);
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
        cb(null, {allRoleMappingsToAdd, allRoleMappingsToRemove});
      }
    ], (err:Error, results:any) => {
      const {allRoleMappingsToAdd, allRoleMappingsToRemove} = results;
      me.roleMappingsToAdd.push(...allRoleMappingsToAdd);
      me.roleMappingsToRemove.push(...allRoleMappingsToRemove);
      me.log.warning(`Calculating RoleMapping updates took ${me.timer.time() - startTime} ms`);
      me.processUpdateRoleQueue(cb);
    });
  }

  private updateAllUsersRolesAndPotentialRoles(cb:(err:Error) => void) {
    const me = this;
    //Update roles for all users
    //me.log.critical(`Request to update all user roles received (not doing it)`);
    //return cb(null);
    async.waterfall([
      (cb) => {
        U.find({include: 'roles'}, cb);
      },
      (users:PersistedModel[], cb) => {
        me.log.warning(`Updating all user roles + potential roles for ${users.length} users`);
        async.each(users, (user, cb) => {
          me.updateAminoUserRoles({updatedUserInfo: user.toObject(), cb});
        }, cb);
      }
    ], (err:Error) => {
      cb(err);
    });
  }

  private beforeRoleRemoveFromDatabase(data:{ctx:{where:any}, next:(err?:Error) => void}) {
    const {ctx, next} = data;
    R.find({where: ctx.where}, (err:Error, roles:AminoRole[]) => {
      RM.beginTransaction({isolationLevel: RM.Transaction.READ_COMMITTED}, (err, transaction) => {
        if(err) {
          return next(err);
        }
        //Remove roleMappings with role ids in roleId or potentialRoleId property
        const destroyedRoleIds = roles.map((role) => role.id);
        RM.destroyAll(
          {
            or: [
              {roleId: {inq: destroyedRoleIds}},
              {potentialRoleId: {inq: destroyedRoleIds}}
            ]
          },
          {
            transaction
          },
          (err/*, results*/) => {
            if(err) {
              return transaction.rollback(() => {
                next(err);
              });
            }
            transaction.commit(() => {
              next();
            });
          });
      });
    });
  }

  private afterRoleAddToDatabase(data:{ctx:any, next:() => void}) {
    const me = this;
    const {next} = data;
    try {
      me.updateAllUsersRolesAndPotentialRoles((err:Error) => {
        me.log.logIfError(err);
        next();
      });
    } catch(err) {
      next();
    }
  }

  private beforeUserRemoveFromDatabase(data:{ctx:{where:any}, next:(err?:Error) => void}) {
    const {ctx, next} = data;
    U.find({where: ctx.where}, (err:Error, users:AminoUser[]) => {
      RM.beginTransaction({isolationLevel: RM.Transaction.READ_COMMITTED}, (err, transaction) => {
        if(err) {
          return next(err);
        }
        //Remove roleMappings with user ids in principalId property
        const destroyedUserIds = users.map((user) => user.id);
        RM.destroyAll(
          {
            principalId: {inq: destroyedUserIds}
          },
          {
            transaction
          },
          (err/*, results*/) => {
            if(err) {
              return transaction.rollback(() => {
                next(err);
              });
            }
            transaction.commit(() => {
              next();
            });
          });
      });
    });
  }

  private afterUserAddToDatabase(data:{ctx:any, next:() => void}) {
    const me = this;
    const {ctx, next} = data;
    const updatedUserInfo = ctx.instance.toObject();
    me.updateAminoUserRoles({updatedUserInfo, cb: next});
  }

  /*  private appendAcls(acls:any[], cb:(err:Error) => void) {
      const me = this;
      const ACL = me.app.models.ACL;
      async.each(acls, ACL.findOrCreate.bind(ACL), cb);
    }*/

  private static associateUserWithRoles(user:AminoUser, roles:AminoRole[], cb:(err:Error, roleMappings:AminoRoleMapping[]) => void) {
    const newRoleMappings = roles.map((role) => ({
      principalType: RM.USER,
      principalId: user.id,
      roleId: role.id
    }));
    AuthenticationImpl.findOrCreateEntities(RM, newRoleMappings, cb);
  }

  private static destroyAllEntities<T>(Model:any, entities:T[], cb:(err:Error, entitiesDestroyed?:T[]) => void) {
    Model.beginTransaction({isolationLevel: RM.Transaction.READ_COMMITTED}, (err, transaction) => {
      if(err) {
        return cb(err);
      }
      async.each(entities, (entity:T, cb:(err:Error) => void) => {
        Model.destroyAll(entity, {transaction}, cb);
      }, (err) => {
        if(err) {
          return transaction.rollback(() => {
            cb(err, []);
          });
        }
        transaction.commit(() => {
          cb(err, entities);
        });
      });
    });
  }

  private static findOrCreateEntities<T>(Model:any, entities:T[], cb:(err:Error, entities?:T[]) => void) {
    Model.beginTransaction({isolationLevel: RM.Transaction.READ_COMMITTED}, (err, transaction) => {
      const entitiesFoundOrCreated:T[] = [];
      if(err) {
        return cb(err);
      }
      async.each(entities, (entity:T, cb:(err:Error) => void) => {
        switch(Model) {
          case(U):
            AuthenticationImpl.findOrCreateUser(entity, {transaction}, (err, entity:T/*, created*/) => {
              entitiesFoundOrCreated.push(entity);
              cb(err);
            });
            break;
          case(R):
            AuthenticationImpl.findOrCreateRole(entity, {transaction}, (err, entity:T/*, created*/) => {
              entitiesFoundOrCreated.push(entity);
              cb(err);
            });
            break;
          case(RM):
            AuthenticationImpl.findOrCreateRoleMapping(entity, {transaction}, (err, entity:T/*, created*/) => {
              entitiesFoundOrCreated.push(entity);
              cb(err);
            });
            break;
        }
      }, (err) => {
        if(err) {
          return transaction.rollback(() => {
            cb(err, []);
          });
        }
        transaction.commit(() => {
          cb(err, entitiesFoundOrCreated);
        });
      });
    });
  }

  private static findOrCreateRole(role:AminoRole, transaction, cb:(err:Error, role:AminoRole, created:boolean) => void) {
    R.findOrCreate({where: {name: role.name}}, role, {transaction}, cb);
  }

  private static findOrCreateUser(user:AminoUser, transaction, cb:(err:Error, user:AminoUser, created:boolean) => void) {
    U.findOrCreate({where: {username: user.username}}, user, {transaction}, cb);
  }

  private static findOrCreateRoleMapping(roleMapping:AminoRoleMapping, transaction, cb:(err:Error, roleMapping:AminoRoleMapping, created:boolean) => void) {
    RM.findOrCreate({where: roleMapping}, roleMapping, {transaction}, cb);
  }
}
