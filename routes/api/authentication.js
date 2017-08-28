const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../../models/user.js');

const router = express.Router();

function generateToken(req, res, next) {
  console.log('inside generate token');
  req.token = jwt.sign({
    id: req.user.username,
  }, 'server secret', {
    expiresIn: 60 * 60 * 24,
  });
  next();
}

function respond(req, res) {
  res.status(200).send(JSON.stringify({
    user: req.user,
    token: req.token,
  }));
}

function serialize(req, res, next) {
  passport.authenticate('local')(req, res, () => {
    // If logged in, we should have user info to send back
    if (!req.user) {
      return res.send(JSON.stringify({ error: 'There was an error logging in' }));
    }
    console.log('user found');
    return next();
  });
}

// POST to /register
router.post('/register', (req, res) => {
  // Create a user object to save, using values from incoming JSON
  const newUser = new User({
    username: req.body.username,
    firstname: req.body.firstname,
    lastname: req.body.lastName,
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
  }), serialize, generateToken, respond);

// GET to /logout
router.get('/logout', (req, res) => {
  req.logout();
  return res.send(JSON.stringify(req.user));
});

module.exports = router;
