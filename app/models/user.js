var mongoose = require("mongoose");
var userData = require('./userdata');

var userSchema = new mongoose.Schema({
    facebookID: String,
    name: String
});

userSchema.methods.getUnread = function(){
    var _this = this;
    return new Promise(function(resolve, reject){
        var result = 0;
        userData.findOne({facebookID: _this.facebookID}, 'chats', function(err, data){
            if(err) throw err;
            console.log(data);
            for(var key in data.chats){
                if(data.chats[key]==='unread') result++;
            }
            resolve(result);
        });
    });
};

userSchema.methods.beenHereBefore = function(place){
    userData.findOne({facebookID: this.facebookID}, function(err, data){
       if(err) throw err;
       if(data.places.indexOf(place)===-1){
           return false;
       }else{
           return true;
       }
    });
};

module.exports = mongoose.model('User', userSchema);