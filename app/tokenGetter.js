var request = require('request');
var mongoose = require('mongoose');
var Token = mongoose.model('Token');

var _MS_PER_MIN = 1000 * 60;

// a and b are javascript Date objects
function dateDiffInMinutes(a, b) {
  // Discard the time and time-zone information.
  var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return (utc2 - utc1) / _MS_PER_MIN;
}

module.exports.getOneMapToken = function (appName, callback){
  var tokenURL = getTokenURL(appName); //"http://www.onemap.sg/API/services.svc/getToken?accessKEY=M+T5HzxP4kATXLBw/+iHicv6BE2166Wi3lzZy/NHkznPryWKDKLQavtd+qj5vyYKL8yV0vjTYMLw+IvgiUppwaaPvMdp7MxZi4S9sZopxb5by6KkYZfZYA==|mv73ZvjFcSo=";
  Token.findOne({app: appName}, "token timeStamp", function (err, result){
    /*console.log("retrieved: " + result);
    console.log(tokenURL);
    console.log((new Date()));
    console.log(result.timeStamp);
    console.log(typeof new Date(result.timeStamp));
    var timeDiff = (new Date()).getTime() - result.timeStamp.getTime();
    console.log("diff: " + dateDiffInMinutes(result.timeStamp,new Date()));
    console.log(1000*60*60*12);*/

    if(err) return callback("");
    if(!result || dateDiffInMinutes(result.timeStamp,new Date()) > 60*12){
      request(tokenURL, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          var newToken = tokenFromObj(appName, JSON.parse(body));
          //console.log(newToken);
          if(newToken){
            Token.findOneAndUpdate({app: appName}, 
                                   {token: newToken,
                                    timeStamp: new Date()
                                   }, 
                                   {upsert: true}, 
                                   function (err, tokenRecord){
                                      if(err) return "";
                                      //console.log("updated OneMap token: " + tokenRecord.token);
                                      return callback(tokenRecord.token); 
                                   });
          }
          else return callback("");
        }
      });
    }
    else return callback(result.token); 
  });
}

var tokenFromObj = function(appName, tokenObj){
  if(appName == "OneMap"){
    if(tokenObj.GetToken && tokenObj.GetToken[0] && tokenObj.GetToken[0].NewToken) return tokenObj.GetToken[0].NewToken;
  }
  else if(appName == "imap"){
    if(tokenObj.Token) return tokenObj.Token;
  }
  
  return "";
}

var getTokenURL = function(appName){
  if(appName == "OneMap") return "http://www.onemap.sg/API/services.svc/getToken?accessKEY=M+T5HzxP4kATXLBw/+iHicv6BE2166Wi3lzZy/NHkznPryWKDKLQavtd+qj5vyYKL8yV0vjTYMLw+IvgiUppwaaPvMdp7MxZi4S9sZopxb5by6KkYZfZYA==|mv73ZvjFcSo=";
  else if(appName == "imap") return "https://www.onemap.sg/imap/portalAssets/prtoken.edb";
}