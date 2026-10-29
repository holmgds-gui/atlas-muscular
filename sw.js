const CACHE="atlas-v61";
const CORE=["./","./index.html","./manifest.webmanifest","./icon-180.png","./icon-192.png","./icon-512.png","./how/pt.json","./how/en.json","./how/es.json"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const req=e.request;if(req.method!=="GET")return;
  // network first for the page (so updates arrive), cache fallback offline
  if(req.mode==="navigate"){
    e.respondWith(fetch(req.url,{cache:"no-cache",credentials:"same-origin"}).then(r=>{if(r.ok){const c=r.clone();caches.open(CACHE).then(k=>k.put("./index.html",c))}return r}).catch(()=>caches.match("./index.html")));
    return;
  }
  // cache first for icons, fonts and everything else
  e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{const c=r.clone();caches.open(CACHE).then(k=>k.put(req,c));return r})));
});
