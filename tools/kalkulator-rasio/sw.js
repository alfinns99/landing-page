const CACHE_NAME = 'gst-rasio-v1';
const ASSETS = [
    './',
    './index.html',
    './script.js',
    './style.css',
    '../../assets/css/style.css',
    '../../assets/img/logo-gesit.png',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.2/font/bootstrap-icons.css',
    'https://fonts.googleapis.com/css?family=Raleway:100,200,300,400,500,600,700,800,900&display=swap'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
