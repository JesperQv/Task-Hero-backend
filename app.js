const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const LocalStrategy = require('passport-local').Strategy;
const expressSession = require('express-session')({
  secret: 'any random string can go here',
  resave: false,
  saveUninitialized: false,
});
const User = require('./models/user');
const Note = require('./models/note');

const index = require('./routes/index');
const api = require('./routes/api/index');
const users = require('./routes/api/users');
const notes = require('./routes/api/notes');
const authentication = require('./routes/api/authentication');

const app = express();

// Connect to Mongoose
mongoose.connect('mongodb://localhost/notely');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(expressSession);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

function checkTokenValidation(req, res, next) {
  // check header or url parameters or post parameters for token
  const token = req.body.token || req.param('token') || req.headers['x-access-token'];

  // decode token
  if (token) {
    // verifies secret and checks exp
    jwt.verify(token, 'server secret', (err, decoded) => {
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });
      }
      // if everything is good, save to request for use in other routes
      req.user = decoded._doc;
      return next();
    });
  } else {
    // if there is no token
    // return an error
    return res.status(403).send({
      success: false,
      message: 'No token provided.',
    });
  }
}

app.use('/', index);
app.use('/api', api);
app.use('/api/users', checkTokenValidation, users);
app.use('/api/notes', checkTokenValidation, notes);
app.use('/api/authentication', authentication);

// Configure Passport
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
