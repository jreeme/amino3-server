import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import async = require('async');
import {BaseServiceImpl} from '../base-service';
import {Logger} from '../../util/logging/logger';
import {Globals} from '../../globals';

@injectable()
export class AuthenticationImpl extends BaseServiceImpl {
  constructor(@inject('Logger') private log: Logger,
              @inject('IPostal') private postal: IPostal) {
    super();
  }

  initSubscriptions(cb: (err: Error, result?: any) => void) {
    super.initSubscriptions();
    const me = this;
    //Required to enable LoopBack authentication
    me.app.enableAuth();
    me.postal.subscribe({
      channel: me.servicePostalChannel,
      topic: 'CreateRootUserAndAdminRole',
      callback: (data) => {
        me.createRootUserAndAdminRole((err) => {
          me.log.logIfError(err);
          data.cb(err);
        })
      }
    });
    cb(null, {message: 'Initialized Authentication Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    const me = this;
    //me.dropAllLoopbackSystemTables((err) => {
    me.postal.publish({
      channel: me.servicePostalChannel,
      topic: 'CreateRootUserAndAdminRole',
      data: {
        cb: (err) => {
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

  private createRootUserAndAdminRole(cb: (err: Error, principal?: any) => void) {
    const me = this;
    const R = me.app.models.Role;
    const RM = me.app.models.RoleMapping;
    const U = me.app.models.AminoUser;
    const ACL = me.app.models.ACL;
    //Blast default user acls, they're too restrictive for our needs. We'll add some better ones below
    Object.keys(me.app.models).forEach((key) => {
      if (me.app.models[key] && me.app.models[key].settings && me.app.models[key].settings.acls) {
        return me.app.models[key].settings.acls.length = 0;
      }
    });
    async.parallel([
      (cb) => {
        const newRootUser = {
          username: Globals.adminUserName,
          firstname: Globals.adminUserName,
          lastname: Globals.adminUserName,
          email: Globals.adminUserEmail,
          password: Globals.adminUserDefaultPassword
        };
        const newRootRole = {
          name: Globals.adminRoleName
        };
        async.waterfall([
          (cb) => {
            U.findOrCreate({where: {username: newRootUser.username}}, <any>newRootUser, cb);
          },
          (user, created, cb) => {
            R.findOrCreate({where: {name: newRootRole.name}}, <any>newRootRole,
              <any>((err: Error, role: any/*, created: boolean*/) => {
                cb(null, user, role);
              }));
          },
          (user, role, cb) => {
            RM.findOrCreate({
              principalType: RM.USER,
              principalId: user.id,
              roleId: role.id
            }, cb);
          },
          (principal, created, cb) => {
            const adminAcls = [
              /*          {
                          model: 'AminoUser',
                          accessType: '*',
                          property: '*',
                          principalType: 'ROLE',
                          principalId: '$everyone',
                          permission: 'DENY'
                        }
                        , {
                          model: 'AminoUser',
                          accessType: '*',
                          property: '*',
                          principalType: 'ROLE',
                          principalId: 'superuser',
                          permission: 'ALLOW'
                        }
                        ,{
                          model: 'AminoUser',
                          accessType: 'EXECUTE',
                          property: 'createUser',
                          principalType: 'ROLE',
                          principalId: 'superuser',
                          permission: 'ALLOW'
                        }
                        , {
                          model: 'AminoUser',
                          accessType: 'EXECUTE',
                          property: 'aminoLogin',
                          principalType: 'ROLE',
                          principalId: '$everyone',
                          permission: 'ALLOW'
                        }*/
            ];
            async.each(adminAcls, ACL.findOrCreate.bind(ACL), cb);
          }
        ], cb);
      },
      (cb) => {
        const newElasticsearchUser = {
          username: Globals.elasticsearchUserName,
          firstname: Globals.elasticsearchUserName,
          lastname: Globals.elasticsearchUserName,
          email: Globals.elasticsearchUserEmail,
          password: Globals.elasticsearchUserDefaultPassword
        };
        const newElasticsearchRole = {
          name: Globals.elasticsearchRoleName
        };
        async.waterfall([
          (cb) => {
            U.findOrCreate({where: {username: newElasticsearchUser.username}}, <any>newElasticsearchUser, cb);
          },
          (user, created, cb) => {
            R.findOrCreate({where: {name: newElasticsearchRole.name}}, <any>newElasticsearchRole,
              <any>((err: Error, role: any/*, created: boolean*/) => {
                cb(null, user, role);
              }));
          },
          (user, role, cb) => {
            RM.findOrCreate({
              principalType: RM.USER,
              principalId: user.id,
              roleId: role.id
            }, cb);
          },
          (principal, created, cb) => {
            const elasticsearchAcls = [
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
            async.each(elasticsearchAcls, ACL.findOrCreate.bind(ACL), cb);
          }
        ], cb);
      }
    ], cb);
  }
}
