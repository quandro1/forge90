FORGE 90 — installable app bundle
=================================
These 7 files ARE the app. Upload the whole folder to any https host and
open the URL on your phone; the browser will then offer "Install app" /
"Add to Home Screen" and it will work offline afterwards.

  index.html              the app itself
  manifest.webmanifest    name, icon, colours, "open full-screen"
  sw.js                   offline cache (service worker)
  icon-192 / 512 / maskable / apple-touch-icon

Two things to know:
 * It must be served over https (or localhost). Opening index.html by
   double-click still works, but a local file cannot install or cache.
 * If you change index.html, bump CACHE at the top of sw.js, or phones
   that already installed it will keep serving the old copy.

Free hosts that work as-is: GitHub Pages, Netlify drop, Cloudflare Pages.
