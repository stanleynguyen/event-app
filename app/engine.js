var Yelp = require("yelp");
var yelp = new Yelp(require('../config/yelp'));

module.exports.yelpSearch = function(req, res){
    console.log(req.body)
    var term = req.body.keyword;
    var location = req.body.location;
    // var offset = req.body.offset || 0;
    yelp.search({term: term, location: location/*, limit: 10, offset: offset*/}, function(err, data){
        if (err) console.log(err);
        res.json(data);
    });
};