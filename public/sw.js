// we'll version our cache (and learn how to delete caches in
// some other post)
const cacheName = 'v1::static';

const cachedFiles = [
	'/',
	'main.js',
	'sockerClient.js',
	'style.css'
];


self.addEventListener('install', e => {
	// once the SW is installed, go ahead and fetch the resources
	// to make this work offline
	console.log("installing");
	e.waitUntil(
		caches.open(cacheName).then(cache => {
			return cache.addAll(cachedFiles).then(() => self.skipWaiting());
		})
	);
});

// when the browser fetches a url, either response with
// the cached object or go ahead and fetch the actual url
self.addEventListener('fetch', event => {
	console.log("fetcha", event.request.url);
	event.respondWith(
		caches.match(event.request).then(function(response) {
			if(response) {
				console.log("get from cache", response.url);
				return response;
			}
			console.log("get from server");
			return fetch(event.request);
		})
	);
});