// Retired root service worker: clears old caches so the games hub loads fresh. Balloon Shooter has its own worker in /balloon-shooter/.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(caches.keys().then((k) => Promise.all(k.map((x) => caches.delete(x)))).then(() => self.registration.unregister()).then(() => self.clients.matchAll()).then((cs) => cs.forEach((c) => c.navigate(c.url)))));
