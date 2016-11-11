var fs = require('fs');
var https = require('https');
var socker = require('xio-socker');
var app = require('./app');
var config = require('./config');


var serverSettings = {
	cert: fs.readFileSync(config.cert),
	key: fs.readFileSync(config.certKey)
};
var sockerSettings = {
	connectCallback: userConnected,
	allowedOrigin: config.websocket.allowedOrigin,
	allowedProtocol: config.websocket.allowedProtocol
}


console.log("Staring server...");
var server = https.createServer(serverSettings, app);
server.listen(config.port);
server.on('listening', onListening);


console.log("Websocket started");
socker.init(server, sockerSettings);


process.on("exit", processEnded);



function userConnected(con) {
	console.log("User connected");
}

function onListening() {
	console.log("Listening on port " + config.port);
}

function processEnded(code) {
	console.log("Process ended", code, "\n \n \n");
}