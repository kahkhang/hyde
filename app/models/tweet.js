var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var Tweet = new Schema({ 
    id: { type: Number, unique : true, required: true} 
}, {strict: false});

//Tweet.index({'id' : 1}, {unique : true, required: true});
mongoose.model('Tweet', Tweet);