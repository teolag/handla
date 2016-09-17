const cacheName = 'v1::static';

const cachedFiles = [
	'/',
	'main.js',
	'sockerClient.js',
	'config.js',
	'style.css'
];


self.addEventListener('install', e => {
	console.log("Installing service worker");
	e.waitUntil(
		caches.open(cacheName).then(cache => {
			return cache.addAll(cachedFiles).then(function() {
				console.log("Installation complete");
				self.skipWaiting();
			});
		})
	);
});

self.addEventListener('fetch', event => {
	console.log("fetcha", event.request.url);
	event.respondWith(
		caches.match(event.request).then(function(response) {
			if(response) {
				console.log("get from cache", response.url);
				return response;
			}
			console.log("get from server", response.url);
			return fetch(event.request);
		})
	);
});