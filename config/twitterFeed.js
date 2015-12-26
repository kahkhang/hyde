var twitter = require('twitter');
var svy21 = require('../app/svy21');
var request = require('request');
var tokenGetter = require('../app/tokenGetter');
var gju = require('geojson-utils');
var geocoder = require('geocoder');
var sentiment = require('sentiment');
var moment = require('moment-timezone');
var Instagram = require('instagram-node-lib');
var mongoose = require('mongoose');
var Tweet = mongoose.model('Tweet');
var Insta = mongoose.model('Insta');
var nlp = require('nlp_compromise');
var singaporePolygon = require('./singaporePolygon.json');
var allPolys = require('./displayPolygon.json');

var circles =     [{lat: 1.265974355804942, lng: 103.65119021346858, radius: 5000}, 
                    {lat: 1.3361400824121585, lng: 103.681062276588, radius: 5000}, 
                    {lat: 1.295353918638199, lng: 103.66080359513842, radius: 5000}, 
                    {lat: 1.4018116863546028, lng: 103.69891621402198, radius: 5000}, 
                    {lat: 1.4218606882823135, lng: 103.74424755627057, radius: 5000}, 
                    {lat: 1.3523881188142965, lng: 103.74596724548573, radius: 5000}, 
                    {lat: 1.3869530887830093, lng: 103.80606508256184, radius: 5000}, 
                    {lat: 1.4405266737035087, lng: 103.81842798796555, radius: 5000}, 
                    {lat: 1.3119502353337418, lng: 103.81053028680685, radius: 5000}, 
                    {lat: 1.2874084941534185, lng: 103.74013155517272, radius: 5000}, 
                    {lat: 1.345476676805636, lng: 103.87234515527791, radius: 5000}, 
                    {lat: 1.402851966073996, lng: 103.88196200734036, radius: 5000}, 
                    {lat: 1.360682361278892, lng: 103.9448069087982, radius: 5000}, 
                    {lat: 1.4280797308824642, lng: 103.97056723581952, radius: 5000}, 
                    {lat: 1.366899089826947, lng: 104.02001606308235, radius: 5000}, 
                    {lat: 1.2659805239163933, lng: 103.87062689580853, radius: 5000}, 
                    {lat: 1.243514276384468, lng: 103.80160238864065, radius: 5000}, 
                    {lat: 1.2960490113821834, lng: 103.93587534520645, radius: 5000}, 
                    {lat: 1.3046863382474962, lng: 104.00146720703346, radius: 5000}];
//https://github.com/weblancaster/instagram-real-time/blob/master/server.js#L123
//Setup twitter stream api
var tw = new twitter({
  consumer_key: '4fQqD2suBf9HR1LLq6TJZclqp',
  consumer_secret: 'nljX0cz8LevyhRHg7saDURlbp6FQoA6JHqSocEp1Plx3C1kBwq',
  access_token_key: '315746050-LxIZfJwYnTtDKLxDJQgEwOIE1SuvD7Ai370PMUBK',
  access_token_secret: 'X9D851SYABespHcSJvPnAFU0Seyy4TH7yMmSIT1LEKFaj'
}),


stream = null;

var feels = {
  '-11': 'like suicide is the only option',
  '-10': 'the end coming',
  '-9' : 'Terrible',
  '-8' : 'OH GOD WHY',
  '-7' : 'Rainy day',
  '-6' : 'Very, very bad',
  '-5' : 'Very Bad',
  '-4' : 'Bad',
  '-3' : 'Not Good',
  '-2' : 'Not Great',
  '-1' : 'Meh',
  '0'  : 'Average',
  '1'  : 'Alright',
  '2'  : 'Not Bad',
  '3'  : 'Sweet',
  '4'  : 'Good',
  '5'  : 'Great',
  '6'  : 'Awesome',
  '7'  : 'Incredible',
  '8'  : 'Ecstatic',
  '9'  : 'Like a boss',
  '10' : 'Nirvana',
  '11' : 'something no words can describe',
};

function toTitleCase(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function getTweetColor(score) {
    if(!score) return "orange";
    else if(score <= -7) return "darkred";
    else if(score >= -6 && score <= -1) return "red";
    else if(score >= 0 && score <= 1) return "orange";
    else if(score >= 2 && score <= 6) return "darkgreen";
    else return "green";
}

function formatDate(date, dateFormat) {
  return moment(date, dateFormat).tz('Asia/Singapore').format('D MMM YYYY [at] hh:mm:ss a');
}

function getSentiment(tweet, latlon, text, date, dateFormat, oldCallback){
    var callback = function(tweet){
    	//console.log(allPolys.length);
    	for (var i = 0; i < allPolys.features.length; ++i){
    	    //console.log(allPolys.features[i]);
    		if (gju.pointInPolygon({"type":"Point","coordinates":[latlon.lon,latlon.lat]}, allPolys.features[i].geometry)) {
    			tweet.inPoly = allPolys.features[i].properties.name;
    			return oldCallback(tweet);
    		}
    	}
    	return oldCallback(tweet);
    }
    var coords = svy21.computeSVY21(latlon);
    tweet.sentiment = sentiment(text);
    //console.log(tweet.text + ": " + tweet.sentiment.score);
    tweet.feels = feels[Math.floor(tweet.sentiment.score)] || "average";
    tweet.feels = tweet.feels.toLowerCase();
    //tweet.created_human = moment(tweet.created_at, "HH:mm:ss  DD MM YYYY");
    tweet.created_human = formatDate(date, dateFormat);
    tweet.color = getTweetColor(Math.floor(tweet.sentiment.score));
    tweet.created = moment(date, dateFormat).toDate();
    tokenGetter.getOneMapToken("OneMap", function(token){
        if(token){
            var url = "http://www.onemap.sg/API/services.svc/revgeocode?token="+token+"&location="+coords.E+","+coords.N;
            request(url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var geocodedData = JSON.parse(body);
                    if(geocodedData.GeocodeInfo && geocodedData.GeocodeInfo[0] && !geocodedData.GeocodeInfo[0].ErrorMessage){
                        var arr = [];
                        if(geocodedData.GeocodeInfo[0].BLOCK) arr.push("BLK " + geocodedData.GeocodeInfo[0].BLOCK);
                        if(geocodedData.GeocodeInfo[0].BUILDINGNAME) arr.push(geocodedData.GeocodeInfo[0].BUILDINGNAME);
                        if(geocodedData.GeocodeInfo[0].ROAD) arr.push(geocodedData.GeocodeInfo[0].ROAD);
                        if(geocodedData.GeocodeInfo[0].POSTALCODE) arr.push("Singapore " + geocodedData.GeocodeInfo[0].POSTALCODE);
                        tweet.address = toTitleCase(arr.join(", "));
                        callback(tweet);
                        
                    }
                    else {
                        //console.log(Number(tweet.coordinates.coordinates[1]));
                        //console.log(Number(tweet.coordinates.coordinates[0]));
                        geocoder.reverseGeocode(Number(latlon.lat), Number(latlon.lon),  function ( err, data ) {
                          // do something with data
                          //console.log(err);
                          if(data && data.results[0] && data.results[0].formatted_address)
                             tweet.address = data.results[0].formatted_address;
                          //console.log(tweet.address);
                          callback(tweet);
                        });
                    }
                }
            });
        }
        else callback(tweet);
    });
}

function getkeywords(text) {
    var keywordset = {};
    
    text = text.replace(/#[a-zA-Z\d-]+/g, ' ').replace(/\'/g, '').replace(/[^0-9a-zA-Z]/g, ' ');
    var sentences = nlp.pos(text).sentences;
    
    for (var i = 0; i < sentences.length; i++) {
        var tokens = sentences[i].tokens;
    
        for (var j = 0; j < tokens.length; j++) {
            var token = tokens[j];
            var tag = token.pos.tag;
            if (tag == 'CP' || tag == 'PRP' || tag == 'PP') {
                continue;
            }
            var type = token.pos.parent;
            var text = token.text;
            var keyword;
            if (type == 'noun') {
                keyword = nlp.noun(text).conjugate().singular;
            } else if (type == 'verb') {
                keyword = nlp.verb(text).conjugate().infinitive;
            } else if (type == 'adverb') {
                keyword = nlp.adverb(text).conjugate().adjective;
            } else if (type == 'adjective') {
                keyword = text;
            } else {
                // ignore glues and values
                continue;
            }
            keyword = keyword.replace(/\s/g, '').toLowerCase();
            //if (keyword.replace(/\d/g, '')) {
            keywordset[keyword] = 1;
            //}
        }
    }
    
    return keywordset;
}


module.exports = function (server, app, serverUrl) {
    var io      = require('socket.io').listen(server);
    //Create web sockets connection.
    var users = [];
    
    Instagram.set('client_id', 'f2c080f2e20b4c71b8ed89ca6565dcac');
    Instagram.set('client_secret', '4b6ff3c8229b408496ee64dac83d4fc5');
    Instagram.set('callback_url', serverUrl + '/instagramCallback');
    Instagram.set('redirect_uri', serverUrl + '/');
    Instagram.set('maxSockets', 10);
    Instagram.media.unsubscribe_all({});
    
    circles.forEach(function(circle){
        Instagram.media.subscribe(circle);
    })
    
    //https://api.instagram.com/v1/geographies/12872944/media/recent?client_id=2c295b2ac37749bf8d8f25df15b8c885
    tw.stream("statuses/filter", {
        'locations':'103.57978820800781,1.14524843839316,104.16549682617188,1.5118179484245533',
        language: 'en'
    }, function(stream) {
        stream.on("data", function(tweet) {
            //tweet.coordinates = tweet.coordinates || gju.centroid(tweet.place.bounding_box);
            if(tweet.coordinates && gju.pointInPolygon(tweet.coordinates,singaporePolygon))
                getSentiment(tweet, {lat: tweet.coordinates.coordinates[1], lon: tweet.coordinates.coordinates[0]}, tweet.text, tweet.created_at, 'ddd MMM DD HH:mm:ss ZZ YYYY', function(processedTweet){
                    //console.log('new tweet!');
                    processedTweet.keywords = getkeywords(processedTweet.text);
                    //console.log(processedTweet.text);
                    //console.log(processedTweet.keywords);
                    io.sockets.emit("new tweet", processedTweet);
                    Tweet.create(processedTweet, function (err, doc) {
                      if (err) console.log('error: ' + err);
                    });
                });
        });
        stream.on('error', function(error) {
            return;
        });
    });
    
    var grabInstas = function(){
        circles.forEach(function(circle){
            Instagram.media.search({
                lat: circle.lat,
                lng: circle.lng,
                distance: 5000,
                complete: function(data){
                    //console.log(data);
                    data.forEach(function(instagram){
                        Insta.find({ 'id': instagram.id }, function (err, docs) {
                          if(!docs.length){
                            proccessInsta(instagram, function(processedInstagram){
                                //console.log("emit new insta");
                                processedInstagram.keywords = getkeywords(processedInstagram.caption.text);
                                io.sockets.emit("new insta", processedInstagram);
                                Insta.create(processedInstagram, function (err, doc) {
                                  //if (err) console.log('error: ' + err);
                                });
                            });
                          }
                        });
    
                    })
                }
            });
        });
    };
    grabInstas();
    var grabInterval = setInterval(grabInstas, 20000);
    
    var removeExpired = function(){
    	Tweet.find({
            created: {
                $lte: new Date((new Date()).getTime() - 1000*60*60)
            }
        }).remove().exec();
        Insta.find({
            created: {
                $lte: new Date((new Date()).getTime() - 1000*60*60)
            }
        }).remove().exec();
    };
    removeExpired();
    var removeInterval = setInterval(removeExpired, 1000*60*60);
    
    /**
     * A listener for a client connection
     */
    io.sockets.on("connection", function(socket) {
        // The user it's added to the array if it doesn't exist
        if(users.indexOf(socket.id) === -1) {
            users.push(socket.id);
        }
    
        // Log
        logConnectedUsers();
            
        // This handles when a user is disconnected
        socket.on("disconnect", function(o) {
            // find the user in the array
            var index = users.indexOf(socket.id);
            if(index != -1) {
                // Eliminates the user from the array
                users.splice(index, 1);
            }
            logConnectedUsers();
        });
    });
    
    // A log function for debugging purposes
    function logConnectedUsers() {
        console.log("============= CONNECTED USERS ==============");
        console.log("==  ::  " + users.length);
        console.log("============================================");
    }
    
    function proccessInsta(instagram, callback){
        if(instagram.caption && instagram.caption.text && instagram.location && instagram.location.latitude && instagram.location.longitude){
            //console.log('getting sentiment' + instagram);
            if(gju.pointInPolygon({"type":"Point","coordinates":[Number(instagram.location.longitude),Number(instagram.location.latitude)]}, singaporePolygon))
                getSentiment(instagram, {lat: instagram.location.latitude, lon: instagram.location.longitude}, instagram.caption.text, instagram.created_time, 'X', callback);
        }
    };
    
    app.post('/instagramCallback', function(req, res){
        var data = req.body;
        console.log('callback! :)');
        //console.log(data);
        data.forEach(function(obj){
            request("https://api.instagram.com/v1/geographies/"+obj.object_id+"/media/recent?client_id=2c295b2ac37749bf8d8f25df15b8c885", function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var insta = JSON.parse(body);
                    //console.log(insta);
                    if(insta && insta.data && insta.data.length){
                        insta.data.forEach(function(instagram){
                            proccessInsta(instagram, function(processedInstagram){
                                processedInstagram.keywords = getkeywords(processedInstagram.caption.text);
                                console.log('new insta!');
                                io.sockets.emit("new insta", processedInstagram);
                                Insta.create(processedInstagram, function (err, doc) {
                                  if (err) console.log('error: ' + err);
                                })
                            })
                        })
                        
                    }
                    
                }
            });
        })
        res.end();
    })
    
    /**
     * Needed to receive the handshake
     */
    app.get('/instagramCallback', function(req, res){
        //console.log(req);
        var handshake =  Instagram.subscriptions.handshake(req, res);
    });
    
    /*
    * params = q = woeid
    */
    app.get('/getTwitterTrends', function(req, res) {
      //singapore's woeid: 23424948
      tw.get('trends/place', {id: req.query.q}, function(error, tweets, response){
          res.json(tweets);
      });
    
    });

    /*
    * Parameters: status = string (i.e. "We're looking into this")
    * id = string (i.e. string of user ID to reply the tweet to)
    */
    app.post('/replyTweet', function(req, res) {
      console.log(req.query.status + " " + req.query.id);
      /*
      tw.post('statuses/update', {status: req.query.status, 
                                    id: req.query.id}, 
      function(error, tweet, response){
        if (!error) {
           console.log(tweet);
        }
      });
      */
      res.sendStatus(200);
    });
    
    app.post('/replyInstagram', function(req, res) {
      console.log(req.query.status + " " + req.query.id);
      res.sendStatus(200);
    });
    
    app.get('/getInstaTweets', function(req, res){
        var obj = { tweets: [], instas: []};
        var expireInterval = Number(req.query.q);
        Insta.find({
            created: {
                $gt: new Date((new Date()).getTime() - expireInterval)
            }
        }, { '_id': 0, "__v":0}, function (err, docs){
            docs.forEach(function(doc){
                obj.instas.push(doc);
            });
            Tweet.find({
                created: {
                    $gt: new Date((new Date()).getTime() - expireInterval)
                }
            }, { '_id': 0, "__v":0}, function (err, docs){
                docs.forEach(function(doc){
                    obj.tweets.push(doc);
                });
                res.json(obj);
            });
        });
    });
}
