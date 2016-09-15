// we'll version our cache (and learn how to delete caches in
// some other post)
const cacheName = 'v1::static';

self.addEventListener('install', e => {
	// once the SW is installed, go ahead and fetch the resources
	// to make this work offline
	console.log("installing");
	e.waitUntil(
		caches.open(cacheName).then(cache => {
			return cache.addAll(['/', 'main.js', 'style.css']).then(() => self.skipWaiting());
		})
	);
});

// when the browser fetches a url, either response with
// the cached object or go ahead and fetch the actual url
self.addEventListener('fetch', event => {
	console.log("fetcha", event);
	event.respondWith(
		caches.match(event.request).then(res => res || fetch(event.request))
	);
});