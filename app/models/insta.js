var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var Insta = new Schema({ 
    id: { type: String, unique : true, required: true} 
}, {strict: false});

mongoose.model('Insta', Insta);