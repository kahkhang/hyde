var main;
var customLayers;
var shownCustomLayers = {};
var allCustomLayers = {};
var customLayersFeatureGroup = {};
var isSelected = {};
var xCustomLayers = {};
var xCustomLayersDimension = {};

window.onload = function() {
    main = loadMainMap(1.2633253574893224, 103.853759765625, 'map');
    var map = main.map;

    addChoropleth(main, function() {
        var tweetMarkers = new L.FeatureGroup();
        tweetMarkers.addTo(map);

        var instagramMarkers = new L.FeatureGroup();
        instagramMarkers.addTo(map);


        addTwitterFeed(tweetMarkers, instagramMarkers);

        /*map.on('click', function(e){
	  console.log(e.latlng);
      var marker = new L.marker(e.latlng).addTo(map);
    });*/

        var searchGroup = L.featureGroup().addTo(map);

        L.control.typeahead({
                hint: true,
                highlight: true,
                minLength: 1
            }, {
                name: 'val',
                source: function(val, syncResults, asyncResults) {
                    var basicSearch = new BasicSearch;
                    basicSearch.searchVal = val;
                    basicSearch.returnGeom = '1';
                    console.log(val);
                    basicSearch.GetSearchResults(function(resultData) {
                        //debugger;
                        console.log(resultData);
                        var results = resultData.results;
                        if (results == 'No results') {
                            return false;
                        }
                        else {
                            //console.log(results);
                            asyncResults(results.map(function(result) {
                                result.formattedVal = toTitleCase(decodeURI(result.SEARCHVAL));
                                return result;
                            }));
                        }
                    });
                },
                display: 'formattedVal',
                templates: {
                    suggestion: Handlebars.compile('<div>{{formattedVal}}</div>')
                }
            }, {
                placeholder: 'Search',
                'typeahead:select': function(ev, suggestion) {
                    console.log(suggestion);
                    var latlon = SVY21.computeLatLon({
                        N: suggestion.Y,
                        E: suggestion.X
                    });
                    searchGroup.clearLayers();
                    searchGroup.addLayer(arrToGeoJSON([suggestion], {
                        onEachFeature: onEachFeature,
                        pointToLayer: function(feature, latlng) {
                            return L.marker(latlng, {
                                icon: getMarkerIcon(feature.properties)
                            });
                        }
                    }))

                    map.fitBounds(searchGroup.getBounds(), {
                        maxZoom: 6
                    });
                },
                'typeahead:render': function(args) {
                    if (arguments.length == 1) return false;
                    var suggestions = [];
                    for (var i = 1; i < arguments.length; i++) {
                        suggestions.push(arguments[i]);
                    }
                    searchGroup.clearLayers();
                    searchGroup.addLayer(arrToGeoJSON(suggestions, {
                        onEachFeature: onEachFeature,
                        pointToLayer: function(feature, latlng) {
                            return L.marker(latlng, {
                                icon: getMarkerIcon(feature.properties)
                            });
                        }
                    }));
                    map.fitBounds(searchGroup.getBounds(), {
                        maxZoom: 4
                    });
                },
                'typeahead:active': function(args) {
                    searchGroup.clearLayers();
                    $('.tt-input').val('');
                    //map.fitBounds(fullBounds);
                }
            }) //.addTo(main.map);

        L.control.locate().addTo(main.map);

        //add drawing
        var drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);


        map.on('draw:created', function(e) {
            //console.log(e.getRadius());
            var latlng = e.layer.getLatLng();
            //console.log(Math.ceil(e.layer.getRadius()));
            //console.log(latlng.lat);
            //console.log(latlng.lng);
            var type = e.layerType,
                layer = e.layer;

            if (type === 'marker') {
                layer.bindPopup('A popup!');
            }

            //drawnItems.addLayer(layer);
            L.circle(latlng, e.layer.getRadius()).addTo(map);
            console.log(latlng.lat + "," + latlng.lng + ": " + e.layer.getRadius());
            addGeoJSON(window.location.origin + "/api/RetrievePropertiesByPOI?lat=" + latlng.lat + "&lon=" + latlng.lng + "&r=" + Math.ceil(e.layer.getRadius()), map);
        });

        customLayers = {
            "Traffic Incidents": {
                layername: "TRAFFICINCIDENTS",
                interval: 1000 * 60 * 10
            },
            "Cameras": {
                layername: "CAMERAS",
                interval: 1000 * 60 * 10
            },
            "Parking Lots": {
                layername: "PARKINGLOTS",
                interval: 1000 * 60 * 10
            },
            "Polyclinics": {
                layername: "POLYCLINICS",
                interval: 1000 * 60 * 10
            },
            "Available Taxis": {
                layername: "AVAILABLETAXIS",
                interval: 1000 * 60 * 10
            },
            "Water Levels": {
                layername: "WATERLEVELS",
                interval: 1000 * 60 * 10
            },
        };
        for (layerName in customLayers) {
            shownCustomLayers[layerName] = {};
            allCustomLayers[layerName] = {};
            customLayersFeatureGroup[layerName] = L.featureGroup();
            xCustomLayers[layerName] = crossfilter();
            xCustomLayersDimension[layerName] = xCustomLayers[layerName].dimension(function(layer) {
                return layer;
            });
            (function(layerName) {
                customLayers[layerName].layer = L.realtime({
                    url: 'api/getFeaturesByLayer?q=' + customLayers[layerName].layername,
                    type: 'json'
                }, {
                    interval: customLayers[layerName].interval,
                    onEachFeature: function(feature, layer) {
                        var properties = feature.properties;
                        delete feature.properties.poly;
                        //var popupContent = "<p>" + JSON.stringify(feature.properties) + "</p>";
                        var popupContent = "<poi-display poijson='" + quoteattr(JSON.stringify(properties)) + "'></poi-display>";
                        layer.bindPopup(popupContent);
                        customLayersFeatureGroup[layerName].addLayer(layer);
                        shownCustomLayers[layerName][properties.id] = layer;
                        allCustomLayers[layerName][properties.id] = layer;
                        xCustomLayers[layerName].add([layer]);
                    },
                    pointToLayer: function(feature, latlng) {
                        return L.marker(latlng, {
                            icon: getMarkerIcon(feature.properties),
                            bounceOnAdd: true,
                            bounceOnAddOptions: {
                                duration: 500,
                                height: 100
                            }
                        });
                    }
                });
            })(layerName);

        };


        //====== traffic graph =====
        var trafficIncidentsDimension = xCustomLayers["Traffic Incidents"].dimension(function(layer) {
            switch (Number(layer.feature.properties.Type)) {
                case 0:
                    return 'Traffic Accident';
                case 1:
                    return 'Roadworks';
                case 3:
                    return 'Vehicle Breakdown';
                case 5:
                    return 'Obstacle';
                case 8:
                    return 'Heavy Traffic';
                default:
                    return 'Traffic Incident';
            }
        });

        dc.rowChart('#traffic-incidents').width(300)
            .height(240)
            .group(trafficIncidentsDimension.group())
            .dimension(trafficIncidentsDimension)
            .colors(colorbrewer.RdYlGn[9])
            //.ordinalColors(['#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#dadaeb'])
            .label(function(d) {
                return d.key;
            })
            .title(function(d) {
                return d.value;
            })
            .elasticX(true)
            .xAxis().ticks(4);
        dc.renderAll();

        var polyclinicsNumberDimension = xCustomLayers["Polyclinics"].dimension(function(layer) {
            return layer.feature.properties.name;
        });
        dc.rowChart('#polyclinics-times').width(300)
            .height(500)
            .group(polyclinicsNumberDimension.group().reduceSum(function(layer) {
                return layer.feature.properties.waitingNumber;
            }))
            .dimension(polyclinicsNumberDimension)
            .colors(d3.scale.category20())
            .label(function(d) {
                return d.key;
            })
            .title(function(d) {
                return d.value;
            })
            .elasticX(true)
            .xAxis().ticks(4);
        dc.renderAll();
        //====== endof traffic graph =====




        var trafficUrls = ["http://www.onemap.sg/arcgis/rest/services/LTATrafficDensity/MapServer/0",
            "http://www.onemap.sg/arcgis/rest/services/LTATrafficDensity/MapServer/1",
            "http://www.onemap.sg/arcgis/rest/services/LTATrafficDensity/MapServer/2",
            "http://www.onemap.sg/arcgis/rest/services/LTATrafficDensity/MapServer/3"
        ];
        var trafficLayers = [];
        var trafficFeatureGroup = L.featureGroup();
        trafficUrls.forEach(function(trafficUrl) {
            var trafficLayer = new L.esri.FeatureLayer(trafficUrl, {
                minZoom: 5,
                onEachFeature: function(feature, layer) {
                    //var popupContent = "<p>" + JSON.stringify(feature.properties) + "</p>";
                    feature.properties.LAYERNAME = "ROAD";
                    var popupContent = "<poi-display poijson='" + quoteattr(JSON.stringify(feature.properties)) + "'></poi-display>";
                    layer.bindPopup(popupContent);
                }
            });
            trafficLayer.setStyle(function(feature) {
                var color = '#84CA50';
                if (feature.properties && feature.properties.SPEED) {
                    if (feature.properties.SPEED <= 20) color = '#E60000';
                    else if (feature.properties.SPEED <= 40) color = '#F07D02';
                }
                return {
                    weight: 7,
                    color: color
                };
            });
            trafficLayer.addTo(trafficFeatureGroup);
            trafficLayers.push(trafficLayer);
        });
        trafficFeatureGroup.on('click', function(event) {
            console.log(event.layer.feature.properties.SPEED);
        }, this);
        var overlayMaps = {
            "Tweets": tweetMarkers,
            "Instagrams": instagramMarkers,
            "Traffic Feed": trafficFeatureGroup
        };
        for (layer in customLayers) {
            overlayMaps[layer] = customLayersFeatureGroup[layer]; //customLayers[layer].layer;
        }
        L.control.layers(null, overlayMaps, {
            collapsed: false
        }).addTo(main.map);


        L.control.typeahead({
            hint: true,
            highlight: true,
            minLength: 1
        }, {
            name: 'tag',
            source: function(tag, syncResults, asyncResults) {
                asyncResults([tag]);
            }
        }).addTo(main.map);
        
        L.easyButton('fa-picture-o', function(){
   var cnt = 0;
                var slideshow = $('#slideshowList').empty();
                for (var instaId in shownInstaLayers) {
                    cnt++;
                    if (cnt > 20) break;
                    if (shownInstaLayers[instaId].feature.properties.insta &&
                        shownInstaLayers[instaId].feature.properties.insta.images &&
                        shownInstaLayers[instaId].feature.properties.insta.images.standard_resolution.url) {
                        var a = $("<a class='fancybox-thumb' rel='fancybox-thumb'></a>");
                        var img = $("<img></img>");
                        img.attr("src", shownInstaLayers[instaId].feature.properties.insta.images.thumbnail.url);
                        img.attr("alt","");
                        a.attr("href", shownInstaLayers[instaId].feature.properties.insta.images.standard_resolution.url);
                        a.attr("title", shownInstaLayers[instaId].feature.properties.insta.caption.text);
                        //img.attr("alt", shownInstaLayers[instaId].feature.properties.insta.caption.text);
                        slideshow.append(a.append(img));
                    }
                }
                $("#slideshowList .fancybox-thumb").fancybox({
            		//prevEffect	: 'none',
            		//nextEffect	: 'none',
            		helpers	: {
            			title	: {
            				type: 'outside'
            			},
            			thumbs	: {
            				width	: 50,
            				height	: 50
            			}
            		}
            	});
            	$("#slideshowList .fancybox-thumb").eq(0).trigger("click");

        }).addTo(main.map);
        
    });
};

function arrToGeoJSON(arr, options) {
    var obj = GeoJSON.parse(arr, {
        Point: ['Y', 'X']
    });
    obj.crs = {
        "type": "name",
        "properties": {
            "name": "urn:ogc:def:crs:EPSG::3414"
        }
    }
    return L.Proj.geoJson(obj, options);
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function addGeoJSON(url, map) {
    console.log(url);
    getJSON(url, function(g) {
        L.geoJson(g, {
            onEachFeature: onEachFeature,
            pointToLayer: function(feature, latlng) {
                return L.marker(latlng, {
                    icon: getMarkerIcon(feature.properties)
                });
            }
        }).addTo(map);

    });
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

function onEachFeature(feature, layer) {
    var properties = feature.properties;
    delete feature.properties.poly;
    //var popupContent = "<p>" + JSON.stringify(feature.properties) + "</p>";
    var popupContent = "<poi-display poijson='" + quoteattr(JSON.stringify(properties)) + "'></poi-display>";
    layer.bindPopup(popupContent);
}


function getMarkerIcon(properties) {
    switch ((properties.LAYERNAME || "").toUpperCase()) {
        case "WIRELESS_HOTSPOTS":
        case "IP_SERVICEPROVIDERS":
            return L.AwesomeMarkers.icon({
                icon: 'wifi',
                prefix: 'fa',
                markerColor: 'green'
            });
            break;

        case "HDB":
        case "HDB_BRANCHES":
        case "":
            return L.AwesomeMarkers.icon({
                icon: 'home',
                prefix: 'fa',
                markerColor: 'lightgray'
            });
            break;

        case "GREENBUILDING":
        case "PCN_ACCESS_POINTS":
            return L.AwesomeMarkers.icon({
                icon: 'home',
                prefix: 'fa',
                markerColor: 'green'
            });
            break;

        case "NPARKS_PARKS":
        case "NATIONALPARKS":
        case "NPARKS_COMMUNITY_GARDENS":
        case "NPARKS_COMMUNITY GARDENS":
        case "NPARKS_SKYRISE GREENERY":
        case "SKYRISEGREENERY":
            return L.AwesomeMarkers.icon({
                icon: 'tree',
                prefix: 'fa',
                markerColor: 'darkgreen'
            });
            break;

        case "NParks_Heritage Trees":
        case "NParks_Heritage Roads":
        case "HERITAGETREES":
        case "HISTORICSITES":
            return L.AwesomeMarkers.icon({
                icon: 'building',
                prefix: 'fa',
                markerColor: 'red'
            });
            break;

        case "HAWKERCENTRE":
            return L.AwesomeMarkers.icon({
                icon: 'cutlery',
                prefix: 'fa',
                markerColor: 'beige'
            });
            break;

        case "HEALTHIERDINING":
        case "HEALTHIERCATERERS":
            return L.AwesomeMarkers.icon({
                icon: 'cutlery',
                prefix: 'fa',
                markerColor: 'lightgreen'
            });
            break;

        case "REGISTERED_PHARMACY":
        case "MOH_CHAS_CLINICS":
        case "BREASTSCREEN":
        case "BLOOD_BANK":
            return L.AwesomeMarkers.icon({
                icon: 'medkit',
                prefix: 'fa',
                markerColor: 'orange'
            });
            break;

        case "EXERCISEFACILITIES":
        case "SSC_SPORTS_FACILITIES":
        case "PLAYSG":
        case "RELAXSG":
        case "DUS_SCHOOL_SPORTS_FACILITIES":
        case "HSGB_NAPFA":
            return L.AwesomeMarkers.icon({
                icon: 'support',
                prefix: 'fa',
                markerColor: 'blue'
            });
            break;

        case "HSGB_SAFRA":
        case "HSGB_IPPT":
            return L.AwesomeMarkers.icon({
                icon: 'soccer-ball-o',
                prefix: 'fa',
                markerColor: 'blue'
            });
            break;

        case "DISABILITY":
        case "VOLUNTARYWELFAREORGS":
        case "ELDERCARE":
        case "RESIDENTSCOMMITTEE":
        case "CONSTITUENCYOFFICES":
        case "SSO":
        case "COMMMEDIATIONCTR":
            return L.AwesomeMarkers.icon({
                icon: 'heart',
                prefix: 'fa',
                markerColor: 'purple'
            });
            break;

        case "AXS_QUICKBILL":
        case "AXS_EXPRESS_TOPUP":
        case "AXS_STATION":
        case "SAM_LOCATIONS":
            return L.AwesomeMarkers.icon({
                icon: 'dollar',
                prefix: 'fa',
                markerColor: 'cadetblue'
            });
            break;

        case "SPF_DTRLS":
        case "SPF_ESTABLISHMENTS":
        case "SPF_DSECS":
            return L.AwesomeMarkers.icon({
                icon: 'tachometer',
                prefix: 'fa',
                markerColor: 'red'
            });
            break;

        case "ABCWATERSPROJ":
        case "NEAOFFICES":
            return L.AwesomeMarkers.icon({
                icon: 'tint',
                prefix: 'fa',
                markerColor: 'darkred'
            });
            break;

        case "EWASTE":
        case "CASHFORTRASH":
        case "SECONDHANDCOLLECN":
        case "RECYCLINGBINS":
            return L.AwesomeMarkers.icon({
                icon: 'recycle',
                prefix: 'fa',
                markerColor: 'green'
            });
            break;

        case "KINDERGARTENS":
        case "CPE_PEI_PREMISES":
        case "PRIVATE EDUCATION INSTITUTIONS":
        case "WDASERVICEPOINTS":
            return L.AwesomeMarkers.icon({
                icon: 'institution',
                prefix: 'fa',
                markerColor: 'pink'
            });
            break;

        case "FUNERALPARLOURS":
        case "QUITCENTRES":
            return L.AwesomeMarkers.icon({
                icon: 'heartbeat',
                prefix: 'fa',
                markerColor: 'black'
            });
            break;

        case "FIRESTATION":
        case "FIREPOST":
            return L.AwesomeMarkers.icon({
                icon: 'fire-extinguisher',
                prefix: 'fa',
                markerColor: 'darkred'
            });
            break;

        case "STREETSANDPLACES":
        case "MONUMENTS":
        case "MUSEUM":
        case "TOURISM":
        case "BFABUILDINGS":
            return L.AwesomeMarkers.icon({
                icon: 'street-view',
                prefix: 'fa',
                markerColor: 'darkblue'
            });
            break;

        case "HOTELS":
            return L.AwesomeMarkers.icon({
                icon: 'bed',
                prefix: 'fa',
                markerColor: 'lightred'
            });
            break;

        case "CHILDCARE":
        case "STUDENTCARE":
        case "SILVERINFOCOMM":
        case "INFOCOMMACCESS":
        case "CETCENTRES":
            return L.AwesomeMarkers.icon({
                icon: 'user',
                prefix: 'fa',
                markerColor: 'lightblue'
            });
            break;

        case "COMMUNITYCLUBS":
        case "FAMILY":
            return L.AwesomeMarkers.icon({
                icon: 'users',
                prefix: 'fa',
                markerColor: 'lightblue'
            });
            break;

        case "LIBRARIES":
            return L.AwesomeMarkers.icon({
                icon: 'book',
                prefix: 'fa',
                markerColor: 'green'
            });
            break;

        case 'TRAFFICINCIDENTS':
            /* type 0: accident
                 type 1: roadworks
                 type 3: vehicle breakdown
                 type 5: obstacle
                 type 8: heavy traffic
              */
            switch (Number(properties.Type)) {
                case 0:
                    return L.AwesomeMarkers.icon({
                        icon: 'ambulance',
                        prefix: 'fa',
                        markerColor: 'red'
                    });
                case 1:
                    return L.AwesomeMarkers.icon({
                        icon: 'wrench',
                        prefix: 'fa',
                        markerColor: 'orange'
                    });
                case 3:
                    return L.AwesomeMarkers.icon({
                        icon: 'car',
                        prefix: 'fa',
                        markerColor: 'red'
                    });
                case 5:
                    return L.AwesomeMarkers.icon({
                        icon: 'ban',
                        prefix: 'fa',
                        markerColor: 'red'
                    });
                default:
                    return L.AwesomeMarkers.icon({
                        icon: 'warning',
                        prefix: 'fa',
                        markerColor: 'orange'
                    });
            }

        case 'CAMERAS':
            return L.AwesomeMarkers.icon({
                icon: 'camera',
                prefix: 'fa',
                markerColor: 'blue'
            });

        case 'POLYCLINICS':
            return L.AwesomeMarkers.icon({
                icon: 'hospital-o',
                prefix: 'fa',
                markerColor: (function(waitingTime) {
                    if (waitingTime <= 15) return "green";
                    else if (waitingTime >= 20 && waitingTime <= 30) return "darkgreen";
                    else if (waitingTime >= 30 && waitingTime <= 60) return "orange";
                    else if (waitingTime >= 60 && waitingTime <= 120) return "red";
                    else return "darkred";
                })(properties.waitingTime)
            });
        case 'AVAILABLETAXIS':
            return L.AwesomeMarkers.icon({
                icon: 'taxi',
                prefix: 'fa',
                markerColor: 'green'
            });
        default:
            return L.AwesomeMarkers.icon({
                icon: 'circle',
                prefix: 'fa',
                markerColor: 'blue'
            });
            break;

    }
}


function getColor(d) {
    return d > 1000 ? '#800026' :
        d > 500 ? '#BD0026' :
        d > 200 ? '#E31A1C' :
        d > 100 ? '#FC4E2A' :
        d > 50 ? '#FD8D3C' :
        d > 20 ? '#FEB24C' :
        d > 10 ? '#FED976' :
        '#FFEDA0';
}
