var Yelp = require("yelp");
var yelp = new Yelp(require('../config/yelp'));

module.exports.renderIndex = function(req, res){
    if(!req.user) {
        res.render('index.ejs', {user: null});
    }else{
        req.user.getUnread()
            .then(function(info){
                res.render('index.ejs', {
                    user: req.user,
                    info: info
                });
            });
    }
};

module.exports.yelpSearch = function(req, res){
    var term = req.body.keyword;
    var location = req.body.location;
    
    yelp.search({term: term, location: location}, function(err, data){
        if(!req.user){
            if (err){
                res.render('search.ejs', {
                    search: req.body,
                    results: [],
                    user: null
                });
            }else{
                res.render('search.ejs',{
                    search: req.body,
                    results: data.businesses,
                    user: null
                });
            }
        }else{
            req.user.getUnread()
                .then(function(info){
                    if (err){
                    res.render('search.ejs', {
                        search: req.body,
                        results: [],
                        user: req.user,
                        info: info
                    });
                }else{
                    res.render('search.ejs',{
                        search: req.body,
                        results: data.businesses,
                        user: req.user,
                        info: info
                    });
                }
                });
        }
    });
};

module.exports.emitResults = function(io, socket, keyword, location, offset){
    yelp.search({term: keyword, location: location, offset: offset}, function(err, data){
        if(err) throw err;
        io.to(socket.id).emit('newResults', data.businesses);
    });
};

module.exports.renderBizProfile = function(req, res){
    yelp.business(req.params.id, function(err, data){
        if(!req.user){
            if(err){
                res.render('404.ejs');
            }else{
                res.render('biz.ejs', {
                    biz: data,
                    user: null,
                    info: {been: true, book: true}
                });
            }
        }else{
            req.user.getUnread()
                .then(req.user.beenHereBefore.bind(null, req.params.id))
                .then(function(info){
                    if(err){
                        res.render('404.ejs');
                    }else{
                        res.render('biz.ejs', {
                            biz: data,
                            user: req.user,
                            info: info
                        });
                    }
                });
        }
    });
};

module.exports.beenHere = function(req, res) {
    var userData = require("./models/userdata");
    userData.findOneAndUpdate(
        {facebookID: req.user.facebookID}, 
        {$addToSet: {places: req.params.id}},
        {safe: true, upsert: true},
        function(err){
            if(err) throw(err);
        });
    saveFeed(req.user.facebookID, "has just been to", req.params.id);
    res.redirect('/biz/'+req.params.id);
};

module.exports.bookMark = function(req, res) {
    var userData = require("./models/userdata");
    userData.findOneAndUpdate(
        {facebookID: req.user.facebookID}, 
        {$addToSet: {bookmarks: req.params.id}},
        {safe: true, upsert: true},
        function(err, data){
            if(err) throw err;
        });
    saveFeed(req.user.facebookID, "is planning to go", req.params.id);
    res.redirect('/biz/'+req.params.id);
};

function saveFeed(who, action, where){
    var Feed = require("./models/feed");
    var newFeed = new Feed();
    
    newFeed.who = who;
    newFeed.action = action;
    newFeed.where = where;
    newFeed.when = new Date();
    
    newFeed.save(function(err){
        if(err) throw err;
    });
}

module.exports.renderFeed = function(req, res){
    buildFeed(0).then(function(feedArray){
        if(!req.user){
            res.render('feed.ejs', {
                user: null,
                feedArray: feedArray
            });
        }else{
            req.user.getUnread()
                .then(function(info){
                    res.render('feed.ejs', {
                        user: req.user,
                        info: info,
                        feedArray: feedArray
                    });
                });
        }
    });
};

module.exports.emitOlderPost = function(io, socket, offset){
    buildFeed(offset).then(function(feedArray){
        io.to(socket.id).emit('Older Posts', feedArray);
    });
};

function buildFeed(offset){
    var userData = require("./models/userdata");
    var Feed = require("./models/feed");
    return new Promise(function(resolve, reject){
        Feed.find({})
            .skip(offset)
            .limit(20)
            .sort({when: -1})
            .exec(function(err, array){
            if(err) return reject(err);
            resolve(array);
        });
    }).then(function(array){
        return new Promise(function(resolve, reject){
            var resultArray = [];
            if(array.length === 0) resolve(resultArray);
            var count=0;
            for(var i=0; i<array.length; i++){
                resultArray.push({
                    profileLink: '/profile/'+array[i].who,
                    when: array[i].when,
                    bizLink: '/biz/'+array[i].where,
                    action: array[i].action
                });
                function getContent(i){
                    userData.findOne({facebookID: array[i].who}, function(err, user){
                        if(err) throw err;
                        resultArray[i].picture = user.picture;
                        resultArray[i].name = user.name;
                        count++;
                        if(count === array.length*2) resolve(resultArray);
                    });
                    yelp.business(array[i].where, function(err, biz){
                        if(err) throw err;
                        resultArray[i].bizName = biz.name;
                        count++;
                        if(count === array.length*2) resolve(resultArray);
                    });
                }
                getContent(i);
            }
        });
    });
}

