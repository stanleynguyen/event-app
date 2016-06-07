var Yelp = require("yelp");
var yelp = new Yelp(require('../config/yelp'));

module.exports.yelpSearch = function(req, res){
    var term = req.body.keyword;
    var location = req.body.location;
    yelp.search({term: term, location: location}, function(err, data){
        if (err) console.log(err);
        res.render('search.ejs',{
            search: req.body,
            results: data.businesses
        });
    });
};