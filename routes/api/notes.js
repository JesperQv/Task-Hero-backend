const express = require('express');
const Note = require('../../models/note.js');

const router = express.Router();

function isAuthenticated(req, res, next) {
  if (req.user === undefined) {
    return res.status(401).send({
      message: 'Unauthorized',
    });
  }
  next();
  return true;
}

// Using this for debugging, remove when done
router.get('/list', isAuthenticated, (req, res, next) => {
  Note.find((err, notes) => {
    if (err) {
      return res.send(err);
    }
    return res.json(notes);
  });
});

router.get('/', isAuthenticated, (req, res, next) => {
  Note.find((err, notes) => {
    if (err) {
      return res.status(400).send({
        message: 'Unknown server error',
      });
    }
    return res.json(notes);
  }).where({ creator: req.user });
});

router.post('/', isAuthenticated, (req, res, next) => {
  const note = new Note(req.body);
  note.creator = req.user;
  note.save((err) => {
    if (err) {
      return res.status(400).send({
        message: 'Unknown server error',
      });
    }
    return res.json(note);
  });
});

module.exports = router;
