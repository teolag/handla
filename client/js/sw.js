var IDB = require("./storage.js");
var storage = new IDB("handla", 1);
const STORE_NAME = "offlineMessages";

const cacheName = 'version_25';

const cachedFiles = [
	'/',
	'manifest.json',
	'script.js',
	'style.css',
	'icon/basket_256.png',
	'icon/basket_64.png',
	'icon/basket.svg',
	'icon/icons.svg'
];

self.addEventListener('activate', e => {
	console.log("SW: Activate new service worker.");

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
	console.log("SW: Installing service worker");
	e.waitUntil(
		caches.open(cacheName).then(cache => {
			return cache.addAll(cachedFiles).then(function() {
				console.log("SW: Installation complete");
				//self.skipWaiting();
			});
		})
	);
});

self.addEventListener('fetch', e => {
	//console.log("SW: fetcha", e.request.url);
	e.respondWith(
		caches.match(e.request).then(function(response) {
			if(response) {
				//console.log("SW: get from cache", response.url);
				return response;
			}
			//console.log("SW: get from server", e.request.url);
			return fetch(e.request);
		})
	);
});

self.addEventListener('sync', e => {
	console.log("SW: Sync started");
	if (e.tag == 'offlineChanges') {
		e.waitUntil(sync());
	}

	function sync() {
		return storage.getAll(STORE_NAME)
			.then(messages => postMessagesToSync(messages))
			.then(response => response.json())
			.then(json => handleServerResponse(json))
			.catch(err => console.error("SW: Error syncing", err));

		function postMessagesToSync(messages) {

			console.log("SW: All messages to send", messages);

			return fetch('/syncItems', {
				method: 'POST',
				body: JSON.stringify(messages),
				headers: new Headers({"Content-Type": "application/json"})
			}).catch(e => {
				throw new Error("Failed to post offline messages");
			});
		}

		function handleServerResponse(data) {
			console.log("SW: server response", data);

			console.log("All synced!  Clear all messages in idb");
			storage.clear(STORE_NAME);
			/*
			storage.getAll("items", "_id").then(items => {
				items
					.filter(item => {
						return data.savedTempIds.indexOf(item._id) > -1 ||
							data.deletedIds.indexOf(item._id) > -1;
					})
					.forEach((item, i, arr) => {
						storage.delete("items", item.id).then(function() {
							if(i === arr.length-1) {
								console.log("SW: last delete complete!");
								notifyClientsToRefresh();
							}
						});
					}
				);
			});
			*/
		}

		function notifyClientsToRefresh() {
			self.clients.matchAll().then(function(clients) {
				console.log("SW: temp items deleted, send message to", clients.length, "clients");

	            clients.forEach(function(client) {
	                client.postMessage("updateList");
	            });
	        });
		}
	}
});