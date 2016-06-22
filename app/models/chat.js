var mongoose = require("mongoose");

var chatSchema = new mongoose.Schema({
    who: Array,
    messages: Array
});

module.exports = mongoose.model('Chat', chatSchema);