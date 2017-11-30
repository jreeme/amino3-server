module.exports = function (AminoUser) {
  //createUser
  AminoUser.createUser = function (newUserInfo, cb) {
    AminoUser.create({
      username: newUserInfo.username,
      fullname: `${newUserInfo.firstName} ${newUserInfo.lastName}`,
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
          type: 'object',
          required: true,
          description: 'JSON object containing new user info',
          http: {source: 'body'}
        }
      ],
      returns: [
        {
          arg: 'createdUserInfo',
          type: 'object',
          root: true,
          description: 'Amino user info'
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
          cb: (err2) => {
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
  /**
   * Get access token
   * @param {string} username Amino user name
   * @param {string} password Amino password
   * @param {callback} cb
   */

  //login
  AminoUser.aminoLogin = function (loginInfo, cb) {
    loginInfo.ttl = 60 * 60;//seconds
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

