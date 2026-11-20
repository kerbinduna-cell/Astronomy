// Service Worker: speichert die App für die Nutzung ohne Netz (z. B. auf dem Berg)
const VERSION='nab-v3-2';
const FILES=["./", "index.html", "manifest.webmanifest", "css/app.css", "vendor/three.min.js", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "js/catalog.js", "js/core/astro.js", "js/core/gear.js", "js/core/targets.js", "js/core/nebula.js", "js/core/imaging.js", "js/ui/chart.js", "js/ui/lexikon.js", "js/ui/gearpanel.js", "js/ui/setup.js", "js/ui/gallery.js", "js/app/state.js", "js/scene/world.js", "js/scene/rig.js", "js/app/input.js", "js/app/windows.js", "js/ui/scope.js", "js/ui/camera.js", "js/ui/processing.js", "js/ui/targetlist.js", "js/ui/knobs.js", "js/app/hud.js", "js/app/tutorial.js", "js/app/main.js"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;
 e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{if(r.ok&&new URL(e.request.url).origin===location.origin){const cp=r.clone();caches.open(VERSION).then(c=>c.put(e.request,cp))}return r}).catch(()=>hit)))});
