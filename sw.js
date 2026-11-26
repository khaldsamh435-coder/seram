
const CACHE_NAME = "one-gym-v6";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./home.html",
  "./people.html"
];

// تثبيت Service Worker وتخزين الملفات
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// تفعيل النسخة الجديدة وحذف التخزين القديم
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith("one-gym-") && name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// جلب الصفحات مع محاولة الحصول على أحدث نسخة من السيرفر
self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.ok) {
          const responseCopy = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseCopy);
          });
        }

        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);

        if (cached) return cached;

        if (request.mode === "navigate") {
          return caches.match("./index.html");
        }

        return new Response("غير متصل بالإنترنت", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      })
  );
});
