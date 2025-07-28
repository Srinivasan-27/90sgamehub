const CACHE_NAME = '90s-game-hub-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
  "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap",
  "https://mighty27.s3.eu-north-1.amazonaws.com/90'sgamehub/images/checkers.png",
  "https://mighty27.s3.eu-north-1.amazonaws.com/90'sgamehub/images/snake.png",
  "https://mighty27.s3.eu-north-1.amazonaws.com/90'sgamehub/images/chess.png",
  "https://mighty27.s3.eu-north-1.amazonaws.com/90'sgamehub/images/maze.png",
  "https://mighty27.s3.eu-north-1.amazonaws.com/90'sgamehub/images/2048.png",
  "https://mighty27.s3.eu-north-1.amazonaws.com/90'sgamehub/images/flappy.png",
  "https://mighty27.s3.eu-north-1.amazonaws.com/90'sgamehub/images/hand.webp",
  "https://mighty27.s3.eu-north-1.amazonaws.com/90'sgamehub/images/memory.png",
  "https://mighty27.s3.eu-north-1.amazonaws.com/90'sgamehub/images/mine.png",
  "https://mighty27.s3.eu-north-1.amazonaws.com/90'sgamehub/images/rabbit.png",
  "https://mighty27.s3.eu-north-1.amazonaws.com/90'sgamehub/images/rps.png",
  "https://mighty27.s3.eu-north-1.amazonaws.com/90'sgamehub/images/tetris.png",
  "https://mighty27.s3.eu-north-1.amazonaws.com/90'sgamehub/images/ttt.png",
  "https://mighty27.s3.eu-north-1.amazonaws.com/90'sgamehub/images/truth.png",
  "https://mighty27.s3.eu-north-1.amazonaws.com/90'sgamehub/images/water.png",
  "https://mighty27.s3.eu-north-1.amazonaws.com/90'sgamehub/images/whack.webp",
  "https://mighty27.s3.eu-north-1.amazonaws.com/90'sgamehub/images/word.png"
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});