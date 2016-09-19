/*

Kommer in på sidan
	Visa listan från local storage
	Är vi online
		JA: hämta senaste listan från servern
			kolla om vi har något osyncat i local storage
		NEJ:




Lägga till ett item
	Tryck på lägg till knappen
	Itemet läggs till i arrayen men med en flagga, not synced
	spara ner itemet i local storage
	Har vi kontakt med servern?
		JA: skicka ett tillägg
			sätt flaggan till synced
		NEJ: ----




*/



var fs = require('fs'),
    https = require('https'),
    express = require('express'),
    app = express(),
    config = require('./config'),
    socker = require('../Socker/sockerServer.js'),
	Datastore = require('nedb'),
  	db = new Datastore({ filename: 'server/item_store', autoload: true }),
    options = {
		cert: fs.readFileSync(config.cert),
		key: fs.readFileSync(config.certKey)
	};

var server = https.createServer(options, app).listen(config.port, listenStart);



var logger = function(req, res, next) {
    console.log("GOT REQUEST !", req.url);
    next(); // Passing the request to the next handler in the stack.
}

app.use(logger); // Here you add your logger to the stack.
app.use("/sockerClient.js", express.static(__dirname + '/../Socker/sockerClient.js'));
app.use(express.static('public'));


socker.init(server, {
	connectCallback: userConnected,
	allowedOrigin: config.websocket.allowedOrigin,
	allowedProtocol: config.websocket.allowedProtocol
});

socker.on("addItem", function(connection, data, type) {
	console.log("adda!", data);
	db.insert({name:data.name, added: new Date()});
});




function userConnected(con) {
	db.find({}, function (err, docs) {
		socker.sendTo(con, "allItems", docs);
	});
}

function listenStart() {
	console.log("listening on port " + config.port);
}