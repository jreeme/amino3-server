const jwt = require('jsonwebtoken');
module.exports = function (AminoUser) {
  /**
   * Get access token
   * @param {string} username Amino user name
   * @param {string} password Amino password
   * @param {Function(Error, string)} callback
   */

  AminoUser.deleteAllUsers = function (cb) {
    AminoUser.destroyAll(cb);
  };

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

  function createToken(aminoUser) {
    try {
      return jwt.sign(aminoUser, 'mySecret', {expiresIn: '1d'});
    } catch (err) {
      //me.log.logIfError(err);
      return 'could not generate JSON web token';
    }
  }
};

