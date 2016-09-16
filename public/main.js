if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('sw.js')
		.then(function(registration) {
			console.log('Service worker registered : ', registration.scope);
    	})
		.catch(function(err) {
			console.log("Service worker registration failed : ", err);
		})
	;
}


var ConnectionStatus = (function() {
	var elem = document.querySelector(".connection-status"),

		setOffline = function() {
			elem.textContent = "Offline";
			elem.classList.add("offline");
		},

		setOnline = function() {
			elem.textContent = "Online";
			elem.classList.add("online");
		},
		setConnecting = function() {
			elem.textContent = "Connecting";
			elem.classList.add("connecting");
		},
		setConnectingCountdown = function(s) {
			elem.textContent = "Retry in " + s + " seconds";
			elem.classList.add("waiting");
		},

		setServerDown = function() {
			elem.textContent = "Server down";
			elem.classList.add("server-down");
		};

	return {
		setOffline: setOffline,
		setOnline: setOnline,
		setConnecting: setConnecting,
		setConnectingCountdown: setConnectingCountdown,
		setServerDown: setServerDown
	}
}());

connectToWebsocket()


window.addEventListener('online',  updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
function updateOnlineStatus(event) {
    if(navigator.onLine) {
    	if(Socker.connected()) {
    		console.log("online again, websocket still active");
    		ConnectionStatus.setOnline();
    	} else {
    		console.log("online again, reconnect to websocket");
    		connectToWebsocket();
    	}
    } else {
    	console.log("offline");
    	ConnectionStatus.setOffline();
    }
}


function connectToWebsocket() {
	ConnectionStatus.setConnecting();
	Socker.connect("wss://localhost:55555", "handla", websocketConnected, websocketClosed, websocketError);	
}
function websocketConnected(e) {
	console.log("connected to websocket", e);
	ConnectionStatus.setOnline();
}
function websocketClosed(e) {
	console.log("websocket closed", e);
	ConnectionStatus.setServerDown();

	var countdown = 10;
	var counter = setInterval(function() {
		if(countdown === 0) {
			clearInterval(counter);
			connectToWebsocket();
		}
		ConnectionStatus.setConnectingCountdown(countdown--);
	}, 1000);

}
function websocketError(e) {
	console.log("error connecting to websocket", e);
}
