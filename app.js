var express = require("express");
var app = express();
var mongoose = require("mongoose");
var passport = require("passport");

app.set('view engine', 'ejs');
app.use(express.static('./views/public'));
app.use(require('body-parser').urlencoded({extended: true}));
app.use(require('express-session')({secret: 'daretostanley', resave: true, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(require("./config/db").url);

require('./config/passport')(passport);
require('./app/route')(app, passport);

app.listen(process.env.PORT, function(err){
    if(err) throw err;
    console.log('listening at', process.env.PORT);
});