var fbStrat = require("passport-facebook").Strategy;

var auth = require("./auth");

var User = require("../app/models/user");

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
                    return done(null, user, profile);
                }else{
                    var newUser = new User();
                    newUser.facebookID = profile.id;
                    newUser.email = profile.emails[0].value;
                    newUser.name = profile.displayName;
                    newUser.picture = 'http://graph.facebook.com/'+profile.id+'/picture?type=large';
                    newUser.places = ['ok'];
                    newUser.chats = {'iniChat': 'read'};
                    newUser.save(function(err){
                        if(err) throw err;
                        return done(null, newUser, profile);
                    });
                }
            });
        });
    }));
};