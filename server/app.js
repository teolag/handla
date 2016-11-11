var express = require('express');
var app = express();
var config = require('./config');
var routes = require('./routes');
var bodyParser = require('body-parser');
    
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(logger);
app.use(routes);

module.exports = app;











function logger(req, res, next) {
    console.log(req.method, "REQUEST", req.url);
    next();
}