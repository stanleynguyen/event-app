var mongoose = require("mongoose");

var userDataSchema = new mongoose.Schema({
    facebookID: String,
    name: String,
    picture: String,
    facebookProfile: String,
    places: Array,
    bookmarks: Array,
    chats: Object
});

module.exports = mongoose.model('UserData', userDataSchema);