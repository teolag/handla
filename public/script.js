(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = {
	websocket: {
		url: 'wss://localhost:55555',
		protocol: 'handla'
	},
	storageName: 'items'
};

},{}],2:[function(require,module,exports){
(function(exports) {
	var socker = require("xio-socker");
	var list;
	var items = [];
	var config = require("./config");
	var storage;

	function init(storageClass) {
		storage = storageClass;
		list = document.querySelector(".shopping-list");
		list.addEventListener("change", listChange, false);
		list.addEventListener("click", listClick, false);

		socker.on("allItems", allItemsCallback);
		socker.on("newItems", newItemsCallback);
		refreshList();
	}

	function allItemsCallback(serverItems) {
		console.log("AllItemsFromServer", serverItems);

		storage.getAll("items", "_id").then(items => {
			var existingIds = items.map(item => item._id);
			var itemsToAdd = serverItems.filter(item => {
				return existingIds.indexOf(item._id) === -1;
			});

			/*
				STORAGE CAN ONLY SAVE ONE ITEM AT A TIME
				Promisify save and create an array of saves 
				then run Promise.all(array) to save all at once
				ONLY one db.open and get store!!
			*/

			itemsToAdd.forEach((item, i) => {
				storage.save("items", item).then(id => {
					if(i === itemsToAdd.length-1) refreshList();
				});
			});
			
		});
		


	}

	


	function listChange(e) {
		console.log("listChange", e);
		var itemId = e.target.name;

		var item = items.find(function(item) {
			return item._id === itemId;
		});
		if(item) {
			item.checked = e.target.checked;
			socker.send("itemChecked", {id:itemId, checked:item.checked});
		}
	}

	function listClick(e) {
		if(e.target.className === "delete-item") {
			var elem = e.target;
			var storageId = parseInt(elem.parentElement.dataset.storageId);
			
			storage.get(config.storageName, storageId).then(function(item) {
				if(item.localOnly) {
					storage.delete(config.storageName, storageId).then(function(e) {
						elem.parentElement.classList.add("delete");
					});
				} else {
					item.deleted = true;
					storage.update(config.storageName, item).then(function(e) {
						console.log("deleted flag set", e);
						notifyServiceWorker();
						refreshList();
					});
				}
			});
		}
	}


	function newItemsCallback(newItems) {
		newItems.forEach((newItem, i) => {
			storage.save("items", newItem).then(item => {
				console.log("new item saved", item);
				if(i === newItems.length-1) refreshList();
			});
		});
	}

	function refreshList() {
		console.log("Refresh list");
		storage.getAll(config.storageName).then(function(items) {
			list.innerHTML = items.sort(sortByName).map(function(item) {
				var elemId = "item_"+item._id;
				var itemClasses = "shopping-list-item";
				if(item.localOnly) itemClasses += " local";
				if(item.deleted) itemClasses += " deleted";
				return `<li class="${itemClasses}" data-storage-id="${item.id}">
							<label for="${elemId}">&#10003;</label>
							<input type="checkbox" name="${item._id}" id="${elemId}" />
							<span class="name">${item.name}</span>
							<button type="button" class="delete-item">x</button>
						</li>`;
			}).join("");
		});
	}

	function addItem(name) {
		var tempId = -(+new Date());
		var item = {name: name, _id:tempId, localOnly:true};
		console.log("Save item:", item);
		storage.save(config.storageName, item)
			.then(function(e) {
				console.log("Saved to idb", item);
				refreshList(); 
				notifyServiceWorker();
			});
	}

	function notifyServiceWorker() {
		console.log("wanna synk");
		navigator.serviceWorker.ready
			.then(function(registration) {
				return registration.sync.register('itemsToSync')})
			.then(function() {
				console.log("synk scheduled...");
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
},{"./config":1,"xio-socker":5}],3:[function(require,module,exports){
var socker = require("xio-socker");
var ItemList = require("./item_list");
var config = require("./config");
var IDB = require("./storage");

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
	socker.connect(config.websocket.url, config.websocket.protocol, websocketConnected, websocketClosed, websocketError);
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
},{"./config":1,"./item_list":2,"./storage":4,"xio-socker":5}],4:[function(require,module,exports){
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
},{}],5:[function(require,module,exports){
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
},{}]},{},[3]);
