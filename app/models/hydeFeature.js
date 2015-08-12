var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var GeoJSON = require('mongoose-geojson-schema');
    Schema = mongoose.Schema;
var HydeFeatureSchema = new Schema({
  id        : { type: "String" },
  'type'    : { type: String, default: "Feature"},
  geometry  : GeoJSON.Geometry,
  properties: {type: "Object"},
  'properties.LAYERNAME': {type: String},
  'properties.X': {type: Number},
  'properties.Y': {type: Number},
  'properties.XY': {type: String}
});
HydeFeatureSchema.index({'properties.LAYERNAME' : 1, 'properties.X' : 1, 'properties.Y' : 1, 'properties.XY': 1}, {unique : true});
HydeFeatureSchema.index({'geometry': '2dsphere'});


mongoose.model('HydeFeature', HydeFeatureSchema);