var engine = require("./engine");

module.exports = function(app, passport, io){
    app.get('/', function(req, res){
        engine.renderIndex(req, res);
    }).post('/', function(req, res){
        engine.yelpSearch(req, res);
    });
    
    app.get('/biz/:id', function(req, res){
        engine.renderBizProfile(req, res);
    });
    
    app.get('/beenhere/:id', function(req, res){
        engine.beenHere(req, res);
    });
    
    app.get('/bookmark/:id', function(req, res){
        engine.bookMark(req, res);
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
                    res.redirect('/feed');
                });
            }else{
                res.redirect('/');
            }
        })(req, res, next);
    });
    
    app.get('/feed', function(req, res){
        engine.renderFeed(req, res);
    });
    
    app.get('/profile/:id', myProfileOrNot, function(req, res){
        res.send('profile '+req.params.id);
    });
    
    app.get('/myprofile', loggedIn, function(req, res){
        res.send('my profile');
    });
    
    app.get('/logout', function(req, res){
        req.logout();
        res.redirect('/');
    });
    
    app.get('*', function(req, res){
        res.render('404.ejs');
    });
    
    io.on('connect', function(socket){
        socket.on('more', function(keyword, location, offset){
            engine.emitResults(io, socket, keyword, location, offset);
        });
        socket.on('older', function(offset){
            engine.emitOlderPost(io, socket, offset);
        });
    });
    
};

function myProfileOrNot(req, res, next){
    if(!req.user){
        return next();
    }else{
        if(req.user.facebookID === req.params.id){
            return res.redirect('/myprofile');
        }else{
            return next();
        }
    }
}

function loggedIn(req, res, next){
    if(req.user) return next();
    return res.redirect('/');
}
