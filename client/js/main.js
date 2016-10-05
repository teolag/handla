var Socker = require("xio-socker").client;



if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('sw.js')
		.then(function(registration) {
			console.log('Service worker registered : ', registration.scope);

			// no service worker active, first visit
			if (!navigator.serviceWorker.controller) {
				console.log("first visit?");
				return;
			}

			if (registration.waiting) {
				console.log("new worker ready");
				updateReady(registration.waiting);
				return;
			}

			if (registration.installing) {
				console.log("new worker installing");
				trackInstalling(registration.installing);
				return;
			}

			registration.addEventListener('updatefound', function() {
				console.log("new worker found, track installation");
				trackInstalling(registration.installing);
			});
    	})
		.catch(function(err) {
			console.log("Service worker registration failed : ", err);
		})
	;

	var refreshing;
	navigator.serviceWorker.addEventListener('controllerchange', function() {
		if (refreshing) return;
		window.location.reload();
		refreshing = true;
	});

	var trackInstalling = function(worker) {
		var indexController = this;
		worker.addEventListener('statechange', function() {
			if (worker.state == 'installed') {
				updateReady(worker);
			}
		});
	};

	var updateReady = function(worker) {
		console.log("Update ready!");
		worker.postMessage({action: 'skipWaiting'});

		/*
		var toast = this._toastsView.show("New version available", {
			buttons: ['refresh', 'dismiss']
		});

		toast.answer.then(function(answer) {
			if (answer != 'refresh') return;
			worker.postMessage({action: 'skipWaiting'});
		});
		*/
	};
}


var ConnectionStatus = (function() {
	var elem = document.querySelector(".connection-status"),
		defaultClassName = elem.className;

		setOffline = function() {
			resetClassName();
			elem.textContent = "Offline";
			elem.classList.add("offline");
		},

		setOnline = function() {
			resetClassName();
			elem.textContent = "Online";
			elem.classList.add("online");
		},
		setConnecting = function() {
			resetClassName();
			elem.textContent = "Connecting";
			elem.classList.add("connecting");
		},
		setConnectingCountdown = function(s) {
			resetClassName();
			elem.textContent = "Retry in " + s + " seconds";
			elem.classList.add("waiting");
		},

		setServerDown = function() {
			resetClassName();
			elem.textContent = "Server down";
			elem.classList.add("server-down");
		},

		resetClassName = function() {
			elem.className = defaultClassName;
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




var addItemForm = document.forms.addItem;
var btnNewItem = document.getElementById("btnNewItem");
var dialogAddItem = document.getElementById("dialogAddItem");
var newItemInput = addItemForm.elements.newItem;
addItemForm.addEventListener("submit", addItem, false);
btnNewItem.addEventListener("click", showAddItem, false);

function addItem(e) {
	e.preventDefault();
	var name = newItemInput.value;
	console.log("add", name);
	ItemList.add(name);
	addItemForm.reset();
	hide(dialogAddItem);
}

function showAddItem(e) {
	show(dialogAddItem);
	newItemInput.focus();
}


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
	Socker.connect(config.websocket.url, config.websocket.protocol, websocketConnected, websocketClosed, websocketError);
}
function websocketConnected(e) {
	console.log("connected to websocket", e);
	ConnectionStatus.setOnline();
}
function websocketClosed(e) {
	console.log("websocket closed", e);
	ConnectionStatus.setServerDown();

	/*
	var countdown = 10;
	var counter = setInterval(function() {
		if(countdown === 0) {
			clearInterval(counter);
			connectToWebsocket();
		}
		ConnectionStatus.setConnectingCountdown(countdown--);
	}, 1000);
	*/

}
function websocketError(e) {
	console.log("error connecting to websocket", e);
}








function show(elem) {
	elem.style.display = "";
}
function hide(elem) {
	elem.style.display = "none";
}