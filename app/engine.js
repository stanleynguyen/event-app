var Yelp = require("yelp");
var yelp = new Yelp(require('../config/yelp'));

var userData = require("./models/userdata");

module.exports.yelpSearch = function(req, res){
    var term = req.body.keyword;
    var location = req.body.location;
    yelp.search({term: term, location: location}, function(err, data){
        if (err){
            res.render('search.ejs', {
                search: req.body,
                results: []
            });
        }else{
            res.render('search.ejs',{
                search: req.body,
                results: data.businesses
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
        if(err){
            res.render('404.ejs');
        }else{
            res.render('biz.ejs', {
                biz: data
            });
        }
    });
};

module.exports.beenHere = function(req, res) {
    userData.findOneAndUpdate(
        {facebookID: req.user.facebookID}, 
        {$addToSet: {places: req.params.id}},
        {safe: true, upsert: true},
        function(err, data){
            if(err) console.log(err);
            console.log(data);
        });
    res.redirect('/biz/'+req.params.id);
};

module.exports.bookMark = function(req, res) {
    userData.findOneAndUpdate(
        {facebookID: req.user.facebookID}, 
        {$addToSet: {bookmarks: req.params.id}},
        {safe: true, upsert: true},
        function(err, data){
            if(err) console.log(err);
            console.log(data);
        });
    res.redirect('/biz/'+req.params.id);
};