var fs = require('fs'),
    https = require('https'),
    express = require('express'),
    app = express(),
    config = require('./config'),
    options = {
		cert: fs.readFileSync(config.cert),
		key: fs.readFileSync(config.certKey)
	};



https.createServer(options, app).listen(config.port, listenStart);
app.use(express.static('public'));


function listenStart() {
	console.log("listening on port " + config.port);
}