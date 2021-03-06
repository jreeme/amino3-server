'use strict';

function addRemoveUser(topic, ctx, next) {
  global.postal.publish({
    channel: 'PostalChannel-Authentication',
    topic,
    data: {
      ctx,
      next
    }
  });
}

module.exports = function (AminoUser) {
  //Observe DB events
  AminoUser.observe('after save', (ctx, next) => {
    addRemoveUser('AfterUserAddToDatabase', ctx, next);
  });
  AminoUser.observe('before delete', (ctx, next) => {
    addRemoveUser('BeforeUserRemoveFromDatabase', ctx, next);
  });
  //updateUser
  AminoUser.updateUser = function (updatedUserInfo, cb) {
    global.postal.publish({
      channel: 'PostalChannel-Authentication',
      topic: 'UpdateAminoUser',
      data: {
        updatedUserInfo,
        cb
      }
    });
  };

  AminoUser.remoteMethod('updateUser', {
      accepts: [
        {
          arg: 'updatedUserInfo',
          type: 'object',
          required: true,
          description: 'JSON object containing updated user info',
          http: {source: 'body'}
        }
      ],
      returns: [
        {
          arg: 'updatedUserInfo',
          type: 'AminoUser',
          root: true,
          description: 'Updated Amino user info'
        }
      ],
      http: {path: '/update-user', verb: 'post'}
    }
  );
  //destroyAll
  AminoUser.aminoDestroyAll = function (cb) {
    AminoUser.destroyAll((err, info) => {
      cb(err, info);
    });
  };

  AminoUser.remoteMethod('aminoDestroyAll', {
      accepts: [],
      returns: [
        {
          arg: 'info',
          type: 'object',
          root: true,
          description: 'DestroyAll info'
        }
      ],
      http: {path: '/aminoDestroyAll', verb: 'post'}
    }
  );

  //aminoDeleteById
  AminoUser.aminoDeleteById = function (deleteUserInfo, cb) {
    AminoUser.deleteById(deleteUserInfo.id,
      (err) => {
        cb(err, deleteUserInfo);
      });
  };

  AminoUser.remoteMethod('aminoDeleteById', {
      accepts: [
        {
          arg: 'deleteUserInfo',
          type: 'AminoUser',
          required: true,
          description: 'Id of aminoUser to delete',
          http: {source: 'body'}
        }
      ],
      returns: [
        {
          arg: 'deletedUserInfo',
          type: 'AminoUser',
          root: true,
          description: 'Deleted Amino user info'
        }
      ],
      http: {path: '/aminoDeleteById', verb: 'post'}
    }
  );

  //createUser
  AminoUser.createUser = function (newUserInfo, cb) {
    AminoUser.create({
      username: newUserInfo.username,
      firstname: newUserInfo.firstname,
      lastname: newUserInfo.lastname,
      email: newUserInfo.email,
      password: newUserInfo.password
    }, (err, newAminoUser) => {
      cb(err, newAminoUser);
    });
  };

  AminoUser.remoteMethod('createUser', {
      accepts: [
        {
          arg: 'newUserInfo',
          type: 'AminoUser',
          required: true,
          description: 'JSON object containing new user info',
          http: {source: 'body'}
        }
      ],
      returns: [
        {
          arg: 'createdUserInfo',
          type: 'AminoUser',
          root: true,
          description: 'Created Amino user info'
        }
      ],
      http: {path: '/create-user', verb: 'post'}
    }
  );

  //deleteAllUsers
  AminoUser.deleteAllUsers = function (cb) {
    AminoUser.destroyAll((err, results) => {
      global.postal.publish({
        channel: 'Authentication',
        topic: 'CreateRootUserAndAdminRole',
        data: {
          cb: () => {
            cb(err, results);
          }
        }
      });
    });
  };

  AminoUser.remoteMethod('deleteAllUsers', {
      accepts: [],
      returns: {
        arg: 'results',
        type: 'object',
        root: true,
        description: 'Results of deleteAllUsers operation'
      },
      http: {path: '/delete-all-users', verb: 'delete'}
    }
  );

  //login
  const baseAminoUserLogin = AminoUser.login.bind(AminoUser);
  AminoUser.login = function (loginInfo, include, cb) {
    loginInfo.ttl = global.accessTokenTimeToLiveSeconds;
    baseAminoUserLogin(loginInfo, include, (err, token) => {
      cb(err, token);
    });
  };

  AminoUser.aminoLogin = function (loginInfo, cb) {
    AminoUser.login(loginInfo, cb);
  };

  AminoUser.remoteMethod('aminoLogin', {
      accepts: [
        {
          arg: 'loginInfo',
          type: 'object',
          required: true,
          description: 'JSON object containing username & password',
          http: {source: 'body'}
        }
      ],
      returns: {
        arg: 'jwt',
        type: 'string',
        root: true,
        description: 'JSON web token'
      },
      http: {path: '/aminoLogin', verb: 'post'}
    }
  );
};

