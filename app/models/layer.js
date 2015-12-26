var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var LayerSchema = new Schema({
    "LAYERNAME": String,
    "custom": {type: Boolean, default: false},
    "lastUpdated": {type: Date, default: new Date(-8640000000000000)},
    "interval": {type: Number, default: 1000 * 60 * 60 * 24}
}, {strict: false});
LayerSchema.index({'LAYERNAME' : 1}, {unique : true, required: true});


mongoose.model('Layer', LayerSchema);