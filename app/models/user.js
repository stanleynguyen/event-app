var mongoose = require("mongoose");

var userSchema = new mongoose.Schema({
    facebookID: String,
    email: String,
    name: String,
    picture: String,
    profile: String,
    places: Array,
    chats: Object
});

module.exports = mongoose.model('User', userSchema);