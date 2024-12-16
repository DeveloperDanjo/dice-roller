// Files to cache
const cacheName = 'diceroller-content-v1';
const contentToCache = [
    './assets/die.css',
    './assets/qdr_192.png',
    './assets/qdr_512.png',
    './assets/roll.css',
    './assets/shared.css',
    './assets/style.css',
    './assets/triangle.svg',
    './diceroller.webmanifest',
    './',
    './index.html',
    './src/componentCss.js',
    './src/die.js',
    './src/index.js',
    './src/randomFacade.js',
    './src/roll.js',
];

// Installing Service Worker
self.addEventListener('install', (e) => {
    console.log('[Service Worker] Install');
    e.waitUntil((async () => {
        const cache = await caches.open(cacheName);
        console.log('[Service Worker] Caching all: app shell and content');
        await cache.addAll(contentToCache);
    })());
});

self.addEventListener("activate", (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => Promise.all(keyList.map((key) => {
            if (key !== cacheName && key.startsWith('diceroller-content-')) {
                return caches.delete(key);
            }
        })))
    );
});

// Fetching content using Service Worker
self.addEventListener('fetch', (e) => {
    // Cache http and https only, skip unsupported chrome-extension:// and file://...
    const { protocol, origin } = new URL(e.request.url);
    if ((protocol !== 'http:' && protocol !== 'https:') || origin !== self.location.origin) {
        return;
    }

    e.respondWith((async () => {
        const r = await caches.match(e.request);
        console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
        if (r) return r;
        const response = await fetch(e.request);
        const cache = await caches.open(cacheName);
        console.log(`[Service Worker] Caching new resource: ${e.request.url}`);
        cache.put(e.request, response.clone());
        return response;
    })());
});
