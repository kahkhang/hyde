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
var Geolocation = mongoose.model('Geolocation');
var moment = require('moment-timezone');
var _ = require('underscore');
var geocoder = require('geocoder');
var async = require('async');
var cheerio = require('cheerio');
var constants = require('constants');
_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g
};
geojson.defaults = {
  Point: ['lat', 'lon']
};

var customLayers = {};

function getCollection( /*Model, query, sort, callback*/ ) {
  var Model = arguments[0],
    query = {},
    sort = {},
    callback = arguments[arguments.length - 1],
    arr = [];
  if (arguments.length == 3) query = arguments[1];
  if (arguments.length == 2) sort = arguments[2];

  Model.find(query || {}, {
    '_id': 0,
    "__v": 0
  }, sort || {}, function(err, docs) {
    if (err) {
      return callback([]);
    }
    docs.forEach(function(doc) {
      arr.push(doc);
    });
    return callback(arr);
  });
}

function storeCollection(Model, arr, callback, resolveErr) {
  callback = callback || function() {};
  resolveErr = resolveErr || function() {};
  var models = [];
  var cnt = 0;
  arr.forEach(function(item) {
    var model = new Model(item);
    model.save(function(err) {
      cnt++;
      if (err) {
        resolveErr(model);
      }
      else models.push(model);
      if (cnt == arr.length) callback(models);
    });
  })
}

function storeFeatureCollection(featurecollection, callback) {
  async.each(featurecollection.features,  function(feature, itCallback) {
    HydeFeature.findOneAndUpdate({
      'properties.LAYERNAME': feature.properties.LAYERNAME,
      'properties.X': feature.properties.X,
      'properties.Y': feature.properties.Y
    }, feature, {
      upsert: true
    }, function(err, rows) {
      itCallback();
    });
  }, function(err){
    callback();
  });
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

function reverseGeocode(lat, lon, callback) {
  lat = Number(lat);
  lon = Number(lon);
  var newCallback = function(address) {
    if (address) {
      Geolocation.create({
        lat: lat,
        lon: lon,
        address: address
      }, function(err, doc) {
        callback(address);
      });
    }
    else callback('');
  }
  Geolocation.findOne({
    lat: lat,
    lon: lon
  }, function(err, geolocation) {
    if (err) return callback('');
    if (geolocation) {
      return callback(geolocation.address);
    }
    else {
      tokenGetter.getOneMapToken("OneMap", function(token) {
        if (token) {
          var url = "http://www.onemap.sg/API/services.svc/revgeocode?token=" + token + "&location=" + Number(lon) + "," + Number(lat);
          request(url, function(error, response, body) {
            if (!error && response.statusCode == 200) {
              var geocodedData = JSON.parse(body);
              if (geocodedData.GeocodeInfo && geocodedData.GeocodeInfo[0] && !geocodedData.GeocodeInfo[0].ErrorMessage) {
                var arr = [],
                  BLOCK, BUILDINGNAME, ROAD, POSTALCODE;

                if (geocodedData.GeocodeInfo[0].BLOCK) BLOCK = geocodedData.GeocodeInfo[0].BLOCK;
                if (geocodedData.GeocodeInfo[0].BUILDINGNAME) {
                  BUILDINGNAME = geocodedData.GeocodeInfo[0].BUILDINGNAME;
                  if (/^HDB-/.test(BUILDINGNAME)) {
                    BLOCK = "Blk " + BLOCK;
                    BUILDINGNAME = BUILDINGNAME.slice(4);
                  }
                  BUILDINGNAME = toTitleCase(BUILDINGNAME);
                }
                if (geocodedData.GeocodeInfo[0].ROAD) ROAD = toTitleCase(geocodedData.GeocodeInfo[0].ROAD);
                if (geocodedData.GeocodeInfo[0].POSTALCODE) POSTALCODE = "Singapore " + geocodedData.GeocodeInfo[0].POSTALCODE;

                if (BLOCK) arr.push(BLOCK);
                //if(BUILDINGNAME) arr.push(BUILDINGNAME);
                if (ROAD) arr.push(ROAD);
                if (POSTALCODE) arr.push(POSTALCODE);
                return newCallback(arr.join(", "));

              }
              else {
                //console.log(Number(tweet.coordinates.coordinates[1]));
                //console.log(Number(tweet.coordinates.coordinates[0]));
                geocoder.reverseGeocode(Number(lat), Number(lon), function(err, data) {
                  // do something with data
                  //console.log(err);
                  if (data && data.results[0] && data.results[0].formatted_address)
                    return newCallback(data.results[0].formatted_address);
                  return newCallback('');
                });
              }
            }
          });
        }
        else return newCallback('');
      });
    }
  })


}

exports.revGeocode = function(req, res) {
  reverseGeocode(req.params.lat, req.params.lon, function(address) {
    res.json({
      address: address
    });
  })
}

exports.getLayers = function(req, res) {
  getCollection(Layer, function(arr) {
    return res.json(arr);
  })
}

exports.getSMRTinstas = function(req, res) {
  var arr = [];
  Insta.find({
    $text: {
      $search: "smrt train breakdown mrt thingsididwhenmrtwasdown #thingsididwhenmrtwasdown"
    }
  }, {
    '_id': 0,
    "__v": 0
  }, {
    sort: {
      created: 1
    }
  }, function(err, docs) {
    if (err) {
      return;
    }
    docs.forEach(function(doc) {
      arr.push(doc);
    });
    return res.json(arr);
  });
}

exports.getSMRTtweets = function(req, res) {
  var arr = [];
  Tweet.find({
    $text: {
      $search: "smrt train breakdown mrt thingsididwhenmrtwasdown #thingsididwhenmrtwasdown"
    }
  }, {
    '_id': 0,
    "__v": 0
  }, {
    sort: {
      created: 1
    }
  }, function(err, docs) {
    if (err) {
      return;
    }
    docs.forEach(function(doc) {
      arr.push(doc);
    });
    return res.json(arr);
  });
}

function addDetails(xkey, ykey, layername, arr, isWGS84, resultCallback) {
  return async.each(arr, function(item, callback) {
    if(isWGS84){
      var lon = item[xkey];
      var lat = item[ykey];
      delete item[xkey];
      delete item[ykey];
      item.lon = lon;
      item.lat = lat;
      var NE = svy21.computeSVY21({lon: lon, lat: lat});
      item.X = NE.E;
      item.Y = NE.N;
      item.XY = item.XY || (item.X + "," + item.Y);
    }
    else{
      item.XY = item.XY || (item[xkey] + "," + item[ykey]);
      var X = item[xkey];
      var Y = item[ykey];
      delete item[xkey];
      delete item[ykey];
      item.Y = Number(Y);
      item.X = Number(X);
      var latlon = svy21.computeLatLon({
        N: item.Y,
        E: item.X
      });
      item.lon = latlon.lon;
      item.lat = latlon.lat;
    }
    item.id = layername + item.XY;
    item.LAYERNAME = layername;
    item.lastUpdated = new Date();
    item.updated_human = moment(item.lastUpdated).tz('Asia/Singapore').format('D MMM YYYY [at] hh:mm:ss a');
    reverseGeocode(item.lat, item.lon, function(address) {
      if (address) item.address = address;
      callback('');
    });
  }, function(err) {
    resultCallback(arr);
  });
}

function storeArr(/*xkey, ykey, layername, arr, isWGS84, resultCallback*/) {
  var xkey = arguments[0], ykey = arguments[1], layername = arguments[2], arr = arguments[3], isWGS84, resultCallback;
  if(typeof arguments[4] == "boolean"){
    isWGS84 = arguments[4];
    resultCallback = arguments[5];
  }
  else{
    isWGS84 = false;
    resultCallback = arguments[4];
  }
  resultCallback = resultCallback || function() {};

  addDetails(xkey, ykey, layername, arr, isWGS84, function(results) {
    var featurecollection = geojson.parse(results);
    storeFeatureCollection(featurecollection, resultCallback);
  }, isWGS84);
}

function getJSON( /*urlTemplate, params, tokenType, callback*/ ) {
  var callback = arguments[arguments.length - 1],
    urlTemplate = arguments[0] || '',
    params = arguments[1] || {},
    tokenType = arguments[2] || '';

  if (tokenType) {
    tokenGetter.getOneMapToken(tokenType, function(token) {
      if (!token) return callback(null);
      params.token = token;
      request(_.template(urlTemplate)(params), function(error, response, body) {
        if (!error && response.statusCode == 200) {
          try {
            var obj = JSON.parse(body);
            callback(obj);
          }
          catch (e) {
            return callback(null);
          }
        }
        else return callback(null);
      });
    });
  }
  else {
    request(_.template(urlTemplate)(params), function(error, response, body) {
      if (!error && response.statusCode == 200) {
        try {
          var obj = JSON.parse(body);
          callback(obj);
        }
        catch (e) {
          return callback(null);
        }
      }
      else return callback(null);
    });
  }
}

function fullUrl(base, fullpath, url){
  if(/^http/.test(url)) return url;
  else if(/^\/[^\/]*/.test(url)) return base + url;
  else return fullpath + "/" + url;
}
customLayers["POLYCLINICS"] = {
  save: function(callback) {
    callback = callback || function(){};
    var polyclinics = [
      {
        "name": "Ang Mo Kio Polyclinic",
        "group": "NHG",
        "X": 29542.868995892,
        "Y": 39368.895564131,
        "link": "https://www.nhgp.com.sg/smile.aspx?loc=amk",
        "scrapingUrl": "https://smile.nhgp.com.sg/StatPage.aspx?location=amk"
      },
      {
        "name": "Bedok Polyclinic",
        "group": "SINGHEALTH",
        "X": 38942.1873,
        "Y": 34241.5191,
        "link": "http://polyclinic.singhealth.com.sg/QueueWatch/SHP-Bedok/Pages/home.aspx",
        "scrapingUrl": "http://polyclinic.singhealth.com.sg/QWatch/QimgPageNew.aspx?Loc_Code=BDP"
      },
      {
        "name": "Bukit Batok Polyclinic",
        "group": "NHG",
        "X": 18485.2223,
        "Y": 37124.6524,
        "link": "https://www.nhgp.com.sg/smile.aspx?loc=bbk",
        "scrapingUrl": "https://smile.nhgp.com.sg/StatPage.aspx?location=bbk"
      },
      {
        "name": "Bukit Merah Polyclinic",
        "group": "SINGHEALTH",
        "X": 26183.0323,
        "Y": 29569.7363,
        "link": "http://polyclinic.singhealth.com.sg/QueueWatch/SHP-BukitMerah/Pages/home.aspx",
        "scrapingUrl": "http://polyclinic.singhealth.com.sg/QWatch/QimgPageNew.aspx?Loc_Code=BMP"
      },
      {
        "name": "Choa Chu Kang Polyclinic",
        "group": "NHG",
        "X": 18814.1520,
        "Y": 40477.9633,
        "link": "https://www.nhgp.com.sg/smile.aspx?loc=cck",
        "scrapingUrl": "https://smile.nhgp.com.sg/StatPage.aspx?location=cck"
      },
      {
        "name": "Clementi Polyclinic",
        "group": "NHG",
        "X": 20449.8492,
        "Y": 32753.3202,
        "link": "https://www.nhgp.com.sg/smile.aspx?loc=clm",
        "scrapingUrl": "https://smile.nhgp.com.sg/StatPage.aspx?location=clm"
      },
      {
        "name": "Geylang Polyclinic",
        "group": "SINGHEALTH",
        "X": 33992.6941,
        "Y": 33528.4865,
        "link": "http://polyclinic.singhealth.com.sg/QueueWatch/SHP-Geylang/Pages/home.aspx",
        "scrapingUrl": "http://polyclinic.singhealth.com.sg/QWatch/QimgPageNew.aspx?Loc_Code=GLP"
      },
      {
        "name": "Hougang Polyclinic",
        "group": "NHG",
        "X": 34196.6313,
        "Y": 39102.8987,
        "link": "https://www.nhgp.com.sg/smile.aspx?loc=hou",
        "scrapingUrl": "https://smile.nhgp.com.sg/StatPage.aspx?location=hou"
      },
      {
        "name": "Jurong Polyclinic",
        "group": "NHG",
        "X": 16581.6822,
        "Y": 36870.9144,
        "link": "https://www.nhgp.com.sg/smile.aspx?loc=jur",
        "scrapingUrl": "https://smile.nhgp.com.sg/StatPage.aspx?location=jur"
      },
      {
        "name": "Marine Parade Polyclinic",
        "group": "SINGHEALTH",
        "X": 36282.2972,
        "Y": 31647.4864,
        "link": "http://polyclinic.singhealth.com.sg/QueueWatch/SHP-MarineParade/Pages/home.aspx",
        "scrapingUrl": "http://polyclinic.singhealth.com.sg/QWatch/QimgPageNew.aspx?Loc_Code=MPP"
      },
      {
        "name": "Outram Polyclinic",
        "group": "SINGHEALTH",
        "X": 28556.0663,
        "Y": 29087.4945,
        "link": "http://polyclinic.singhealth.com.sg/QueueWatch/SHP-Outram/Pages/Home.aspx",
        "scrapingUrl": "http://polyclinic.singhealth.com.sg/QWatch/QimgPageNew.aspx?Loc_Code=OUP"
      },
      {
        "name": "Pasir Ris Polyclinic",
        "group": "SINGHEALTH",
        "X": 42009.6189,
        "Y": 38957.2748,
        "link": "http://polyclinic.singhealth.com.sg/QueueWatch/SHP-PasirRis/Pages/Home.aspx",
        "scrapingUrl": "http://polyclinic.singhealth.com.sg/QWatch/QimgPageNew.aspx?Loc_Code=PRP"
      },
      {
        "name": "Queenstown Polyclinic",
        "group": "SINGHEALTH",
        "X": 24405.1997,
        "Y": 31204.0964,
        "link": "http://polyclinic.singhealth.com.sg/QueueWatch/SHP-Queenstown/Pages/home.aspx",
        "scrapingUrl": "http://polyclinic.singhealth.com.sg/QWatch/QimgPageNew.aspx?Loc_Code=QTP"
      },
      {
        "name": "Sengkang Polyclinic",
        "group": "SINGHEALTH",
        "X": 34788.136381811,
        "Y": 41629.448858411,
        "link": "http://polyclinic.singhealth.com.sg/QueueWatch/SHP-Sengkang/Pages/home.aspx",
        "scrapingUrl": "http://polyclinic.singhealth.com.sg/QWatch/QimgPageNew.aspx?Loc_Code=SKP"
      },
      {
        "name": "Tampines Polyclinic",
        "group": "SINGHEALTH",
        "X": 40523.3978,
        "Y": 37710.2468,
        "link": "http://polyclinic.singhealth.com.sg/QueueWatch/SHP-Tampines/Pages/home.aspx",
        "scrapingUrl": "http://polyclinic.singhealth.com.sg/QWatch/QimgPageNew.aspx?Loc_Code=TMP"
      },
      {
        "name": "Toa Payoh Polyclinic",
        "group": "NHG",
        "X": 30853.2250,
        "Y": 35185.5813,
        "link": "https://www.nhgp.com.sg/smile.aspx?loc=tp",
        "scrapingUrl": "https://smile.nhgp.com.sg/StatPage.aspx?location=tp"
      },
      {
        "name": "Woodlands Polyclinic",
        "group": "NHG",
        "X": 21535.2503,
        "Y": 45848.5072,
        "link": "https://www.nhgp.com.sg/smile.aspx?loc=wds",
        "scrapingUrl": "https://smile.nhgp.com.sg/StatPage.aspx?location=wds"
      },
      {
        "name": "Yishun Polyclinic",
        "group": "NHG",
        "X": 28558.0764,
        "Y": 45364.7875,
        "link": "https://www.nhgp.com.sg/smile.aspx?loc=yis",
        "scrapingUrl": "https://smile.nhgp.com.sg/StatPage.aspx?location=yis"
      }
    ];
    async.eachLimit(polyclinics, 1, function(polyclinic, itCallback) {
      if(!polyclinic.link || !polyclinic.group) itCallback();
      if(polyclinic.group == "SINGHEALTH"){
        request(polyclinic.scrapingUrl, function(error, response, body) {
          var $;
          if (!error && response.statusCode == 200) {
            $ = cheerio.load(body);
            polyclinic.imgConsultation = fullUrl("http://polyclinic.singhealth.com.sg", "http://polyclinic.singhealth.com.sg/QWatch", $("#imgCam1").attr("src"));
            polyclinic.imgRegistration = fullUrl("http://polyclinic.singhealth.com.sg", "http://polyclinic.singhealth.com.sg/QWatch", $("#imgCam2").attr("src"));
            polyclinic.imgPharmacy = fullUrl("http://polyclinic.singhealth.com.sg", "http://polyclinic.singhealth.com.sg/QWatch", $("#imgCam3").attr("src"));
            polyclinic.waitingNumber = Number($("#infoPatientCount").text()) || 0;
            var waitingTime = $("#infoWaitingTime").text();
            var match = (/((\d+) hours?)? *((\d+) mins?)?/g).exec(waitingTime);
            //console.log(polyclinic.name);
            //console.log(match);
            if(match && waitingTime) polyclinic.waitingTime = Number(match[2])*60 + Number(match[4]);
            //console.log(polyclinic.waitingTime);
          }
          itCallback();
        });
      }
      else if(polyclinic.group == "NHG"){
        var $;
        request({
          url: polyclinic.scrapingUrl,
          strictSSL : false,
          rejectUnauthorized : false,
          tunnel : false,
          secureOptions: constants.SSL_OP_NO_TLSv1_2
        }, function(error, response, body) {
          if (!error && response.statusCode == 200) {
            $ = cheerio.load(body);
            polyclinic.imgConsultation = fullUrl("https://smile.nhgp.com.sg", "https://smile.nhgp.com.sg", $("#imgConsultation").attr("src"));
            polyclinic.imgRegistration = fullUrl("https://smile.nhgp.com.sg", "https://smile.nhgp.com.sg", $("#imgRegistration").attr("src"));
            polyclinic.imgPharmacy = fullUrl("https://smile.nhgp.com.sg", "https://smile.nhgp.com.sg", $("#imgPharmacy").attr("src"));
            polyclinic.waitingNumber = Number($("#lblStat").text()) || 0;
            if($("#lblStat").text()) polyclinic.waitingTime = polyclinic.waitingNumber*2;
          }
          itCallback();
        });
      }
    }, function(err) {
      storeArr('X', 'Y', 'POLYCLINICS', polyclinics, callback);
    });
  },
  interval: 1000 * 60 * 5
}

customLayers["CAMERAS"] = {
  save: function(callback) {
    callback = callback || function(){};
    getJSON("http://www.onemap.sg/TrafficQuery/Service1.svc/SERVICEINFO?&camera=LTCI", function(obj) {
      if (obj && obj.SERVICESINFO && obj.SERVICESINFO[0] && obj.SERVICESINFO[0].CAMERAINFO) {
        storeArr('X_ADDR', 'Y_ADDR', 'CAMERAS', obj.SERVICESINFO[0].CAMERAINFO.slice(1), callback);
      }
      else return callback('No Data');
    });
  },
  interval: 1000 * 60 * 1
}

customLayers["PARKINGLOTS"] = {
  save: function(callback) {
    callback = callback || function(){};
    getJSON("http://www.onemap.sg/TrafficQuery/Service1.svc/SERVICEINFO?&pinfo=PLAI", function(obj) {
      if (obj && obj.SERVICESINFO && obj.SERVICESINFO[0] && obj.SERVICESINFO[0].PGSINFO) {
        storeArr('X_ADDR', 'Y_ADDR', 'PARKINGLOTS', obj.SERVICESINFO[0].PGSINFO.slice(1), callback);
      }
      else return callback('No Data');
    });
  },
  interval: 1000 * 60 * 5
};

customLayers["TRAFFICINCIDENTS"] = {
  save: function(callback) {
    callback = callback || function(){};
    getJSON("http://www.onemap.sg/TrafficQuery/Service1.svc/SERVICEINFO?&incidents=II", function(obj) {
      if (obj && obj.SERVICESINFO && obj.SERVICESINFO[0] && obj.SERVICESINFO[0].INCIDENTSINFO) {
        storeArr('XCoor', 'YCoor', 'TRAFFICINCIDENTS', obj.SERVICESINFO[0].INCIDENTSINFO.slice(1), callback);
      }
      else return callback('No Data');
    });
  },
  interval: 1000 * 60 * 5
};


customLayers["AVAILABLETAXIS"] = {
  save: function(callback) {
    callback = callback || function(){};
    request({
          url: "http://datamall2.mytransport.sg/ltaodataservice/TaxiAvailability",
          headers: {
            accept: "application/json",
            UniqueUserId: "8634d6f2-2d15-446a-a3f6-0993d7e62a59",
            AccountKey: "h4v8B7JHKIs8jw1RUqtAWg=="
          }
        }, function(error, response, body) {
          if (!error && response.statusCode == 200) {
            try{
              var obj = JSON.parse(body);
              if(obj.value && obj.value.length){
                storeArr('Longitude', 'Latitude', "AVAILABLETAXIS", obj.value, true, callback);
              }
              else callback();
            }
            catch(e){
              callback();
            }
          }
          else callback();
        });
  },
  interval: 1000 * 60 * 1
};

customLayers['WATERLEVELS'] = {
  save: function(callback) {
    callback = callback || function(){};
    request("http://app.pub.gov.sg/WaterLevel/GetWLInfo.aspx?type=WL", function(error, response, body) {
        if (!error && response.statusCode == 200) {
          var TXT_DELIM = "$#$";
          var REC_DELIM = "$@$";
          var arr = [];
          if (body.length > 0) {
              var strRec = body.split(REC_DELIM);
              for (var i = 0; i < strRec.length - 1; i++) {
                  var strData = strRec[i].split(TXT_DELIM);
                  var obj = {};
                  obj.id = strData[0];
                  obj.name = strData[1];
                  obj.X = Number(strData[2]);
                  obj.Y = Number(strData[3]);
                  obj.WLV = Number(strData[4]);
                  obj.Flag = Number(strData[5]);
                  obj.OT = strData[6];
                  arr.push(obj);
              }
              storeArr('X', 'Y', "WATERLEVELS", arr, callback);
          }
          else callback();
      }
      else callback();
    });
  },
  interval: 1000 * 60 * 5
}


exports.updateCustomLayer = function(req, res){
  var currDate = new Date();
  if(customLayers[req.query.q]){
    console.log("updating layer " + req.query.q);
    customLayers[req.query.q].save(function(err){
          HydeFeature.remove({
            'properties.lastUpdated' : {
                  $lt: currDate
              },
            'properties.LAYERNAME' : req.query.q
          }, function(err, removed) {
            console.log("Saved custom layer " + req.query.q);
            Layer.update({
              'LAYERNAME' : req.query.q
            }, {
              lastUpdated: new Date()
            }, function(err, numAffected){
              res.sendStatus(200);
            })
          });
        });
  }
}

function updateLayers(callback){
  getCollection(Layer, function(layers){
    layers = layers.filter(function(layer){
      return layer.lastUpdated < (new Date((new Date()).getTime() - layer.interval));
    });
    async.eachLimit(layers, 1, function(layer, itCallback) {
      var currDate = new Date();
      if(layer.custom){
        console.log("Saving custom layer " + layer.LAYERNAME);
        customLayers[layer.LAYERNAME].save(function(err){
          HydeFeature.remove({
            'properties.lastUpdated' : {
                  $lt: currDate
              },
            'properties.LAYERNAME' : layer.LAYERNAME
          }, function(err, removed) {
            console.log("Saved custom layer " + layer.LAYERNAME);
            Layer.update({
              'LAYERNAME' : layer.LAYERNAME
            }, {
              lastUpdated: new Date()
            }, function(err, numAffected){
              itCallback();
            })
          });
        });
      }
      else{
        console.log("Saving theme layer " + layer.LAYERNAME);
        async.eachLimit(generateExtents(100000), 5, function(extents, extentsCallback){
          getJSON("http://www.onemap.sg/API/services.svc/mashupData?token={{token}}&themeName={{layer}}&extents={{extents}}", {
            layer: layer.LAYERNAME,
            extents: extents
          }, 'OneMap', function(obj) {
            if (obj && obj.SrchResults && obj.SrchResults[0] && (Number(obj.SrchResults[0].FeatCount) > 0)) {
              storeArr('X', 'Y', layer.LAYERNAME, obj.SrchResults.slice(1).map(function(item){
                var XY = item.XY.split(',');
                item.X = Number(XY[0]);
                item.Y = Number(XY[1]);
                return item;
              }), extentsCallback);
            }
            else extentsCallback();
          });
        }, function(err) {
          HydeFeature.remove({
            'properties.lastUpdated' : {
                  $lt: currDate
              },
            'properties.LAYERNAME' : layer.LAYERNAME
          }, function(err, removed) {
            console.log("Saved theme layer " + layer.LAYERNAME);
            Layer.update({
              'LAYERNAME' : layer.LAYERNAME
            }, {
              lastUpdated: new Date()
            }, function(err, numAffected){
              itCallback();
            })
          });
        })
      }
    }, function(err) {
      callback();
    });
  });
}

var refreshLayer = function(){
  console.log("calling refresh layer");
  setTimeout(function(){
    updateLayers(refreshLayer);
  }, 10000);
};
refreshLayer();

exports.getFeaturesByLayer = function(req, res) {
  getCollection(HydeFeature, {
    'properties.LAYERNAME': req.query.q
  }, function(arr) {
    return res.json({
      "type": "FeatureCollection",
      "features": arr
    });
  });
}

exports.storeLayers = function(req, res) {
  request("http://www.onemap.sg/API/services.svc/layerinfo", function(error, response, body) {
    if (!error && response.statusCode == 200) {
      var obj = JSON.parse(body.replace(/\n/g, ' ').replace(/ +/g, ' '));
      if (obj && obj.LayerInfo && obj.LayerInfo.length) {
        //Layer.remove({}, function(err, removed) {
          storeCollection(Layer, obj.LayerInfo, function(arr) {
            var layer;
            var customLayerModels = [];
            for (layer in customLayers) {
              customLayerModels.push({
                LAYERNAME: layer,
                custom: true,
                interval: customLayers[layer].interval
              })
            }
            storeCollection(Layer, customLayerModels, function(arr) {
              getCollection(Layer, function(arr) {
                res.json(arr);
              });
            });
          });
        //});
      }
    }
    else return res.sendStatus(404);
  });
}

/*
 * Params: lat = float; long = float; radius = integer
 */
exports.RetrievePropertiesByPOI = function(req, res) {
  var query = {
    geometry: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [Number(req.query.lon), Number(req.query.lat)]
        },
        $maxDistance: Number(req.query.r)
      }
    }
  };
  getCollection(HydeFeature, query, function(arr) {
    return res.json({
      "type": "FeatureCollection",
      "features": arr
    });
  });

}


function flattenNParksList(list) {
  var arr = [];
  for (var datatype in list)
    for (var region in list[datatype]) {
      list[datatype][region].forEach(function(item) {
        item.LAYERNAME = "NParks_" + datatype;
      });
      arr = arr.concat(list[datatype][region]);
    }
  return arr;
}

function generateGrid(gridSize) {
  var southWest = {
      lat: 1.14524843839316,
      lon: 103.57978820800781
    },
    northEast = {
      lat: 1.5118179484245533,
      lon: 104.16549682617188
    };
  var arr = [];

  for (var currLat = northEast.lat; currLat >= southWest.lat; currLat = svy21.moveSouth({
      lat: currLat,
      lon: currLon
    }, gridSize).lat) {
    for (var currLon = southWest.lon; currLon <= northEast.lon; currLon = svy21.moveEast({
        lat: currLat,
        lon: currLon
      }, gridSize).lon) {
      arr.push({
        "lat": currLat,
        "lon": currLon
      });
    }
    //console.log(svy21.moveEast({lat: currLat, lon: currLon}, gridSize));
  }
  return arr;
}

function generateExtents(gridSize) {
  var southWest = {
      lat: 1.14524843839316,
      lon: 103.57978820800781
    },
    northEast = {
      lat: 1.5118179484245533,
      lon: 104.16549682617188
    };
  var arr = [];

  for (var currLat = northEast.lat; currLat >= southWest.lat; currLat = svy21.moveSouth({
      lat: currLat,
      lon: currLon
    }, gridSize).lat) {
    for (var currLon = southWest.lon; currLon <= northEast.lon; currLon = svy21.moveEast({
        lat: currLat,
        lon: currLon
      }, gridSize).lon) {
      var next = {}
      next.lat = svy21.moveSouth({
        lat: currLat,
        lon: currLon
      }, gridSize).lat;
      next.lon = svy21.moveEast({
        lat: currLat,
        lon: currLon
      }, gridSize).lon;
      var coordsRightBottom = svy21.computeSVY21(next);
      var coordsLeftTop = svy21.computeSVY21({
          lat: currLat,
          lon: currLon
        })
        //n = y, e = x
      arr.push([coordsLeftTop.E + "," + coordsRightBottom.N + "," + coordsRightBottom.E + "," + coordsLeftTop.N]);
    }
    //console.log(svy21.moveEast({lat: currLat, lon: currLon}, gridSize));
  }
  return arr;
}


//http://www.onemap.sg/RQAPI/Service1.svc/RetrievePropertiesByPOI?token=4cbb06bb33b3a901dd0fc7b9a79d7d2df1f52aef08962f27549c35e36ad6072718319729541260df5ce19ff7d3579fb5&callback={callback}&POI=25758.796274676148,48059.10470578274&buffer=1000&Propsrc=H&PropType=01,03,02,04,05,06,08&fromdate=JUN-14&todate=JUN-15&minprice=1&maxprice=10000
//http://www.onemap.sg/RQAPI/Service1.svc/RetrieveTransactionDetails?token=4cbb06bb33b3a901dd0fc7b9a79d7d2df1f52aef08962f27549c35e36ad6072718319729541260df5ce19ff7d3579fb5&callback={callback}&PostalCode=750421&PropSrc=H&ProjName=null&StrtName=null&PropType=01,03,02,04,05,06,08&PNFlag=null&FromDate=JUN-14&ToDate=JUN-15&MinPrice=1&MaxPrice=10000