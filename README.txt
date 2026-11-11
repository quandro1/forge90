FORGE 90 — installable training app
===================================
The app is these files, served from any https host (this repo is served by
GitHub Pages). Open the URL on a phone and the browser offers "Install app" /
"Add to Home Screen"; after one visit it works offline.

  index.html              the app itself (BUILT — do not edit by hand)
  manifest.webmanifest    name, icon, colours, "open full-screen"
  sw.js                   offline cache (service worker)
  icon-192 / 512 / maskable / apple-touch-icon

Changing the app
  src/index.template.html   page shell
  src/styles.css            all styling
  src/js/*.js               the scripts, concatenated in file-name order
  tools/build.mjs           node tools/build.mjs   -> writes index.html and
                            renames the offline cache in sw.js by itself
  tests/                    node tests/run.mjs     -> drives the built page in
                            headless Chrome on an emulated phone

Publish: build, run the tests, commit, push to main. Phones pick the new
build up the next time they open the app with a connection.

It must be served over https (or localhost). Opening index.html by
double-click still works, but a local file cannot install or cache.
