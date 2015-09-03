var _socket = null;
var tweetLayers = {};
var instaLayers = {};
var globalTweetMarkers;
var globalInstaMarkers;
var shownTweetLayers = {};
var shownInstaLayers = {};
var selectedPolys = {};
var allPolys = [];
var allPolyHash = {};
var expireInterval = 1000 * 60 * 10;
var xTweetInstas = crossfilter();
var expireDimensionTweetInstas = xTweetInstas.dimension(function(layer) {
	if (layer.feature.properties.insta)
		return ((new Date(layer.feature.properties.insta.created)).getTime() + expireInterval);
	else if (layer.feature.properties.tweet)
		return ((new Date(layer.feature.properties.tweet.created)).getTime() + expireInterval);
});

setInterval(function() {
	var currTime = (new Date()).getTime();
	expireDimensionTweetInstas.filter(function(expireTime) {
		return expireTime < currTime;
	});
	xTweetInstas.remove();
	expireDimensionTweetInstas.filterAll();
	dc.redrawAll();
}, 2000);


function getTweetColor(score) {
	if (!score) return "orange";
	else if (score <= -7) return "darkred";
	else if (score >= -6 && score <= -1) return "red";
	else if (score >= 0 && score <= 1) return "orange";
	else if (score >= 2 && score <= 6) return "darkgreen";
	else return "green";
}

function getTweetCats(score) {
	if (!score) return "Okay";
	else if (score <= -7) return "Terrible";
	else if (score >= -6 && score <= -1) return "Bad";
	else if (score >= 0 && score <= 1) return "Okay";
	else if (score >= 2 && score <= 6) return "Happy";
	else return "Superb";
}

function shouldBeShown(layer, ignoreTags) {
	if (!layer || !layer.feature) return true;
	if (!('poly' in layer.feature.properties)) {
		//console.log('precomputing!');
		precomputePoly(layer);
	}
	var show = true,
		gotSelect = false,
		selectedWord = false,
		isSocial = true;
	if (Object.keys(selectedPolys).length !== 0 && (!('poly' in layer.feature.properties) ||
			!selectedPolys[layer.feature.properties.poly.properties.name])) {
		show = false;
	}
	//if (layer.feature.properties.insta) console.log('layer is shown' + layer.feature.properties.insta.id)
	if (show && !ignoreTags) {
		for (var tag in isSelected) {
			if (isSelected[tag]) {
				gotSelect = true;
				if (layer.feature.properties.tweet) {
					if (currentWordCloud.hashTable[tag] && currentWordCloud.hashTable[tag][layer.feature.properties.tweet.id])
						selectedWord = true;
				}
				else if (layer.feature.properties.insta) {
					if (currentWordCloud.hashTable[tag] && currentWordCloud.hashTable[tag][layer.feature.properties.insta.id])
						selectedWord = true;
				}
				else isSocial = false;
			}
		}
		if (gotSelect && !selectedWord && isSocial) show = false;
	}
	return show;
}

function reloadLayers() {
	globalTweetMarkers.clearLayers();
	shownTweetLayers = {};
	shownInstaLayers = {};
	expireDimensionTweetInstas.filterAll();
	xTweetInstas.remove();

	for (var layerName in customLayersFeatureGroup) {
		customLayersFeatureGroup[layerName].clearLayers();
		shownCustomLayers[layerName] = {};
		xCustomLayersDimension[layerName].filterAll();
		xCustomLayers[layerName].remove();

		for (var layerId in allCustomLayers[layerName]) {
			if (shouldBeShown(allCustomLayers[layerName][layerId])) {
				customLayersFeatureGroup[layerName].addLayer(allCustomLayers[layerName][layerId]);
				shownCustomLayers[layerName][layerId] = allCustomLayers[layerName][layerId];
				xCustomLayers[layerName].add([allCustomLayers[layerName][layerId]]);
			}
		}
	}

	for (var tweetId in tweetLayers) {
		if (shouldBeShown(tweetLayers[tweetId])) {
			// Reset coordinates, since it might be bouncing at the moment
			if (tweetLayers[tweetId]._origLatlng) {
    			clearInterval(tweetLayers[tweetId]._intervalId);
    			tweetLayers[tweetId].setLatLng(L.latLng(tweetLayers[tweetId]._origLatlng));
			}
			globalTweetMarkers.addLayer(tweetLayers[tweetId]);
			shownTweetLayers[tweetId] = tweetLayers[tweetId];
			xTweetInstas.add([tweetLayers[tweetId]]);
		}
	}
	globalInstaMarkers.clearLayers();
	for (var instaId in instaLayers) {
		if (shouldBeShown(instaLayers[instaId])) {
		    if (instaLayers[instaId]._origLatlng) {
    		    clearInterval(instaLayers[instaId]._intervalId);
    			instaLayers[instaId].setLatLng(L.latLng(instaLayers[instaId]._origLatlng));
		    }
			globalInstaMarkers.addLayer(instaLayers[instaId]);
			shownInstaLayers[instaId] = instaLayers[instaId];
			xTweetInstas.add([instaLayers[instaId]]);
		}
	}

	var colors = ['#008080', '#399785', '#5aaf8c', '#7ac696', '#9edba4', '#c7f0ba', '#ffffe0', '#ffd1c9', '#fea0ac', '#ef738b', '#d84765', '#b61d39', '#8b0000'].reverse();

	$("#mediaFeed").empty();
	var cnt = 0;
	for (var instaId in shownInstaLayers) {
		cnt++;
		if (cnt > 20) return;
		$("#mediaFeed").prepend(shownInstaLayers[instaId].feature.properties.sidedisplay);
	}

	for (var tweetId in shownTweetLayers) {
		cnt++;
		if (cnt > 20) return;
		$("#mediaFeed").prepend(shownTweetLayers[tweetId].feature.properties.sidedisplay);
	}
	dc.redrawAll();
}

function emitMsj(signal, o) {
	if (_socket) {
		_socket.emit(signal, o);
	}
	else {
		alert("Uh oh! Socket.io didn't start!");
	}
}

function precomputePoly(layer) {
	//console.log(allPolys.length);
	if (layer.feature.properties.insta && layer.feature.properties.insta.inPoly) {
		//console.log(layer.feature.properties.insta.inPoly);
		if (allPolyHash[layer.feature.properties.insta.inPoly]) {
			layer.feature.properties.poly = allPolyHash[layer.feature.properties.insta.inPoly];
			return;
		}
	}
	if (layer.feature.properties.tweet && layer.feature.properties.tweet.inPoly) {
		//console.log(layer.feature.properties.tweet.inPoly);
		if (allPolyHash[layer.feature.properties.tweet.inPoly]) {
			layer.feature.properties.poly = allPolyHash[layer.feature.properties.tweet.inPoly];
			return;
		}
	}
	for (var i = 0; i < allPolys.length; ++i)
		if (gju.pointInPolygon(layer.feature.geometry, allPolys[i].geometry)) {
			//console.log(layer.feature.geometry);
			layer.feature.properties.poly = allPolys[i];
			return;
		}
}

var addNewInsta = function(insta) {
	if (insta.location && insta.location.latitude && insta.location.longitude && insta.type == "image") {
		var instaGeoJson = {
			"coordinates": [insta.location.longitude, insta.location.latitude],
			"type": "Point"
		};
		var geoJson = L.geoJson(instaGeoJson, {
			pointToLayer: function(feature, latlng) {
				return L.marker(latlng, {
					icon: L.AwesomeMarkers.icon({
						icon: 'instagram',
						prefix: 'fa',
						markerColor: insta.color
					}),
					bounceOnAdd: true,
					bounceOnAddOptions: {
						duration: 500,
						height: 100
					},
					contextmenu: true,
					contextmenuItems: [{
						text: 'Marker item',
						index: 0
					}, {
						separator: true,
						index: 1
					}]
				});
			},
			onEachFeature: function(feature, layer) {
				var popupContent = "<instagram-display instagramjson='" + quoteattr(JSON.stringify(insta)) + "'></instagram-display>";
				layer.bindPopup(popupContent);

				var sideContent = "<instagramside-display instagramjson='" + quoteattr(JSON.stringify(insta)) + "'></instagramside-display>";
				layer.feature.properties.sidedisplay = $.parseHTML(sideContent)[0];
				layer.feature.properties.insta = insta;
				instaLayers[insta.id] = layer;
				if (shouldBeShown(instaLayers[insta.id])) {
					globalInstaMarkers.addLayer(instaLayers[insta.id]);
					shownInstaLayers[insta.id] = instaLayers[insta.id];
					$('#mediaFeed').prepend(shownInstaLayers[insta.id].feature.properties.sidedisplay);
					xTweetInstas.add([layer]);
				}
				var expireTime = ((new Date(insta.created)).getTime() + expireInterval) - (new Date()).getTime();
				var removeInsta = (function(insta) {
					return function() {
						globalInstaMarkers.removeLayer(instaLayers[insta.id]);
						delete instaLayers[insta.id];
						delete shownInstaLayers[insta.id];
					}
				})(insta);
				if (expireTime < 0) removeInsta();
				else setTimeout(removeInsta, expireTime);
			}
		});


	}
};
var addNewTweet = function(tweet) {
	// handle tweet object
	var geoJson = L.geoJson(tweet.coordinates, {
		pointToLayer: function(feature, latlng) {
			return L.marker(latlng, {
				icon: L.AwesomeMarkers.icon({
					icon: 'twitter',
					prefix: 'fa',
					markerColor: tweet.color
				}),
				bounceOnAdd: true,
				bounceOnAddOptions: {
					duration: 500,
					height: 100
				},
				contextmenu: true,
				contextmenuItems: [{
					text: 'Marker item',
					index: 0
				}, {
					separator: true,
					index: 1
				}]
			});
		},
		onEachFeature: function(feature, layer) {
			var popupContent = "<tweet-display tweetjson='" + quoteattr(JSON.stringify(tweet)) + "'></tweet-display>";
			var sideContent = "<tweetside-display tweetjson='" + quoteattr(JSON.stringify(tweet)) + "'></tweetside-display>";
			layer.feature.properties.sidedisplay = $.parseHTML(sideContent)[0];
			//$('#mediaFeed').prepend(layer.feature.properties.sidedisplay);

			tweetLayers[tweet.id] = layer;


			if (shouldBeShown(tweetLayers[tweet.id])) {
				globalTweetMarkers.addLayer(tweetLayers[tweet.id]);
				shownTweetLayers[tweet.id] = tweetLayers[tweet.id];
				$('#mediaFeed').prepend(shownTweetLayers[tweet.id].feature.properties.sidedisplay);
				xTweetInstas.add([layer]);
			}

			layer.feature.properties.tweet = tweet;


			var expireTime = ((new Date(tweet.created)).getTime() + expireInterval) - (new Date()).getTime();
			var removeTweet = (function(tweet) {
				return function() {
					globalTweetMarkers.removeLayer(tweetLayers[tweet.id]);
					delete tweetLayers[tweet.id];
					delete shownTweetLayers[tweet.id];
				}
			})(tweet);
			if (expireTime < 0) removeTweet();
			else setTimeout(removeTweet, expireTime);


			//console.log(layer);
			layer.bindPopup(popupContent);
		}
	});
};

function addTwitterFeed(tweetMarkers, instaMarkers) {
	globalTweetMarkers = tweetMarkers;
	globalInstaMarkers = instaMarkers;
	if (io !== undefined) {
		// Here you create the connection with the server
		_socket = io.connect(window.location.origin + ":80/");
		// This will listen to the "new tweet" signal everytime
		// there's a new tweet incoming into the stream
		_socket.on("new tweet", addNewTweet);
		_socket.on("new insta", addNewInsta);

		/*
	    // This will listen when the server emits the "connected" signal
	    // informing to the client that the connection has been stablished
	    _socket.on("connected", function(r) {
	        //console.log("Tracking now: " + r.tracking);
	        //console.log(r.tracking);
	        // Here the client tells the server to "start stream"
	        emitMsj("start stream");
	    });
	    */
	}


	var sentimentDimension = xTweetInstas.dimension(function(layer) {
		var score = 0;
		if(layer){
			if (layer.feature.properties.insta)
				score = layer.feature.properties.insta.sentiment.score;
			else if (layer.feature.properties.tweet)
				score = layer.feature.properties.tweet.sentiment.score;
			if(isNaN(score)) score = 0;
		}
		return getTweetCats(score);
	});

	dc.rowChart('#sentiment-overview').width(300)
            .height(240)
            .group(sentimentDimension.group())
            .dimension(sentimentDimension)
			//.colors(d3.scale.category10())
			.colors(["darkred","red","orange","darkgreen","green"])
            .ordering(function(d) {
            	var obj = {"Terrible" : 0,"Bad" : 1,"Okay" : 2,"Happy" : 3,"Superb" : 4};
            	return obj[d.key];
            	
            })
            //.ordinalColors(['#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#dadaeb'])
            .label(function(d) {
                return d.key;
            })
            .title(function(d) {
                return d.value;
            })
            .elasticX(true)
            .xAxis().ticks(4);
            /*
	dc.barChart('#sentiment-overview').width(330)
		.height(235)
		.dimension(sentimentDimension)
		.group(sentimentDimension.group())
		.x(d3.scale.ordinal().domain(["Terrible", "Bad", "Okay", "Happy", "Superb"]))
		.xUnits(dc.units.ordinal)
		.elasticY(true)
		.renderlet(function(chart) {
			var colors = d3.scale.ordinal().domain(["Terrible", "Bad", "Okay", "Happy", "Superb"])
				.range(["darkred","red","orange","darkgreen","green"]);
			chart.selectAll('rect.bar').each(function(d) {
				d3.select(this).attr("style", "fill: " + colors(d.data.key));
			});
		});*/
	dc.renderAll();
}

function getWordCloud() {
	var obj = {};
	var hashtag_weight = 5;
	var hashTable = {};

	for (var tweetId in tweetLayers) {
		var tweetLayer = tweetLayers[tweetId];
		if (!shouldBeShown(tweetLayer, true)) continue;
		var tweet = tweetLayer.feature.properties.tweet;

		for (var keyword in tweet.keywords) {
			if (!obj[keyword]) obj[keyword] = 0;
			obj[keyword]++;

			hashTable[keyword] = hashTable[keyword] || {};
			hashTable[keyword][tweet.id] = tweetLayer;
		}
		for (var i in tweet.entities.hashtags) {
			var tag = tweet.entities.hashtags[i].text;
			if (!obj[tag]) obj[tag] = 0;
			obj[tag] += hashtag_weight;

			hashTable[tag] = hashTable[tag] || {};
			hashTable[tag][tweetId] = tweetLayer;
		}
	}
	for (var instaId in instaLayers) {
		var instaLayer = instaLayers[instaId];
		if (!shouldBeShown(instaLayer, true)) continue;
		var insta = instaLayer.feature.properties.insta;

		for (var keyword in insta.keywords) {
			if (!obj[keyword]) obj[keyword] = 0;
			obj[keyword]++;
			hashTable[keyword] = hashTable[keyword] || {};
			hashTable[keyword][insta.id] = instaLayer;
		}

		for (var i in insta.tags) {
			var tag = insta.tags[i];
			if (!obj[tag]) obj[tag] = 0;
			obj[tag] += hashtag_weight;

			hashTable[tag] = hashTable[tag] || {};
			hashTable[tag][instaId] = instaLayer;
		}
	}
	return {
		wordcloud: obj,
		hashTable: hashTable
	}
}
