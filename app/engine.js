var Yelp = require("yelp");
var yelp = new Yelp(require('../config/yelp'));
var UserData = require("./models/userdata");
var Feed = require("./models/feed");
var Chat = require("./models/chat");

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
    UserData.findOneAndUpdate(
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
    UserData.findOneAndUpdate(
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
    var newFeed = new Feed();
    
    newFeed.who = who;
    newFeed.action = action;
    newFeed.where = where;
    newFeed.when = Date.now();
    
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
    return new Promise(function(resolve, reject){
        Feed.find()
            .sort({when: -1})
            .skip(offset)
            .limit(20)
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
                    when: (new Date(parseInt(array[i].when, 10))).toString(),
                    bizLink: '/biz/'+array[i].where,
                    action: array[i].action
                });
                function getContent(i){
                    UserData.findOne({facebookID: array[i].who}, function(err, user){
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

module.exports.renderProfile = function(req, res){
    UserData.findOne({facebookID: req.params.id}, function(err, profile){
        if(err || !profile) res.render('404.ejs');
        if(!req.user){
            res.render('profile.ejs', {
                    user: null,
                    profile: profile
                });
        }else{
            req.user.getUnread()
            .then(function(info){
                res.render('profile.ejs', {
                    user: req.user,
                    profile: profile,
                    info: info
                });
            });
        }
    });
};

module.exports.renderMyProfile = function(req, res){
    UserData.findOne({facebookID: req.user.facebookID}, function(err, profile){
        if(err || !profile) res.render('404.ejs');
        req.user.getUnread()
        .then(function(info){
            res.render('myprofile.ejs', {
                user: req.user,
                profile: profile,
                info: info
            });
        });
    });
};

module.exports.emitPlace = function(io, socket, place, mode){
    yelp.business(place, function(err, biz){
        if(err) throw err;
        io.to(socket.id).emit(mode, biz);
    });
};

//this module might easily be hacked by manipulating the front end code,
//looking for improvement in the future
module.exports.removePlace = function(who, mode, what){
    if(mode==='places'){
        UserData.update({
            facebookID: who
        },{
            $pull: {places: what}
        }, function(err){
            if(err) throw err;
        });
    }else if(mode === 'bookmarks'){
        UserData.update({
            facebookID: who
        },{
            $pull: {bookmarks: what}
        }, function(err){
            if(err) throw err;
        });
    }
};

module.exports.renderChat = function(req, res) {
    req.user.getUnread()
    .then(function(info){
        new Promise(function (resolve, reject){
            Chat.findById(req.params.id, function(err, chat){
                if(err) return reject(err);
                if(chat.who.indexOf(req.user.facebookID)===-1) return reject('not authorized');
                if(!chat) {
                    res.render('404.ejs');
                }else{
                    resolve(chat);
                }
            })
            .then(function(chat){
                return new Promise(function(resolve, reject){
                    UserData.find({facebookID: {$in: chat.who}}, 'facebookID name picture', function(err, users){
                        if(err) return reject(err);
                        for(var i in users){
                            if(users[i].facebookID===req.user.facebookID){
                                var me = users[i];
                            }else{
                                var mate = users[i];
                            }
                        }
                        resolve({chat: chat, me: me, mate: mate});
                    });
                });
            })
            .then(function(value){
                res.render('chat.ejs', {
                    user: req.user,
                    info: info,
                    chat: value.chat,
                    me: value.me,
                    mate: value.mate
                });
            });
        });
    });
};

module.exports.saveMessage = function(message, room, socket, io){
    var savedMessage = {
        who: message.who,
        when: message.when,
        content: message.content
    };
    io.to(room).emit('message', savedMessage);
    Chat.findOneAndUpdate({_id: room}, {$push: {messages: savedMessage}}, {new: true}, function(err, savedMessage){
        if(err) throw err;
        if(io.sockets.adapter.rooms[room].length === 1){
            UserData.findOneAndUpdate({facebookID: message.to}, {['chats.'+room]: "unread"}, function(err){
                if(err) throw err;
            });
        }
    });
};

