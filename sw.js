const CACHE="atlas-v0.12";
/* the 3D body and Three.js are big and rarely change: they live in their own cache that survives app updates
   (a new model gets a new file name, corpo-3.glb, and a new cache name, which drops the old model) */
const C3D="atlas-3d-2";
const CORE=["./","./index.html","./manifest.webmanifest","./icon-180.png","./icon-192.png","./icon-512.png","./how/pt.json","./how/en.json","./how/es.json"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k!==C3D).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const req=e.request;if(req.method!=="GET")return;
  // network first for the page (so updates arrive), cache fallback offline
  if(req.mode==="navigate"){
    e.respondWith(fetch(req.url,{cache:"no-cache",credentials:"same-origin"}).then(r=>{if(r.ok){const c=r.clone();caches.open(CACHE).then(k=>k.put("./index.html",c))}return r}).catch(()=>caches.match("./index.html")));
    return;
  }
  if(/\.glb$/.test(req.url)||req.url.startsWith("https://cdn.jsdelivr.net/npm/three@")){
    e.respondWith(caches.open(C3D).then(c=>c.match(req).then(hit=>hit||fetch(req).then(r=>{if(r.ok)c.put(req,r.clone());return r}))));return}
  // cache first for icons, fonts and everything else
  e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{const c=r.clone();caches.open(CACHE).then(k=>k.put(req,c));return r})));
});
