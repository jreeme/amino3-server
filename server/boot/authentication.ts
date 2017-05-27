module.exports = function enableAuthentication(server) {
  let _ = require('lodash');
  let jwt = require('jsonwebtoken');

  // enable (loopback) authentication
  server.enableAuth();

  let AminoUser = server.models.AminoUser;

  function createToken(user) {
    try {
      return jwt.sign(_.omit(user, 'password'), 'mySecret', {expiresIn: '1 days'});
    } catch (e) {
      console.log(e);
    }
  }

  server.post('/auth/update-user-info', function (req, res) {
    let userInfo = req.body;
    AminoUser.findById(userInfo.id, (err, aminoUser) => {
      if (err) {
        return res.status(200).send({status: 'error', error: err});
      }
      delete userInfo.id;
      aminoUser.updateAttributes(userInfo, (err, aminoUser) => {
        if (err) {
          return res.status(200).send({status: 'error', error: err});
        }
        return res.status(200).send({status: 'OK', userInfo: aminoUser});
      });
    });
  });

  server.post('/auth/register', function (req, res) {
    let newUser = req.body;
    delete newUser.id;
    AminoUser.create(newUser, (err, models) => {
      if (err) {
        return res.status(200).send({status: 'error', error: err});
      }
      return res.status(200).send({status: 'OK', newUser: JSON.parse(models.json)});
    });
  });

  server.post('/auth/login', function (req, res) {
    let username = req.body.username;
    let password = req.body.password;
    if (!username || !password) {
      return res.status(200).send({status: 'error', error: {message: 'Please provide username and password'}});
    }

    AminoUser.login({username, password}, (err, loopbackToken) => {
      if (err) {
        return res.status(200).send({status: 'error', error: err});
      }
      //Get extended user info (since loopback doesn't send it with this response :( )
      AminoUser.findById(loopbackToken.userId, (err, aminoUser) => {
        delete aminoUser.password;
        return res.status(201).send({
          status: 'OK',
          userInfo: aminoUser,
          jwtToken: createToken({username: aminoUser.username}),
          loopbackToken
        });
      });
    });
  });
};
