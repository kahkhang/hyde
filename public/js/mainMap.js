var southWest = L.latLng(1.14524843839316, 103.57978820800781);
var northEast = L.latLng(1.5118179484245533, 104.16549682617188);
var bounds = L.latLngBounds(southWest, northEast);
var fullBounds = L.latLngBounds(L.latLng(1.24005, 103.60071), 
                                L.latLng(1.48027, 104.03685));

var crs = new L.Proj.CRS("EPSG:3414","+proj=tmerc +lat_0=1.366666666666667 +lon_0=103.8333333333333 +k=1 +x_0=28001.642 +y_0=38744.572 +ellps=WGS84 +units=m +no_defs", {
  origin: [-5878011.89743302, 10172511.897433],
  resolutions: [76.4372195411057,38.2186097705529,19.1093048852764,9.55465244263822,4.77732622131911,2.38866311065955,1.19433155532978,0.597165777664889,0.298450596901194]
});


proj4.defs("urn:ogc:def:crs:EPSG::3414","+proj=tmerc +lat_0=1.366666666666667 +lon_0=103.8333333333333 +k=1 +x_0=28001.642 +y_0=38744.572 +ellps=WGS84 +units=m +no_defs");

function loadMainMap(lat, long, id) {
  	var oneMap = L.esri.tiledMapLayer('http://t1.onemap.sg/ArcGIS/rest/services/basemap/MapServer', {
  	  maxZoom: 8,
  	  minZoom: 0,
  	  continuousWorld: true,
  	  attributionControl: false
  	});
  	
  	var lotMap = L.esri.tiledMapLayer('http://t1.onemap.sg/ArcGIS/rest/services/LOT_VIEW/MapServer', {
  	  maxZoom: 8,
  	  minZoom: 0,
  	  continuousWorld: true,
  	  attributionControl: false
  	});
    
  
    var map = L.map(id, {
        layers: [oneMap],
		    crs: crs,
        contextmenu: true,
        contextmenuWidth: 140,
        contextmenuItems: [{
          text: 'Show coordinates',
          callback: showCoordinates
        }, {
          text: 'Center map here',
          callback: function(e) {
          	console.log(e);
          	if(!currentMarker)
            	map.fitBounds(L.latLngBounds(e.latlng, e.latlng), {maxZoom: 5});
            else map.fitBounds(L.latLngBounds(currentMarker.getLatLng(), currentMarker.getLatLng()), {maxZoom: 5});
            //mainMap.map.zoomIn();
          }
        },{
          text: 'Full view',
          callback: function(e) {
            map.fitBounds(fullBounds);
          }
        },
        '-', {
          text: 'Zoom in',
          icon: 'img/zoom-in.png',
          callback: zoomIn
        }, {
          text: 'Zoom out',
          icon: 'img/zoom-out.png',
          callback: zoomOut
        }],
        attributionControl: false
	}).fitBounds(fullBounds);




	//map.addLayer(lyrWMSMapSynq);
	

	
	
	
	//L.control.layers({"OneMap": oneMap, "SLA Lots Map" : lotMap}).addTo(map);

	
	//marker selected on right click
  var currentMarker;
  var marker = L.marker([1.2801816, 103.81509159999996]);
	
	//=== Functions ===
	function drawCircle(){
      new L.Draw.Circle(map, drawControl.options.circle).enable();
    }
    
    
    function showCoordinates (e) {
        alert(e.latlng);
    }
    
    function centerMap (e) {
        map.panTo(e.latlng);
    }
    
    function zoomIn (e) {
       map.zoomIn();
    }
    
    function zoomOut (e) {
        map.zoomOut();
    }
    
    //=== Init main map ===
	map.on('contextmenu.show', function (event) {
         currentMarker = event.relatedTarget;
         //console.log(currentMarker);
         // do something with your marker
	});
	map.setMaxBounds(bounds);
	marker.on('click', onMarkerClick);
	
	

	var drawControl = new L.Control.Draw({
		draw: {
			circle: {
				shapeOptions: {
					color: '#662d91'
				}
			},
			marker: false
		}
	});
	map.addControl(drawControl);
	

	
	document.querySelector(".leaflet-draw.leaflet-control").style.display = 'none';
	
	var miniMapLayer = L.esri.tiledMapLayer('http://t1.onemap.sg/ArcGIS/rest/services/basemap/MapServer', {
	  maxZoom: 8,
	  minZoom: 0,
	  continuousWorld: true,
	  attributionControl: false
	});
	var miniMap = new L.Control.MiniMap(miniMapLayer, { 
		autoToggleDisplay: true, 
		
	}).addTo(map);
	
	return {
		map: map,
		drawControl: drawControl,
		miniMap: miniMap,
		drawCircle: drawCircle
	};
}


function loadDistanceMap(lat, long, id){
	console.log("load map!");
    var bounds = L.latLngBounds(southWest, northEast);
	var map = L.map(id).setMaxBounds(bounds).setView(new L.LatLng(lat, long), 15);
	var oneMap = L.tileLayer('http://e1.onemap.sg/arcgis/rest/services/SM256WGS84/MapServer/tile/{z}/{y}/{x}', {
	    maxBounds: bounds,
		maxZoom: 19,
	    minZoom: 12
	}).addTo(map);
	
	// Static markers: i.e. KK house, Daryl hosue etc
	var marker = L.marker([lat, long]).addTo(map);
	map.dragging.disable();
	map.touchZoom.disable();
	map.doubleClickZoom.disable();
	map.scrollWheelZoom.disable();

	//console.log([lat, long]);
	return {
		map: map
	};
}


function dialogHandler(e) {
  var menuItem = e.target;
  
  if (!menuItem.hasAttribute('data-dialog')) {
      var menuItemChild = menuItem.firstElementChild;
      
      if (menuItemChild != null) {
            if (!menuItemChild.hasAttribute('data-dialog')) {
                return;
            }
      } else {
          return;
      }
      
  }
  var id = menuItem.getAttribute('data-dialog') ||
        menuItemChild.getAttribute('data-dialog');
  var dialog = document.getElementById(id);
  if (dialog) {
    dialog.open();
  }
}

var onMarkerClick = (function() {
  var pushpinMap = null;
  
  return function (e){
    var latLong = this.getLatLng();
    //console.log("Lat: " + latLong.lat + " Long: " + latLong.lng);
    var dialog = document.getElementById("pushpin");
    if (pushpinMap) pushpinMap.remove();
    //console.log("add pushpinMap");
    pushpinMap = loadDistanceMap(latLong.lat, latLong.lng, 'map-sidebar').map;
    setTimeout(function() {
    	pushpinMap.invalidateSize();
  	}, 10);
    dialog.open();
  };
})();

function quoteattr(s, preserveCR) {
    preserveCR = preserveCR ? '&#13;' : '\n';
    return ('' + s) /* Forces the conversion to string. */
        .replace(/&/g, '&amp;') /* This MUST be the 1st replacement. */
        .replace(/'/g, '&apos;') /* The 4 other predefined entities, required. */
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        /*
        You may add other replacements here for HTML only 
        (but it's not necessary).
        Or for XML, only if the named entities are defined in its DTD.
        */ 
        .replace(/\r\n/g, preserveCR) /* Must be before the next replacement. */
        .replace(/[\r\n]/g, preserveCR);
        ;
}
function unquoteattr(s) {
    s = ('' + s); /* Forces the conversion to string type. */
    s = s
        .replace(/\r\n/g, '\n') /* To do before the next replacement. */ 
        .replace(/[\r\n]/, '\n')
        .replace(/&#13;&#10;/g, '\n') /* These 3 replacements keep whitespaces. */
        .replace(/&#1[03];/g, '\n')
        .replace(/&#9;/g, '\t')
        .replace(/&gt;/g, '>') /* The 4 other predefined entities required. */
        .replace(/&lt;/g, '<')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        ;
     /* This MUST be the last replacement. */
    s = s.replace(/&amp;/g, '&');
    return s;
}