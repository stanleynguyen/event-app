var mongoose = require("mongoose");
var userData = require('./userdata');

var userSchema = new mongoose.Schema({
    facebookID: String,
    name: String
});

userSchema.methods.getUnread = function(){
    var _this = this;
    return new Promise(function(resolve, reject){
        var anObject = {id: _this.facebookID, unread: 0};
        userData.findOne({facebookID: _this.facebookID}, 'chats', function(err, data){
            if(err) throw err;
            for(var key in data.chats){
                if(data.chats[key]==='unread') anObject.unread++;
            }
            resolve(anObject);
        });
    });
};

userSchema.methods.beenHereBefore = function(place, object){
    return new Promise(function(resolve, reject){
    userData.findOne({facebookID: object.id}, 'places bookmarks', function(err, data){
       if(err) throw err;
       if(data.places.indexOf(place)===-1){
           object.been = false;
       }else{
           object.been = true;
       }
       if(data.bookmarks.indexOf(place)===-1){
           object.book = false;
       }else{
           object.book = true;
       }
       resolve(object);
    });
    });
};

module.exports = mongoose.model('User', userSchema);