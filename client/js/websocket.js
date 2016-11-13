var socker = require("xio-socker");
var ConnectionStatus = require("./connection_status");
var config = require("./config");

var reconnectTimeout = 1000;
var timeoutFunction;



addEventListener('online', onOnline);
document.addEventListener("visibilitychange", onPageFocusAndBlur);






function onOnline() {
	if(!socker.isConnected()) {
		console.log("online again, reconnect to websocket");
		connectToWebsocket();
	}
}


function onPageFocusAndBlur() {
	if(!document.hidden && !socker.isConnected()) {
		connectToWebsocket();
	}
}

function connectToWebsocket() {
	ConnectionStatus.setStatus("connecting")
	socker.connect(config.websocket.url, config.websocket.protocol, websocketConnected, websocketClosed, websocketError);
}
function websocketConnected(e) {
	console.log("connected to websocket", e);
	ConnectionStatus.setStatus("online");
	clearTimeout(timeoutFunction);
	reconnectTimeout = 1000;
	socker.send("getAllItems");
}
function websocketClosed(e) {
	console.log("Websocket closed", e.code, e.reason);
	ConnectionStatus.setStatus("offline");

	console.log("Try to reconnect in " + (reconnectTimeout/1000) + " seconds");
	timeoutFunction = setTimeout(function() {
		connectToWebsocket();
		reconnectTimeout *= 2;
	}, reconnectTimeout);

}
function websocketError(e) {
	//console.log("Error connecting to websocket", e);
}

function send(type, data) {
	socker.send(type, data);
}

function on(type, callback) {
	socker.on(type, callback);
}


module.exports = {
	connect: connectToWebsocket,
	send: send,
	on: on
}