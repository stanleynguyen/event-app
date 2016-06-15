var fbStrat = require("passport-facebook").Strategy;

var auth = require("./auth");

var User = require("../app/models/user");
var UserData = require("../app/models/userdata");

module.exports = function(passport){
    passport.serializeUser(function(user, done){
        done(null, user.id);
    });
    
    passport.deserializeUser(function(id, done){
        User.findById(id, function(err, user){
            done(err, user);
        });
    });
    
    passport.use(new fbStrat(auth.facebook, function(token, refreshToken, profile, done){
        process.nextTick(function(){
            User.findOne({'facebookID': profile.id}, function(err, user){
                if(err) return done(err);
                if(user){
                    return done(null, user);
                }else{
                    var newUserData = new UserData(); 
                    newUserData.facebookID = profile.id;
                    newUserData.name = profile.displayName;
                    newUserData.facebookProfile = profile.profileUrl;
                    newUserData.picture = 'http://graph.facebook.com/'+profile.id+'/picture?type=large';
                    newUserData.places = [];
                    newUserData.bookmarks = [];
                    newUserData.chats = {};
                    newUserData.save(function(err){
                       if(err) throw err;
                    });
                    
                    var newUser = new User();
                    newUser.facebookID = profile.id;
                    newUser.name = profile.displayName;
                    newUser.save(function(err){
                        if(err) throw err;
                        return done(null, newUser);
                    });
                }
            });
        });
    }));
};