(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = {
	websocket: {
		url: 'wss://localhost:55555',
		protocol: 'handla'
	},
	storageName: 'items'
};

},{}],2:[function(require,module,exports){
var elem = document.querySelector(".connection-status");
	
function hideAll() {
	Array.from(elem.children).forEach(div => {
		div.setAttribute("hidden","");
	});
}

function setStatus(status) {
	hideAll();
	elem.querySelector('.' + status).removeAttribute("hidden");
}


module.exports = {
	setStatus: setStatus
}

},{}],3:[function(require,module,exports){
var list;
var Items = require("./items");
var Websocket = require("./websocket");


function init(elem) {
	list = elem;
	list.addEventListener("change", onListChange, false);
	list.addEventListener("click", onListClick, false);
}


function refresh() {
	console.log("Refresh list");
	list.innerHTML = Items.getAllSorted().map(generateHTML).join("");
}



Websocket.on("allItems", items => {
	console.log("All items from server", items);
	Items.set(items);
	refresh();
});
Websocket.on("newItem", item => {
	console.log("New item from server:", item);
	Items.add(item);
	refresh();
});
Websocket.on("deleteItem", itemId => {
	console.log("Delete item from server:", itemId);
	Items.delete(itemId);
	refresh();
});




function generateHTML(item) {
	var elemId = "item_"+item._id;
	var checked = item.checked ? "checked" : "";
	var itemClasses = "shopping-list-item";
	if(item.localOnly) itemClasses += " local";
	if(item.deleted) itemClasses += " deleted";
	return `
		<li class="${itemClasses}" data-item-id="${item._id}">
			<input type="checkbox" name="${item._id}" id="${elemId}" ${checked} />
			<label for="${elemId}">&#10003;</label>
			<span class="name">${item.name}</span>
			<button type="button" class="button-delete-item">
				<svg class="icon icon-delete"><use xlink:href="/icon/icons.svg#icon-delete"></use></svg>
			</button>
		</li>
	`;
}


function onListChange(e) {
	console.log("listChange", e);
	/*
	var elem = e.target;
	var storageId = parseInt(elem.parentElement.dataset.storageId);

	storage.get(config.storageName, storageId).then(function(item) {
		item.checked = elem.checked;
		storage.update(config.storageName, item).then(function() {
			notifyServiceWorker();
			refreshList();
		});
	});
	*/
}


function onListClick(e) {
	console.log("list click", e.target);

	var elem = e.target;
	while(elem !== list) {
		if(elem.className === "button-delete-item") {
			var itemId = elem.parentElement.dataset.itemId;
			Websocket.send("deleteItem", itemId);
			break;
		}
		elem = elem.parentElement;
	}
}


module.exports = {
	init: init,
	refresh: refresh
};







/*

(function(exports) {
	var socker = require("xio-socker");
	var _items = [];
	var config = require("./config");
	
	

	

	
	


	

	function newItemCallback(newItem) {
		_items.push(newItem);
		refreshList();
	}


	


	function addItem(name) {
		console.log("Save item:", item);
		if(socker.connected()) {
			
		} else {
			//TODO: put message in indexedDb send queue
		}
	}


	function notifyServiceWorker() {
		console.log("wanna synk");
		navigator.serviceWorker.ready
			.then(function(registration) {
				console.log("ready to sync");
				return registration.sync.register('itemsToSync')})
			.then(function() {
				console.log("synk scheduled...");
			}).catch(function(e) {
				console.log("no sync!", e);
			});
	}


	function sortByName(a, b) {
		let n1 = a.name.toLowerCase(),
			n2 = b.name.toLowerCase();
		if(n1 > n2) {
			return 1;
		} else if(n1 < n2) {
			return -1;
		}
		return 0;
	}

	exports.init = init;
	exports.add = addItem;
	exports.sync = notifyServiceWorker;
	exports.refresh = refreshList;
	
}(typeof exports === 'undefined'? this['ItemList']={}: exports));

*/
},{"./items":4,"./websocket":7}],4:[function(require,module,exports){
var items = [];


function set(arr) {
	items = arr;
}

function addItem(item) {
	items.push(item);
}


function deleteItem(id) {
	var index = items.findIndex(i => i._id === id);
	items.splice(index, 1);
}


function getAllSorted() {
	return items.sort(sortByName);
}


function sortByName(a, b) {
	let n1 = a.name.toLowerCase(),
		n2 = b.name.toLowerCase();
	if(n1 > n2) {
		return 1;
	} else if(n1 < n2) {
		return -1;
	}
	return 0;
}


module.exports = {
	add: addItem,
	delete: deleteItem,
	getAllSorted: getAllSorted,
	set: set
	/*
	saveToCache: {console.error("Not implemented")},
	loadFromCache: {console.error("Not implemented")}
	*/
};

},{}],5:[function(require,module,exports){
var ItemList = require("./item_list");
var IDB = require("./storage");
var Websocket = require("./websocket");


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



ItemList.init(document.querySelector(".shopping-list"));
ItemList.refresh();
Websocket.connect();






var addItemForm = document.forms.addItem;
var btnNewItem = document.getElementById("btnNewItem");
var dialogAddItem = document.getElementById("dialogAddItem");
var newItemInput = addItemForm.elements.newItem;
addItemForm.addEventListener("submit", addItem, false);
btnNewItem.addEventListener("click", showAddItem, false);

function addItem(e) {
	e.preventDefault();
	var item = {
		name: newItemInput.value,
		tempId: -(+new Date()),
		ts: new Date()
	};
	Websocket.send("newItem", item);
	addItemForm.reset();
	dialogAddItem.hide();
}

function showAddItem(e) {
	dialogAddItem.show();
	newItemInput.focus();
}





Element.prototype.hide = function() {
	this.style.display = 'none';
}
Element.prototype.show = function() {
	this.style.display = '';
}


},{"./item_list":3,"./storage":6,"./websocket":7}],6:[function(require,module,exports){
class IDB {

	constructor(name, version, upgradeCallback) {
		this.name = name;
		this.version = version;
		this.upgradeCallback = upgradeCallback;
	}

	open() {
		let that = this;
		return new Promise(function(resolve, reject) {
			if(that.db) resolve(that.db);

			var openRequest = indexedDB.open(that.name, that.version);
			openRequest.onupgradeneeded = that.upgradeCallback;

			openRequest.onsuccess = function(e) {
				that.db = e.target.result;
				resolve(that.db);
			}

			openRequest.onerror = function(e) {
				reject(e);
			}
		});
	}

	save(storeName, data) {
		return this.open().then(function(db) {
			return new Promise(function(resolve, reject) {

				var transaction = db.transaction([storeName],"readwrite");
				var store = transaction.objectStore(storeName);

				var request = store.add(data);

				request.onerror = function(e) {
					reject(e);
				}

				request.onsuccess = function(e) {
					resolve(e.target.result);
				}
			});
		});
	}

	getAll(storeName, index) {
		return this.open().then(function(db) {
			return new Promise(function(resolve, reject) {
				var items = [];
				var transaction = db.transaction(storeName, "readonly");
				var store = transaction.objectStore(storeName);

				if(index) {
					let storeIndex = store.index(index);
					var cursorRequest = storeIndex.openCursor();
				} else {
					var cursorRequest = store.openCursor();
				}


				transaction.oncomplete = function(evt) {
					resolve(items);
				};

				cursorRequest.onerror = function(error) {
					reject(error);
				};

				cursorRequest.onsuccess = function(evt) {
					var cursor = evt.target.result;
					if (cursor) {
						items.push(cursor.value);
						cursor.continue();
					}
				};
			});
		});
	}

	get(storeName, id) {
		return this.open().then(function(db) {
			return new Promise(function(resolve, reject) {
				var transaction = db.transaction(storeName, "readonly");
				var store = transaction.objectStore(storeName);

				var request = store.get(id);
				request.onsuccess = function(e) {
					resolve(e.target.result);
				};
				request.onerror = function(err) {
					reject(err);
				};
			});
		});
	}

	delete(storeName, id) {
		return this.open().then(function(db) {
			return new Promise(function(resolve, reject) {
				var transaction = db.transaction(storeName, "readwrite");
				var store = transaction.objectStore(storeName);

				var request = store.delete(id);
				request.onsuccess = function(e) {
					resolve(e);
				};
				request.onerror = function(err) {
					reject(err);
				};
			});
		});
	}

	update(storeName, data) {
		return this.open().then(function(db) {
			return new Promise(function(resolve, reject) {
				var transaction = db.transaction(storeName, "readwrite");
				var store = transaction.objectStore(storeName);

				var request = store.put(data);
				request.onsuccess = function(e) {
					resolve(e);
				};
				request.onerror = function(err) {
					reject(err);
				};
			});
		});
	}
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = IDB;
}
},{}],7:[function(require,module,exports){
var socker = require("xio-socker");
var ConnectionStatus = require("./connection_status");
var config = require("./config");

var reconnectTimeout;
var timeoutFunction;



addEventListener('online', onOnline);






function onOnline() {
	if(!socker.connected()) {
		console.log("online again, reconnect to websocket");
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
	console.log("websocket closed", e);
	ConnectionStatus.setStatus("offline");

	console.log("reconnect", reconnectTimeout);
	timeoutFunction = setTimeout(function() {
		connectToWebsocket();
		reconnectTimeout *= 2;
	}, reconnectTimeout);

}
function websocketError(e) {
	console.log("error connecting to websocket", e);
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
},{"./config":1,"./connection_status":2,"xio-socker":8}],8:[function(require,module,exports){
var socker = (function() {
	var socket,
		connected = false,
		messageListeners = {},
		sendQueue = [];


	function connect(url, protocol, openCallback, closeCallback, errorCallback) {
		socket = new WebSocket(url, protocol);
		socket.addEventListener("open", connectionEstablished);
		socket.addEventListener("error", connectionFailed);
		socket.addEventListener("close", connectionClosed);
		socket.addEventListener("message", messageReceived);

		function connectionEstablished(e) {
			processSendQueue();
			if(openCallback) openCallback(e);
			else console.log("connectionEstablished", e);
		}

		function connectionClosed(e) {
			connected = false;
			if(closeCallback) closeCallback(e);
			else console.log("Connection was closed", e);
		}

		function connectionFailed(e) {
			connected = false;
			if(errorCallback) errorCallback(e);
			else console.log("Can not connect to websocket", e);
		}


		function messageReceived(e) {
			try {
				var payload = JSON.parse(e.data);
			} catch(e) {
				console.error("Error parsing message", e);
			}

			var type = payload.type;
			var data = payload.data;

			if(messageListeners.hasOwnProperty(type)) {
				messageListeners[type].forEach(function(callback) {
					callback(data, type);
				});
			} else {
				console.warn("Incoming discarded message", type, data);
			}
		}
	}



	function sendMessage(type, data) {
		var payload = {type: type, data:data};
		if(isConnected()) {
			console.log("Send", payload);
			socket.send(JSON.stringify(payload));
		} else {
			sendQueue.push(payload);
		}
	}

	function processSendQueue() {
		while(isConnected() && sendQueue.length>0) {
			var payload = sendQueue.shift();
			socket.send(JSON.stringify(payload));
		}
	}

	function addMessageListener(type, callback) {
		if(!messageListeners.hasOwnProperty(type)) messageListeners[type] = [];
		messageListeners[type].push(callback);
	}

	function isConnected() {
		return socket && socket.readyState === 1;
	}

	return {
		connect: connect,
		send: sendMessage,
		on: addMessageListener,
		connected: isConnected
	}	
}());

if (typeof module !== "undefined" && module.exports) {
    module.exports = socker;
}
},{}]},{},[5]);
