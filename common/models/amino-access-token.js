'use strict';
const jwt = require('jsonwebtoken');

module.exports = function (AminoAccessToken) {
  AminoAccessToken.observe('before save', (ctx, cb) => {
    // Invoke custom id function
    ctx.Model.app.models.AminoUser.findById(ctx.instance.userId, (err, aminoUser) => {
      if (err) {
        return cb(err);
      }
      ctx.instance.id = createToken(aminoUser);
      cb();
    });
  });
};

function createToken(aminoUser) {
  try {
    const ttl = global.accessTokenTimeToLiveSeconds;
    return jwt.sign(aminoUser, 'mySecret', {expiresIn: ttl});
  } catch (err) {
    return 'could not generate JSON web token';
  }
}
