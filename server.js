
/**
 * Module dependencies
 */

var serverUrl = "http://hackathon-kahkhang.c9.io";

var fs = require('fs');
var express = require('express');
var mongoose = require('mongoose');

var app = express();
var server = require('http').Server(app);
var port = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3000;

// Connect to mongodb
var connect = function () {
  var options = { server: { socketOptions: { keepAlive: 1 } } };
  mongoose.connect("mongodb://localhost/hyde", options);
};
connect();

mongoose.connection.on('error', console.log);
mongoose.connection.on('disconnected', connect);

// Bootstrap models
fs.readdirSync(__dirname + '/app/models').forEach(function (file) {
  if (~file.indexOf('.js')) require(__dirname + '/app/models/' + file);
});

// Bootstrap application settings
require('./config/express')(app);

server.listen(port, process.env.OPENSHIFT_NODEJS_IP);
console.log('Express app started on port ' + port);

// Twitter Feed
require('./config/twitterFeed')(server, app, serverUrl);

// Bootstrap routes
require('./config/routes')(app);
