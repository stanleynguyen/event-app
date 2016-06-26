var express = require("express");
var favicon = require("serve-favicon");
var app = express();
var http = require("http").Server(app);
var io = require('socket.io')(http);

var mongoose = require("mongoose");
var passport = require("passport");

app.set('view engine', 'ejs');
app.use(favicon('./views/public/favicon.jpg'));
app.use(express.static('./views/public'));
app.use(require('body-parser').urlencoded({extended: true}));
app.use(require('express-session')({secret: 'daretostanley', resave: true, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(require("./config/db").url);

require('./config/passport')(passport);
require('./app/route')(app, passport, io);

http.listen(process.env.PORT, function(err){
    if(err) throw err;
    console.log('listening at', process.env.PORT);
});