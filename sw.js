/* Daybook offline cache. Bump VERSION whenever the app files change. */
var VERSION = 'daybook-v1';
var SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
/* Serve from the cache first so the app opens with no connection; refresh the copy in the background when online. */
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(caches.open(VERSION).then(function (cache) {
    return cache.match(req, { ignoreSearch: true }).then(function (hit) {
      var fresh = fetch(req).then(function (res) { if (res && res.ok) cache.put(req, res.clone()); return res; });
      if (hit) { fresh.catch(function () {}); return hit; }
      return fresh.catch(function () { return cache.match('index.html'); });
    });
  }));
});
