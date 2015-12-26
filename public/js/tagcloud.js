// Takes in JSON output of GET request for twitter trends 
function generateWordCloud() {
    var twitterTrends;  //How to get JSON output from twitter trends API call?
    
    var trendsArray = []
    var trends = twitterTrends.trends;
    
    for (var i=0; i<trends.length; i++) {
        trendsArray.push(trends.name);
    }
    
    return trendsArray;
}

// Generate word cloud based on twitter trends 
function generateWordCloud(trendsArray) {
    var wordString = formatString(trendsArray);
    var cloud = $("#tagcloud");
    cloud.innerHTML = wordString;
    console.log(cloud);
    
    // returns size 
    function wordSize(weight) {
        var length = trendsArray.length;
        
        var size = (length-weight) * 5;
        
        return size;
    }
    
    var i=0;
    [].forEach.call( cloud.querySelectorAll('span'), function(elem) {
            elem.style.fontSize = wordSize(i) + '%';
            elem.style.color = tagColor();
            i++;
    });
}

function formatString(trendsArray) {
    var string = "";
    
    for (var i=0; i<trendsArray.length; i++) {
        string += "<span>" + trendsArray[i] + "</span>";
    }
    
    return string;
}

// return random colour
function tagColor() {
    var color = 'hsl('+ Math.random()*360 +', 40%, 50%)';

    return color;
}
