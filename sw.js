const CACHE="atlas-v0.66";
/* the 3D body and Three.js are big and rarely change: they live in their own cache that survives app updates
   (a new model gets a new file name, corpo-11.glb / corpo-f-9.glb, and a new cache name, which drops the old model) */
const C3D="atlas-3d-12";   // 0.60: corpo-11.glb / corpo-f-8.glb (mannequin head, natural jaw)
// (before)   // 0.43: Three.js now comes from the app itself (vendor/three); same cache name so the models are not downloaded again
const CORE=["./","./index.html","./manifest.webmanifest","./icon-180.png","./icon-192.png","./icon-512.png","./icon-mask-512.png","./logo.png","./design2.css","./design2.js","./logo-m.png","./how/pt.json","./how/en.json","./how/es.json","./sync.js","./fonts/fonts.css","./fonts/barlow-condensed-latin-500-normal.woff2","./fonts/barlow-condensed-latin-600-normal.woff2","./fonts/barlow-condensed-latin-700-italic.woff2","./fonts/barlow-condensed-latin-700-normal.woff2","./fonts/barlow-condensed-latin-800-italic.woff2","./fonts/barlow-condensed-latin-800-normal.woff2","./fonts/barlow-condensed-latin-900-italic.woff2","./fonts/barlow-condensed-latin-900-normal.woff2","./fonts/barlow-latin-400-normal.woff2","./fonts/barlow-latin-500-normal.woff2","./fonts/barlow-latin-600-normal.woff2","./fonts/barlow-latin-700-normal.woff2"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k!==C3D).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const req=e.request;if(req.method!=="GET")return;
  // network first for the page (so updates arrive), cache fallback offline
  if(req.mode==="navigate"){
    const app=/\/(index\.html)?$/.test(new URL(req.url).pathname);   // only the app page itself is kept as the offline copy (0.61)
    e.respondWith(fetch(req.url,{cache:"no-cache",credentials:"same-origin"}).then(r=>{if(r.ok&&app&&r.type==="basic"){const c=r.clone();caches.open(CACHE).then(k=>k.put("./index.html",c))}return r}).catch(()=>caches.match("./index.html")));
    return;
  }
  if(/\.glb$/.test(req.url)||req.url.includes("/vendor/three/")){
    e.respondWith(caches.open(C3D).then(c=>c.match(req).then(hit=>hit||fetch(req).then(r=>{if(r.ok)c.put(req,r.clone());return r}))));return}
  // other sites (Google sign-in, the Firestore database, photos; fonts and the Firebase code are kept): straight to the network, never cached (0.23)
  const u=new URL(req.url);
  if(u.origin!==location.origin&&!/^https:\/\/(www\.gstatic\.com\/firebasejs\/|fonts\.(googleapis|gstatic)\.com\/)/.test(req.url))return;
  // cache first for icons, fonts, the Firebase code and everything else of the app
  e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{if(r.ok){const c=r.clone();caches.open(CACHE).then(k=>k.put(req,c))}return r})));   // errors are never cached (0.61)
});
