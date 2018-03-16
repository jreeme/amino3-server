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
      const webToken = createToken(aminoUser, ctx.instance.ttl);
      aminoUser.accessTokenMD5 = (new MD5()).update(webToken).digest('hex');
      ctx.instance.id = createToken(aminoUser, ctx.instance.ttl);
      return cb();
    });
  });
};

function createToken(aminoUser, ttl) {
  try {
    return jwt.sign(aminoUser, 'irJ8EZnmUtliF9dFjL5g', {expiresIn: ttl});
  } catch (err) {
    return 'could not generate JSON web token';
  }
}
