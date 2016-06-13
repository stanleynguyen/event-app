var engine = require("./engine");

module.exports = function(app, passport, io){
    app.get('/', function(req, res){
        res.render('index.ejs');
    }).post('/', function(req, res){
        engine.yelpSearch(req, res);
    });
    
    io.on('connect', function(socket){
        socket.on('more', function(keyword, location, offset){
            engine.emitResults(io, socket, keyword, location, offset);
        });
    });
    
    app.get('/biz/:id', function(req, res){
        if(req.user) console.log('been here? ',req.user.beenHereBefore(req.params.id));
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
                    res.redirect('/profile');
                });
            }else{
                res.redirect('/');
            }
        })(req, res, next);
    });
    
    app.get('/profile', function(req, res){
        req.user.getUnread()
            .then(req.user.beenHereBefore.bind(null, 'merlion-park-singapore'))
            .then(console.log.bind(null, 'unread: '));
        res.json(req.user);
    });
    
    app.get('/logout', function(req, res){
        req.logout();
        res.redirect('/');
    });
    
    app.get('*', function(req, res){
        res.render('404.ejs');
    });
};
