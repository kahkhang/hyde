var selectedPolys = {};
var allPolys = [];

function updateColors() {
	for (var i = 0; i < allPolys.length; ++i){
		allPolys[i].properties._tmpcnt = 0;
		allPolys[i].properties._sentiment = 0;
	}
		

	for (var tweetId in tweetLayers) {
		if (tweetLayers[tweetId].feature.properties.poly) {
			tweetLayers[tweetId].feature.properties.poly.properties._tmpcnt++;
			tweetLayers[tweetId].feature.properties.poly.properties._sentiment += tweetLayers[tweetId].feature.properties.tweet.sentiment.score;
		}
	}
	for (var instaId in instaLayers) {
		if (instaLayers[instaId].feature.properties.poly) {
			instaLayers[instaId].feature.properties.poly.properties._tmpcnt++;
			instaLayers[instaId].feature.properties.poly.properties._sentiment += instaLayers[instaId].feature.properties.insta.sentiment.score;
		}
	}

	
	for (var i = 0; i < allPolys.length; ++i){
		var score = 0;
		if(allPolys[i].properties._tmpcnt)
			score = allPolys[i].properties._sentiment / allPolys[i].properties._tmpcnt;
		
		allPolys[i].properties.layer.setStyle({
			fillColor: getColor(score)
		});
	}
}

setInterval(updateColors, 5000);

// get color depending on population density value
function getColor(d) {
	var colors = ['#008080', '#399785', '#5aaf8c', '#7ac696', '#9edba4', '#c7f0ba', '#ffffe0', '#ffd1c9', '#fea0ac', '#ef738b', '#d84765', '#b61d39', '#8b0000'].reverse();
	//console.log(Math.min(colors.length - 1, Math.floor(d / 2)));
	//console.log(d);
	//console.log(Math.floor(d / 10));
	d = Math.round(d)*3;
	d = Math.max(0, d);
	d = Math.min(colors.length - 1, d);
	return colors[d];
	//	return colors[Math.min(colors.length - 1, Math.floor((d + 11)/22*colors.length))];
	//return colors[Math.min(colors.length - 1, Math.floor(d / 2))];
	/*return d > 1000 ? '#800026' :
		d > 500 ? '#BD0026' :
		d > 200 ? '#E31A1C' :
		d > 100 ? '#FC4E2A' :
		d > 50 ? '#FD8D3C' :
		d > 20 ? '#FEB24C' :
		d > 10 ? '#FED976' :
		'#FFEDA0';*/
}


function addChoropleth(main, callback) {
	var map = main.map;
	// control that shows state info on hover
	var info = L.control({
		position: 'bottomleft'
	});

	info.onAdd = function(map) {
		this._div = L.DomUtil.create('div', 'info');
		this.update();
		return this._div;
	};

	info.update = function(props) {
		//console.log(props);
		this._div.innerHTML = '<h4>Region </h4>' + (props ?
			'<b>' + props.name + '</b><br />Members of Parliament: '  + props.member_parliament : 'Hover over a region');
	};

	info.addTo(map);



	function style(feature) {
		return {
			weight: 1,
			opacity: 1,
			color: 'white',
			fillOpacity: 0.3,
			fillColor: getColor(0)
		};
	}

	function highlightFeature(e) {
		var layer = e.target;

		layer.setStyle({
			weight: 2,
			fillOpacity: 0.5
		});

		if (!L.Browser.ie && !L.Browser.opera) {
			layer.bringToFront();
		}

		info.update(layer.feature.properties);
	}

	var geojson;

	function resetPoly(poly) {
		var polyName = poly.feature.properties.name;
		//geojson.resetStyle(poly);
		if (selectedPolys[polyName]) {
			poly.setStyle({
				fillOpacity: 0.95
			});
		}
		else {
			poly.setStyle({
				fillOpacity: 0.3
			});
		}
	}

	function resetHighlight(e) {
		resetPoly(e.target);
		info.update();
	}

	function zoomToFeature(e) {
		//map.fitBounds(e.target.getBounds());
		var poly = e.target.feature;
		var polyName = poly.properties.name;
		if (selectedPolys[polyName]) {
			delete selectedPolys[polyName];
		}
		else {
			selectedPolys[polyName] = poly;
		}
		resetPoly(e.target);
		reloadWordCloud();
		reloadLayers();
	}

	function onEachFeature(feature, layer) {
		layer.on({
			mouseover: highlightFeature,
			mouseout: resetHighlight,
			click: zoomToFeature
		});
		feature.properties.layer = layer;
		allPolys.push(feature);
	}

	getJSON('/data/2015ge_grc.geojson', function(data) {
		geojson = L.geoJson(data, {
			style: style,
			onEachFeature: onEachFeature
		}).addTo(map);
		
		getJSON('/getInstaTweets?q='+expireInterval, function(obj){
			callback();
			obj.tweets.forEach(addNewTweet);
			obj.instas.forEach(addNewInsta);
			
		})
	});


	/*
	var legend = L.control({
		position: 'bottomright'
	});

	legend.onAdd = function(map) {

		var div = L.DomUtil.create('div', 'info legend'),
			grades = [0, 10, 20, 50, 100, 200, 500, 1000],
			labels = [],
			from, to;

		for (var i = 0; i < grades.length; i++) {
			from = grades[i];
			to = grades[i + 1];

			labels.push(
				'<i style="background:' + getColor(from + 1) + '"></i> ' +
				from + (to ? '&ndash;' + to : '+'));
		}

		div.innerHTML = labels.join('<br>');
		return div;
	};

	legend.addTo(map);
	*/
}

function getJSON(url, callback) {
	var request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.onreadystatechange = function() {
		if (this.readyState === 4) {
			if (this.status >= 200 && this.status < 400) {
				// Success!
				var data = JSON.parse(this.responseText);
				callback(data);
			}
			else {
				// Error :(
			}
		}
	};

	request.send();
	request = null;
}