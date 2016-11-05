(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{}],2:[function(require,module,exports){
var IDB = require("./storage.js");
var storage = new IDB("handla", 1, function(e) {console.log("update idb from sw", e)});

const cacheName = 'version_22';

const cachedFiles = [
	'/',
	'script.js',
	'style.css'
];

self.addEventListener('activate', e => {
	console.log("Activate new service worker.");

	e.waitUntil(
		caches.keys().then(function(keyList) {
			return Promise.all(keyList.map(function(key) {
				if(key !== cacheName) {
					return caches.delete(key);
				}
			}));
		})
	);
});


self.addEventListener('message', e => {
	if (e.data.action === 'skipWaiting') {
		self.skipWaiting();
	}
});

self.addEventListener('install', e => {
	console.log("Installing service worker");
	e.waitUntil(
		caches.open(cacheName).then(cache => {
			return cache.addAll(cachedFiles).then(function() {
				console.log("Installation complete");
				//self.skipWaiting();
			});
		})
	);
});

self.addEventListener('fetch', e => {
	//console.log("fetcha", e.request.url);
	e.respondWith(
		caches.match(e.request).then(function(response) {
			if(response) {
				//console.log("get from cache", response.url);
				return response;
			}
			//console.log("get from server", e.request.url);
			return fetch(e.request);
		})
	);
});

self.addEventListener('sync', e => {
	console.log("SYNC!");
	if (e.tag == 'itemsToSync') {
		e.waitUntil(sync());
	}

	function sync() {
		return storage.getAll("items")
			.then(items => postItemsToSync(items))
			.then(response => response.json())
			.then(json => handleServerResponse(json))
			.catch(err => console.log("Error syncing", err));

		function postItemsToSync(items) {
			var newItems = items.filter(item => item.localOnly && !item.deleted);
			var itemIdsToDelete = items
				.filter(item => !item.localOnly && item.deleted)
				.map(item => item._id);
			var data = {newItems: newItems, itemIdsToDelete: itemIdsToDelete};

			console.log(newItems.length, "new items");
			console.log(itemIdsToDelete.length, "items to delete");

			return fetch('/syncItems', {
				method: 'POST',
				body: JSON.stringify(data),
				headers: new Headers({"Content-Type": "application/json"})
			});
		}

		function handleServerResponse(data) {
			console.log("server response after sync", data);

			storage.getAll("items", "_id").then(items => {
				items
					.filter(item => {
						return data.savedTempIds.indexOf(item._id) > -1 ||
							data.deletedIds.indexOf(item._id) > -1;
					})
					.forEach((item, i, arr) => {
						storage.delete("items", item.id).then(function() {
							if(i === arr.length-1) {
								console.log("last delete complete!");
								notifyClientsToRefresh();
							}
						});
					}
				);
			});
		}

		function notifyClientsToRefresh() {
			self.clients.matchAll().then(function(clients) {
				console.log("temp items deleted, send message to", clients.length, "clients");

	            clients.forEach(function(client) {
	            	console.log("send message to client", client);
	                client.postMessage("updateList");
	            })
	        });
		}
	}
});
},{"./storage.js":1}]},{},[2]);
