var socker = require("xio-socker");
var ItemList = require("./item_list");
var config = require("./config");
var IDB = require("./storage");

if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('sw.js')
		.then(function(registration) {
			
			// no service worker active, first visit
			if (!navigator.serviceWorker.controller) {
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
	};

	navigator.serviceWorker.onmessage = function(e) {
		console.log("Message form SW:", e.data);
		if(e.data === "updateList") {
			ItemList.refresh();
		}
	}

}


var ConnectionStatus = (function() {
	var elem = document.querySelector(".connection-status"),
		
		hideAll = function() {
			Array.from(elem.children).forEach(div => {
				div.setAttribute("hidden","");
			});
		},

		setStatus = function(status) {
			hideAll();
			elem.querySelector('.' + status).removeAttribute("hidden");
		};

	return {
		setStatus: setStatus
	}
}());


var storage = new IDB("handla", 1, storageUpdate);
var storageName = 'items';
function storageUpdate(e) {
	console.log("Upgrading db");

	var db = e.target.result;
	if(!db.objectStoreNames.contains(storageName)) {
		var objectStore = db.createObjectStore(storageName, {keyPath: "id", autoIncrement:true});
		objectStore.createIndex("name", "name", {unique: false});
		objectStore.createIndex("_id", "_id", {unique: true});
	}
}


ItemList.init(storage);
connectToWebsocket();




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
    	if(socker.connected()) {
    		console.log("online again, websocket still active");
    		ConnectionStatus.setStatus("online");
    	} else {
    		console.log("online again, reconnect to websocket");
    		connectToWebsocket();
    	}
    } else {
    	console.log("offline");
    	ConnectionStatus.setStatus("offline");
    }
}


function connectToWebsocket() {
	ConnectionStatus.setStatus("connecting")
	socker.connect(config.websocket.url, config.websocket.protocol, websocketConnected, websocketClosed, websocketError);
}
function websocketConnected(e) {
	console.log("connected to websocket", e);
	ConnectionStatus.setStatus("online");
	socker.send("getAllItems");
}
function websocketClosed(e) {
	console.log("websocket closed", e);
	ConnectionStatus.setStatus("offline");

	/*
	var countdown = 10;
	var counter = setInterval(function() {
		if(countdown === 0) {
			clearInterval(counter);
			connectToWebsocket();
		}
		ConnectionStatus.setStatus("connecting");
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