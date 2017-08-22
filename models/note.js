const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const Note = new Schema({
  created: {
    type: Date,
    default: Date.now,
  },
  title: {
    type: String,
    default: '',
    trim: true,
    required: "Title can't be blank",
  },
  comment: {
    type: String,
    default: '',
    trim: true,
  },
  creator: {
    type: Schema.ObjectId,
    ref: 'User',
  },
  completed: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('Note', Note);
