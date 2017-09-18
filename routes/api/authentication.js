const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../../models/user.js');
const Client = require('../../models/client.js');

const router = express.Router();

// ------- Helper functions -------
function serializeUser(req, res, next) {
  passport.authenticate('local')(req, res, () => {
    // If logged in, we should have user info to send back
    if (!req.user) {
      return res.send(JSON.stringify({ error: 'There was an error logging in' }));
    }
    return next();
  });
}

function serializeClient(req, res, next) {
  const newClient = new Client({
    user: req.user,
  });

  newClient.save((err) => {
    if (err) {
      Client.findByIdAndUpdate(newClient._id, newClient, (fail, client) => {
        if (fail) {
          return res.status(400).send({
            message: 'error updating client',
          });
        }
        req.user.clientid = client.id;
        return next();
      });
    }
    req.user.clientid = newClient.id;
    return next();
  });
}

// ------- Token functions -------
function generateAccessToken(req, res, next) {
  req.token = req.token || {};
  req.token.accessToken = jwt.sign(req.user, 'server secret', {
    expiresIn: 60 * 60 * 24,
  });
  next();
}

function generateRefreshToken(req, res, next) {
  req.token.refreshToken = `${req.user.clientid.toString()}.${crypto.randomBytes(40).toString('hex')}`;

  Client.update({
    id: req.user.clientid,
    refreshToken: req.token.refreshToken,
  }, next);
}

function validateRefreshToken(req, res, next) {
  Client.find((err, client) => {
    if (err || client.length === 0) {
      return res.status(401).send({
        message: 'Unauthorized',
      });
    }
    return User.findOne((error, user) => {
      if (error || user === undefined) {
        return res.status(401).send({
          message: 'Unauthorized',
        });
      }
      req.user = user;
      return next();
    }).where({ _id: client[0].user });
  }).where({ refreshToken: req.body.refreshToken });
}

// ------- Responses -------
const respond = {
  auth: (req, res) => {
    res.status(200).json({
      user: req.user,
      token: req.token,
    });
  },
  refresh: (req, res) => {
    res.status(201).json({
      user: req.user,
      token: req.token,
    });
  },
  reject: (req, res) => {
    res.status(204).end();
  },
};

// ------- Routes -------
// POST to /register
router.post('/register', (req, res) => {
  // Create a user object to save, using values from incoming JSON
  const newUser = new User({
    username: req.body.username,
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
  });

  // Save, via passport's "register" method, the user
  User.register(newUser, req.body.password, (err, user) => {
    // If there's a problem, send back a JSON object with the error
    if (err) {
      return res.status(409).send(JSON.stringify({ error: err }));
    }
    // Otherwise, for now, send back a JSON object with the new user's info
    return res.send(JSON.stringify(user));
  });
});

// POST to /login
router.post('/login', passport.authenticate(
  'local', {
    session: false,
  }), serializeUser, serializeClient, generateAccessToken, generateRefreshToken, respond.auth);

// POST to /refresh
router.post('/refresh', validateRefreshToken, generateAccessToken, respond.refresh);

router.post('/logout', (req, res) => {
  Client.findOne({ refreshToken: req.body.refreshToken }, (err, client) => {
    if (err) {
      return res.status(404).send({
        message: 'Refreshtoken invalid',
      });
    }
    return client.remove((err2) => {
      if (err2) {
        return res.status(400).send({
          message: 'Error invalidating token',
        });
      }
      return res.status(200).send({
        message: 'OK',
      });
    });
  });
});

module.exports = router;
