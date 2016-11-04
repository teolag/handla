(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = {
	websocket: {
		url: 'wss://localhost:55555',
		protocol: 'handla'
	}
};

},{}],2:[function(require,module,exports){
(function(exports) {
	var socker = require("xio-socker");
	var list;
	var items = [];

	function init() {
		list = document.querySelector(".shopping-list");
		list.addEventListener("change", listChange, false);
		list.addEventListener("click", listClick, false);

		socker.on("allItems", allItemsCallback);
		socker.on("newItem", newItemCallback);
		loadCachedList();
		sendAllLocalItems();
	}


	function sendAllLocalItems() {
		console.log("any local items?");
		items.filter(function(item) {
			return item.localOnly;
		}).forEach(function(item) {
			console.log("send local", item);
			socker.send("addItem", item);
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
		//console.log("listClick", e);

		if(e.target.className === "delete-item") {
			var itemId = e.target.parentElement.dataset.id;
			socker.send("itemDelete", {id:itemId});
			e.target.parentElement.classList.add("delete");
		}

	}


	function loadCachedList() {
		var cachedList = JSON.parse(localStorage.getItem("items"));
		if(cachedList) {
			items = cachedList;
			refreshList();
		}
	}

	function saveCacheList() {
		localStorage.setItem("items", JSON.stringify(items));
	}



	function allItemsCallback(it) {
		items = it;
		saveCacheList();
		refreshList();
	}

	function newItemCallback(item) {
		var localItem = items.find(function(local) {
			return local._id === item.tempId && local.localOnly;
		});
		if(localItem) {
			console.log("local item saved to db", item);
			localItem.localOnly = false;
			localItem._id = item._id;
		} else {
			items.push(item);
		}

		saveCacheList()
		refreshList();
	}

	function refreshList() {
		list.innerHTML = "";
		items.sort(sortByName);
		items.forEach(createListItem);
	}

	function createListItem(item, i) {
		var li = document.createElement("li"),
			label = document.createElement("label"),
			checkbox = document.createElement("input"),
			nameSpan = document.createElement("span"),
			deleteButton = document.createElement("button");
		checkbox.type = "checkbox";
		checkbox.name = item._id;
		checkbox.id = "item_"+item._id;
		if(item.checked) checkbox.checked="checked";
		label.setAttribute("for", "item_"+item._id);
		label.innerHTML = "&#10003;";
		nameSpan.textContent = item.name;
		nameSpan.className = "name";
		deleteButton.textContent = "x";
		deleteButton.className = "delete-item";
		li.dataset.id = item._id;
		li.className = "shopping-list-item";
		li.appendChild(checkbox);
		li.appendChild(label);
		li.appendChild(nameSpan);
		li.appendChild(deleteButton);

		if(item.localOnly) li.classList.add("local");
		list.appendChild(li);
	}

	function addItem(name) {
		var tempId = "temp"+(+new Date());
		var item = {name: name, _id:tempId, localOnly:true};
		items.push(item);
		socker.send("addItem", item);
		saveCacheList();
		refreshList(); 
	}


	function sortByName(a, b) {
		if(a.name > b.name) {
			return 1;
		} else if(a.name < b.name) {
			return -1;
		}
		return 0;
	}

	exports.init = init;
	exports.add = addItem;
	
}(typeof exports === 'undefined'? this['ItemList']={}: exports));
},{"xio-socker":4}],3:[function(require,module,exports){
var socker = require("xio-socker");
var ItemList = require("./item_list");
var config = require("./config");

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


ItemList.init();
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
},{"./config":1,"./item_list":2,"xio-socker":4}],4:[function(require,module,exports){
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
