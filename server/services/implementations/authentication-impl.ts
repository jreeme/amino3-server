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
      me.aminoUser.create(newUser, (err, /*aminoUser*/) => {
        if (err) {
          return res.status(403).send(err);
        }
        me.login(newUser.username, newUser.password, res);
      });
    });

    me.server.post('/auth/login', function (req, res) {
      me.login(req.body.username, req.body.password, res);
    });
    cb(null, {message: 'Initialized Authentication'});
  }

  private login(username: string, password: string, res: any) {
    const me = this;
    me.aminoUser.login({username, password}, (err, loopbackToken) => {
      if (err) {
        return res.status(401).send();
      }
      //Get extended user info (since loopback doesn't send it with this response :( )
      me.aminoUser.findById(loopbackToken.userId, (err, aminoUser) => {
        aminoUser = JSON.parse(JSON.stringify(aminoUser));
        aminoUser.loopbackToken = loopbackToken.id;
        const jwtToken = me.createToken(aminoUser);
        res.header('X-Authorization', jwtToken);
        return res.status(200).send();
      });
    });
  }

  private createToken(user) {
    const me = this;
    try {
      return jwt.sign(user, 'mySecret', {expiresIn: '1d'});
    } catch (err) {
      me.log.logIfError(err);
    }
  }
}
