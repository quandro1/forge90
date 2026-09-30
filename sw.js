/* FORGE 90 service worker — offline shell.
   CACHE is stamped per build: bump it on every publish or an installed copy
   keeps serving the old app. The document is network-FIRST so a republish
   reaches the phone as soon as it has signal; assets are cache-first.
   Precaching is idempotent and never fatal: a repeated install must not
   throw "Entry already exists", and a failed warm-up must not block the
   worker — the fetch handler fills the cache on first use anyway. */
const CACHE = 'forge90-2026-10-01-b';
const ASSETS = ['./', './manifest.webmanifest', './icon-192.png', './icon-512.png',
                './icon-maskable-512.png', './apple-touch-icon.png'];

async function warm(c, url){
  try{
    if(await c.match(url)) return;                  // already there: never re-put
    const r = await fetch(url, {cache:'reload'});
    if(r && r.ok) await c.put(url, r);
  }catch(e){ /* offline at install, 404, or a concurrent install won the race */ }
}

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    try{
      const c = await caches.open(CACHE);
      for(const u of ASSETS) await warm(c, u);      // sequential: no self-inflicted races
    }catch(e){}
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    try{
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    }catch(e){}
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try{ url = new URL(req.url); }catch(err){ return; }
  if (url.origin !== self.location.origin) return;   // never touch the platform's own calls

  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        if (fresh && fresh.ok) {
          const c = await caches.open(CACHE);
          try{ await c.put('./', fresh.clone()); }catch(err){}
        }
        return fresh;
      } catch (err) {
        return (await caches.match('./')) || (await caches.match(req)) || new Response(
          '<meta name=viewport content="width=device-width,initial-scale=1">'+
          '<body style="font:16px system-ui;background:#0D1317;color:#E6EDF1;padding:40px 24px">'+
          '<h2>FORGE 90</h2><p>Offline, and this device has not cached the app yet. '+
          'Open it once with a connection and it will work offline from then on.</p>',
          {headers:{'content-type':'text/html; charset=utf-8'}});
      }
    })());
    return;
  }

  e.respondWith((async () => {
    const hit = await caches.match(req);
    if (hit) return hit;
    try {
      const fresh = await fetch(req);
      if (fresh && fresh.status === 200 && fresh.type === 'basic') {
        const c = await caches.open(CACHE);
        try{ await c.put(req, fresh.clone()); }catch(err){}
      }
      return fresh;
    } catch (err) {
      return new Response('', {status: 504, statusText: 'offline'});
    }
  })());
});
