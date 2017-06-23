import {injectable, inject} from 'inversify';
import {IPostal} from 'firmament-yargs';
import {BaseService} from '../interfaces/base-service';
import path = require('path');
import fs = require('fs');
import async = require('async');
import _ = require('lodash');
import jwt = require('jsonwebtoken');
import {Authentication} from "../interfaces/authentication";
import {LogService} from "../interfaces/log-service";

//noinspection JSUnusedGlobalSymbols
@injectable()
export class AuthenticationImpl implements Authentication {
  private aminoUser;

  //noinspection JSUnusedLocalSymbols
  constructor(@inject('BaseService') private baseService: BaseService,
              @inject('LogService') private log: LogService,
              @inject('IPostal') private postal: IPostal) {
    //this.server.on('started', () => { });
  }

  get server(): any {
    return this.baseService.server;
  }

  initSubscriptions(cb: (err: Error, result: any) => void) {
    cb(null, {message: 'Initialized Authentication Subscriptions'});
  }

  init(cb: (err: Error, result: any) => void) {
    const me = this;
    me.aminoUser = me.server.models.AminoUser;
    // enable (loopback) authentication
    me.server.enableAuth();
    me.server.post('/auth/update-user-info', function (req, res) {
      let userInfo = req.body;
      me.aminoUser.findById(userInfo.id, (err, aminoUser) => {
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

    me.server.post('/auth/register', function (req, res) {
      let newUser = req.body;
      delete newUser.id;
      me.aminoUser.create(newUser, (err, models) => {
        if (err) {
          return res.status(200).send({status: 'error', error: err});
        }
        return res.status(200).send({status: 'OK', newUser: JSON.parse(models.json)});
      });
    });

    me.server.post('/auth/login', function (req, res) {
      let username = req.body.username;
      let password = req.body.password;
      if (!username || !password) {
        return res.status(200).send({status: 'error', error: {message: 'Please provide username and password'}});
      }

      me.aminoUser.login({username, password}, (err, loopbackToken) => {
        if (err) {
          return res.status(200).send({status: 'error', error: err});
        }
        //Get extended user info (since loopback doesn't send it with this response :( )
        me.aminoUser.findById(loopbackToken.userId, (err, aminoUser) => {
          delete aminoUser.password;
          return res.status(201).send({
            status: 'OK',
            userInfo: aminoUser,
            jwtToken: me.createToken({username: aminoUser.username}),
            loopbackToken
          });
        });
      });
    });
    cb(null, {message: 'Initialized Authentication'});
  }

  private createToken(user) {
    const me = this;
    try {
      return jwt.sign(_.omit(user, 'password'), 'mySecret', {expiresIn: '1 days'});
    } catch (err) {
      me.log.logIfError(err);
    }
  }
}
