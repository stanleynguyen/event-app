var engine = require("./engine");

module.exports = function(app, passport){
    app.get('/', function(req, res){
        res.render('index.ejs');
    }).post('/', function(req, res){
        engine.yelpSearch(req, res);
    });
    
    app.get('/chat', function(req, res){
        res.render('chat.ejs');
    });
    
    app.get('/auth/facebook', passport.authenticate('facebook'));
    
    app.get('/auth/facebook/callback', function(req, res, next){
        passport.authenticate('facebook', function(err, user){
            if(err) throw err;
            if(user){
                req.login(user, function(err){
                    if(err) throw err;
                    res.redirect('/profile');
                });
            }else{
                res.redirect('/');
            }
        })(req, res, next);
    });
    
    app.get('/profile', function(req, res){
        res.json(req.user);
    });
    
    app.get('/logout', function(req, res){
        req.logout();
        res.redirect('/');
    });
};