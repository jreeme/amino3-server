const jwt = require('jsonwebtoken');
module.exports = function (AminoUser) {
  //createUser
  AminoUser.createUser = function (username, firstName, lastName, email, password, cb) {
    AminoUser.create({
      username,
      fullname: `${firstName} ${lastName}`,
      email,
      password
    }, (err, newAminoUser) => {
      cb(err, newAminoUser);
    });
  };

  AminoUser.remoteMethod('createUser', {
      accepts: [
        {
          arg: 'username',
          type: 'string',
          required: true,
          description: 'Amino user name'
        },
        {
          arg: 'firstName',
          type: 'string',
          required: true,
          description: 'Amino user first name'
        },
        {
          arg: 'lastName',
          type: 'string',
          required: true,
          description: 'Amino user last name'
        },
        {
          arg: 'email',
          type: 'string',
          required: true,
          description: 'Amino user email'
        },
        {
          arg: 'password',
          type: 'string',
          required: true,
          description: 'Amino password'
        }
      ],
      returns: [
        {
          arg: 'username',
          type: 'string',
          root: true,
          description: 'Amino user name'
        },
        {
          arg: 'email',
          type: 'string',
          root: true,
          description: 'Amino user email'
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
  AminoUser.aminoLogin = function (username, password, cb) {
    AminoUser.login({username, password}, (err, loopbackToken) => {
      if (err) {
        return cb(err);
      }
      //Get extended user info (since loopback doesn't send it with this response :( )
      AminoUser.findById(loopbackToken.userId, (err, aminoUser) => {
        if (err) {
          return cb(err);
        }
        aminoUser = JSON.parse(JSON.stringify(aminoUser));
        aminoUser.loopbackToken = loopbackToken.id;
        const jwtToken = createToken(aminoUser);
        cb(null, jwtToken);
      });
    });
  };

  AminoUser.remoteMethod('deleteAllUsers', {
      accepts: [
        {
          arg: 'username',
          type: 'string',
          required: true,
          description: 'Amino user name'
        },
        {
          arg: 'password',
          type: 'string',
          required: true,
          description: 'Amino password'
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

  function createToken(aminoUser) {
    try {
      return jwt.sign(aminoUser, 'mySecret', {expiresIn: '1d'});
    } catch (err) {
      //me.log.logIfError(err);
      return 'could not generate JSON web token';
    }
  }
};

