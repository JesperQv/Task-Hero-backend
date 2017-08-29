const express = require('express');
const Note = require('../../models/note.js');

const router = express.Router();

// Using this for debugging, remove when done
router.get('/list', (req, res, next) => {
  Note.find((err, notes) => {
    if (err) {
      return res.send(err);
    }
    return res.json(notes);
  });
});

router.get('/', (req, res, next) => {
  Note.find((err, notes) => {
    if (err) {
      return res.status(400).send({
        message: 'Unknown server error',
      });
    }
    return res.json(notes);
  }).where({ creator: req.user });
});

router.post('/', (req, res, next) => {
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
