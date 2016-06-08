var Yelp = require("yelp");
var yelp = new Yelp(require('../config/yelp'));

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
        if(err) throw err;
        console.log(data);
    });
};