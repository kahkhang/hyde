var currentWordCloud = {};
var myWordCloud;
var waterGauge;

function interpColor(color1, color2, ratio) {
   var hex = function(x) {
       x = x.toString(16);
       return (x.length == 1) ? '0' + x : x;
   };
   color1 = color1.substring(1);
   color2 = color2.substring(1);
   var r = Math.ceil(parseInt(color1.substring(0, 2), 16) * ratio + parseInt(color2.substring(0, 2), 16) * (1 - ratio));
   var g = Math.ceil(parseInt(color1.substring(2, 4), 16) * ratio + parseInt(color2.substring(2, 4), 16) * (1 - ratio));
   var b = Math.ceil(parseInt(color1.substring(4, 6), 16) * ratio + parseInt(color2.substring(4, 6), 16) * (1 - ratio));
   var middle = '#' + hex(r) + hex(g) + hex(b);
   return middle;
}
function getWordCloudColor(d) {
   if (isSelected[d.text]) return interpColor('#b20000', '#ff0000', d.score);
   return interpColor('#888888', '#eeeeee', d.score);
}
function updateWordCloudColors() {
    d3.select('#tag-cloud').select('svg').selectAll('g text').style('fill', getWordCloudColor);
}
function wordCloud(selector) {
   var WIDTH = 270;
   var HEIGHT = 235;
   var fill = d3.scale.category20b();
   //Construct the word cloud's SVG element
   var svg = d3.select(selector).append("svg")
       .attr('width', WIDTH)
       .attr('height', HEIGHT)
       .append("g")
       .attr("transform", 'translate(' + WIDTH / 2 + ',' + HEIGHT / 2 + ')');

   //Draw the word cloud
   function draw(words) {
       var cloud = svg.selectAll("g text")
           .data(words, function(d) {
               return d.text;
           })

       //Entering words
       cloud.enter()
           .append("text")
           .style("font-family", "Impact")
           .style("fill", getWordCloudColor)
           .attr("text-anchor", "middle")
           .attr('font-size', 1)
           .text(function(d) {
               return d.text;
           })
           .on('click', function(d, i) {
               isSelected[d.text] = !isSelected[d.text];
               if(isSelected[d.text]){
                   $("#tagsInput").tagsinput('add', d.text);
               }
               else $("#tagsInput").tagsinput('remove', d.text);
               //reloadLayers();
               updateWordCloudColors();
               
               //d3.select(this).style('fill', getColor(d));
           });

       //Entering and existing words
       cloud
           .transition()
           .duration(600)
           .style("font-size", function(d) {
               return d.size + "px";
           })
           .attr("transform", function(d) {
               return "translate(" + [d.x, d.y] + ") rotate(" + d.rotate + ")";
           })
           .style("fill-opacity", 1);

       //Exiting words
       cloud.exit()
           .transition()
           .duration(200)
           .style('fill-opacity', 1e-6)
           .attr('font-size', 1)
           .remove();
   }


   //Use the module pattern to encapsulate the visualisation code. We'll
   // expose only the parts that need to be public.
   return {

       //Recompute the word cloud for a new set of words. This method will
       // asycnhronously call draw when the layout has been computed.
       //The outside world will need to call this function, so make it part
       // of the wordCloud return value.
       update: function(words) {
           d3.layout.cloud().size([WIDTH, HEIGHT])
               .words(words)
               .spiral('archimedean')
               .rotate(function() {
                   return -60 + Math.random() * 120;
               })
               .font("Impact")
               .fontSize(function(d) {
                   return 8 + d.score * 32;
               })
               .on("end", draw)
               .start();
       }
   }

}



//Prepare one of the sample sentences by removing punctuation,
// creating an array of words and computing a random size attribute.
function getWords(wordCloud) {
   var maxFreq = 0;
   var words = [];
   for (var keyword in wordCloud.wordcloud) {
       words.push({
           frequency: wordCloud.wordcloud[keyword],
           text: keyword
       });
   }
   words.sort(function(a, b) {
       return b.frequency - a.frequency;
   });
   words = words.slice(0, 50);
   // Remove all selected words that do not exist in this cloud
/*   for (var word in isSelected) {
       for (var i = 0; i < words.length; ++i)
           if (words[i].text === word) {
               delete isSelected[word];
               break;
           }
   }*/
   return words
       .map(function(d) {
           maxFreq = Math.max(maxFreq, d.frequency);
           return d;
       }).map(function(d) {
           d.score = d.frequency / maxFreq;
           return d;
       });
}

function reloadWordCloud() {
   d3.select('#tag-cloud').select("svg").remove();
   myWordCloud = wordCloud('#tag-cloud');
   currentWordCloud = getWordCloud();
   myWordCloud.update(getWords(currentWordCloud));
}
//This method tells the word cloud to redraw with a new set of words.
//In reality the new words would probably come from a server request,
// user input or some other source.
function showNewWords() {
   reloadWordCloud();
   setTimeout(function() {
       showNewWords();

   }, 1000 * 10);
}

function drawGraph(selector, valF) {
   var limit = 15 * 1,
       duration = 350,
       now = new Date(Date.now() - duration)

   var width = 250,
       height = 200

   var groups = {
       current: {
           value: 0,
           color: 'orange',
           data: d3.range(limit).map(function() {
               return 0
           })
       }
   }

   var x = d3.time.scale()
       .domain([now - (limit - 2), now - duration])
       .range([0, width])

   var y = d3.scale.linear()
       .domain([0, 100])
       .range([height, 0])

   var line = d3.svg.line()
       .interpolate('basis')
       .x(function(d, i) {
           return x(now - (limit - 1 - i) * duration)
       })
       .y(function(d) {
           return y(d)
       })

   var svg = d3.select(selector).append('svg')
       .attr('class', 'chart')
       .attr('width', width)
       .attr('height', height + 40)

   var axis = svg.append('g')
       .attr('class', 'axis')
       .attr('transform', 'translate(35,' + (height + 15) + ')')
       .call(x.axis = d3.svg.axis().scale(x).orient('bottom'))

   
   var paths = svg.append('g');

   for (var name in groups) {
       var group = groups[name];
       group.path = paths.append('path')
           .data([group.data])
           .attr('class', name + ' group')
           .style('stroke', group.color)
           .style('stroke-weight', '1px')
           .style('fill', 'none')
           .attr('transform', 'translate(35, 15)') //WRONG, UNSCRUPULOUS
   }
   
   var yrect = svg.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', 35)
    .attr('height', height + 40)
    .style('fill', '#fff');
   
    var yaxis = svg.append('g')
       .attr('class', 'axis')
       .attr('transform', 'translate(35, 15)')
       .style('background-color', '#ffffff')
       .call(y.axis = d3.svg.axis().scale(y).orient('left'))

   var mx = 0;
   var mn = 0;

   function tick() {
       now = new Date()

       // Add new values
       for (var name in groups) {
           var group = groups[name];
           var val = valF();
           mx = Math.max(val, mx);
           mn = Math.min(val, mn);
           group.data.push(val);
           group.path.attr('d', line)
       }

       // Shift domain
       x.domain([now - (limit - 2) * duration, now - duration])

       // Slide x-axis left
       axis.transition()
           .duration(duration)
           .ease('linear')
           .call(x.axis)

       y.domain([mn, mx]);

       yaxis.transition()
           .duration(duration)
           .ease('linear')
           .call(y.axis)

       // Slide paths left
       paths.attr('transform', null)
           .transition()
           .duration(duration)
           .ease('linear')
           .attr('transform', 'translate(' + x(now - (limit - 1) * duration) + ')')
           .each('end', tick)

       // Remove oldest data point from each group
       for (var name in groups) {
           var group = groups[name]
           group.data.shift()
       }
   }

   tick();
}

function drawBar(selector, valF) {
   var width = 230,
       height = 200
   $(selector).empty();
   var data = valF()

   var x = d3.scale.ordinal()
       .rangeRoundBands([0, width], .1)

   var y = d3.scale.linear()
       .range([height, 0])

   var xAxis = d3.svg.axis()
       //.attr('transform', 'translate(30,0)')
       .scale(x)
       .orient("bottom");

   var yAxis = d3.svg.axis()
       .scale(y)
       .orient("left")
       .ticks(10, "%");

   var svg = d3.select(selector).append("svg")
       .attr('width', width)
       .attr('height', height + 40)
       .append("g")
       .attr('transform', 'translate(0,15)')

   function tick() {

       data = valF();

       x.domain(data.map(function(d) {
           return d.text;
       }));
       y.domain([0, 1.05 * d3.max(data, function(d) {
           return d.count;
       })]);

       svg.append("g")
           .attr("class", "axis")
           .attr("transform", "translate(5," + height + ")")
           .call(xAxis);

       svg.append("g")
           .attr("class", "axis")
           .call(yAxis)
           .append("text")
           .attr("transform", "rotate(-90)")
           .attr("y", 1)
           .attr("dy", ".71em")
           .style("text-anchor", "end");

       svg.selectAll(".bar")
           .data(valF())
           .enter().append("rect")
           .attr("class", "bar")
           .attr("x", function(d) {
               return x(d.text);
           })
           .attr("width", x.rangeBand())
           .attr("y", function(d) {
               return y(d.count);
           })
           .attr("height", function(d) {
               return height - y(d.count);
           })
           .style('fill', function(d) {
               return d.color;
           })
           .on('mouseover', function(d) {
               d3.select(this).style({
                   opacity: '0.5'
               })
           })
           .on('mouseout', function(d) {
               d3.select(this).style({
                   opacity: '1'
               })
           })

       svg.selectAll(".text")
           .data(valF()).enter().append("text")
           .attr("x", function(d) {
               return x(d.text) + x.rangeBand() / 2 - 4;
           })
           .attr("y", function(d) {
               return y(d.count) - 13;
           })
           .attr("dy", ".75em")
           .text(function(d) {
               return d.count;
           })
           .style('font', '12px bold')

   }

   tick();
}

function drawFillGauge(selector, value) {
   var config1 = liquidFillGaugeDefaultSettings();
   config1.circleColor = "#6495ed";
   config1.textColor = "#000080";
   config1.waveTextColor = "#000080";
   config1.waveColor = "#4682b4";
   config1.circleThickness = 0.08;
   config1.textVertPosition = 0.2;
   config1.waveAnimateTime = 800;
   config1.maxValue = 1.00;
   config1.valueCountUp = false;
   config1.displayPercent = true; //Actually it's mm

   //Function found in liquidfill.js
   return loadLiquidFillGauge(selector, value, config1);

}

function getWaterLevel() {
   var layerId, sum = 0,
       cnt = 0;
   for (layerId in shownCustomLayers['Water Levels']) {
       sum += shownCustomLayers['Water Levels'][layerId].feature.properties.WLV;
       cnt++;
   }
   if (!cnt) return 0;
   return sum / cnt;
}

function updateGauge() {
   var waterLevel = getWaterLevel();
   waterGauge.update(waterLevel);
   
   setTimeout(function() {
       updateGauge();
   }, 1000 * 2);
}

function trafficAccidents() {
   var arr = [],
       arrHash = {};
   var i = 0;
   for (var layerId in shownCustomLayers['Traffic Incidents']) {
       var type = shownCustomLayers['Traffic Incidents'][layerId].feature.properties.type;
       var color = getTrafficColor(type);
       arrHash[color] = arrHash[color] || {
           color: getTrafficColor(type),
           text: getTrafficCats(type),
           val: arrHash[color] + 1 || 0,
           count: i
       };
       arrHash[color].count++;
       i++;
   }

   for (color in arrHash) {
       arr.push(arrHash[color]);
   }

   arr.sort(function(a, b) {
       return a.val - b.val;
   });

   return arr;
}

function getTrafficColor(incidentType) {
   /* type 0: accident
        type 1: roadworks
        type 3: vehicle breakdown
        type 5: obstacle
        type 8: heavy traffic
     */
   switch (Number(incidentType)) {
       case 0:
           return 'red';
           break;
       case 1:
           return 'orange';
           break;
       case 3:
           return 'darkgray';
           break;
       case 5:
           return 'blue';
           break;
       case 8:
           return 'darkgreen';
           break;
       default:
           return 'darkgray';
           break;
   }
}

function getTrafficCats(incidentType) {
   /* type 0: accident
        type 1: roadworks
        type 3: vehicle breakdown
        type 5: obstacle
        type 8: heavy traffic
     */
   switch (Number(incidentType)) {
       case 0:
           return 'Accident';
           break;
       case 1:
           return 'Roadworks';
           break;
       case 3:
           return 'Vehicle Breakdown';
           break;
       case 5:
           return 'Obstacle';
           break;
       case 8:
           return 'Heavy Traffic';
           break;
       default:
           return 'Obstacle';
           break;
   }
}
