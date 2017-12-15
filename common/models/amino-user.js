module.exports = function (AminoUser) {
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
  AminoUser.aminoLogin = function (loginInfo, cb) {
    loginInfo.ttl = global.accessTokenTimeToLiveSeconds;
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
      http: {path: '/login', verb: 'post'}
    }
  );
};

