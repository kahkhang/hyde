'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TokenSchema = new Schema({
  app: String,
  token: String,
  timeStamp: Date
});

mongoose.model('Token', TokenSchema);