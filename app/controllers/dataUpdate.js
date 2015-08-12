/*!
 * Module dependencies.
 */
var mongoose = require('mongoose');
var tokenGetter = require('../tokenGetter');
var request = require('request');
var geojson = require('geojson');
var svy21 = require('../svy21');
var HydeFeature = mongoose.model('HydeFeature');
var Layer = mongoose.model('Layer');
var Tweet = mongoose.model('Tweet');
var Insta = mongoose.model('Insta');
var moment = require('moment-timezone');

geojson.defaults = {Point: ['lat', 'lon']};


/*
* No query parameters
*/
exports.storeLayers = function(req, res){
  request("http://www.onemap.sg/API/services.svc/layerinfo", function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var obj = JSON.parse(body.replace(/\n/g, ' ').replace(/ +/g, ' '));
      if(obj && obj.LayerInfo && obj.LayerInfo.length){
          obj.LayerInfo.forEach(function(layerObj){
            var layer = new Layer(layerObj);
            layer.save(function (err) {
              if(err) console.log("error: " + err);
            });
          });
          return res.sendStatus(200);
      }
    }
    return res.sendStatus(404);
  });
}