const jwt = require('jsonwebtoken');
module.exports = function (aminoUser) {
  /**
   * Get access token
   * @param {string} username Amino user name
   * @param {string} password Amino password
   * @param {Function(Error, string)} callback
   */

  aminoUser.aminoLogin = function (username, password, cb) {
    aminoUser.login({username, password}, (err, loopbackToken) => {
      if (err) {
        return cb(err);
      }
      //Get extended user info (since loopback doesn't send it with this response :( )
      aminoUser.findById(loopbackToken.userId, (err, aminoUser) => {
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

  function createToken(aminoUser) {
    const me = this;
    try {
      return jwt.sign(aminoUser, 'mySecret', {expiresIn: '1d'});
    } catch (err) {
      me.log.logIfError(err);
    }
  }
};

