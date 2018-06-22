'use strict';
const jwt = require('jsonwebtoken');
const MD5 = require('md5.js');

module.exports = function (AminoAccessToken) {
  AminoAccessToken.observe('before save', (ctx, cb) => {
    // Invoke custom id function
    ctx.Model.app.models.AminoUser.findById(ctx.instance.userId, (err, aminoUser) => {
      if (err) {
        return cb(err);
      }
      aminoUser = aminoUser.toObject();
      delete aminoUser.password;
      // noinspection JSUnresolvedVariable
      const webToken = createToken(aminoUser, global.accessTokenTimeToLiveSeconds);
      // noinspection JSUnresolvedFunction
      aminoUser.accessTokenMD5 = (new MD5()).update(webToken).digest('hex').substring(6, 14);
      // noinspection JSUnresolvedVariable
      ctx.instance.id = createToken(aminoUser, global.accessTokenTimeToLiveSeconds);
      return cb();
    });
  });
};

function createToken(aminoUser, ttl) {
  try {
    return jwt.sign(aminoUser, global.jwtSecret, {expiresIn: ttl});
  } catch (err) {
    return 'could not generate JSON web token';
  }
}
