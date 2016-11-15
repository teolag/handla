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




var h1 = document.querySelector("h1");
h1.addEventListener("click", e => {
	location.reload();
});






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

