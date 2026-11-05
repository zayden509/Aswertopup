// Service worker Awens Topup: sit la louvri vit e li mache menm lè koneksyon an fèb.
// - Paj yo: rezo a an premye (toujou dènye vèsyon an), sinon kopi ki sou telefòn nan.
// - Fichye /assets/ yo (non yo chanje chak vèsyon): kopi telefòn nan an premye.
// - Foto yo: kopi telefòn nan touswit, epi mete l ajou an kachèt.
// - /api/ ak Firebase pa janm sou kopi: kòb ak kòmand yo toujou an dirèk.
const VERSION = "awens-v2";
const PAGES = `${VERSION}-pages`;
const ASSETS = `${VERSION}-assets`;
const IMAGES = `${VERSION}-images`;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(PAGES).then((c) => c.add("/")).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (!key.startsWith(VERSION)) await caches.delete(key);
    await self.clients.claim();
  })());
});

async function limit(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (const key of keys.slice(0, Math.max(0, keys.length - max))) await cache.delete(key);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok) (await caches.open(PAGES)).put(url.pathname, res.clone());
        return res;
      } catch {
        return (await caches.match(url.pathname)) || (await caches.match("/")) || Response.error();
      }
    })());
    return;
  }

  if (url.pathname.startsWith("/assets/") && !/\.(png|jpe?g|webp|gif|svg)$/i.test(url.pathname)) {
    event.respondWith((async () => {
      const hit = await caches.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) {
        (await caches.open(ASSETS)).put(req, res.clone());
        limit(ASSETS, 80);
      }
      return res;
    })());
    return;
  }

  if (/\.(png|jpe?g|webp|gif|svg|ico)$/i.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(IMAGES);
      const hit = await cache.match(req);
      const fresh = fetch(req).then((res) => {
        if (res.ok) {
          cache.put(req, res.clone());
          limit(IMAGES, 120);
        }
        return res;
      }).catch(() => hit);
      return hit || fresh;
    })());
  }
});

// Notifikasyon push: sèvè a voye { title, body, url, tag }
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Awens Topup", body: event.data?.text() || "" };
  }
  event.waitUntil(self.registration.showNotification(data.title || "Awens Topup", {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/favicon-48.png",
    tag: data.tag || undefined,
    data: { url: data.url || "/" },
  }));
});

// Peze notifikasyon an: louvri sit la (oswa fenèt ki deja louvri a) sou bon paj la
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const win = wins.find((w) => new URL(w.url).origin === self.location.origin);
    if (win) {
      await win.focus();
      return win.navigate(url).catch(() => {});
    }
    return self.clients.openWindow(url);
  })());
});
