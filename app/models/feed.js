var mongoose = require("mongoose");

var feedSchema = new mongoose.Schema({
    who: String,
    action: String,
    when: String,
    where: String
});

module.exports = mongoose.model('Feed', feedSchema);