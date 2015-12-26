var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var Geolocation = new Schema({ 
    lat: { type: Number, required: true},
    lon: { type: Number, required: true},
    address: { type: String, required: true}
});
Geolocation.index({'lat' : 1, 'lon' : 1}, {unique : true});
mongoose.model('Geolocation', Geolocation);