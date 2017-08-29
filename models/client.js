const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const Client = new Schema({
  refreshToken: String,
  user: {
    type: Schema.ObjectId,
    ref: 'User',
  },
});

Client.plugin(passportLocalMongoose);

module.exports = mongoose.model('Client', Client);
