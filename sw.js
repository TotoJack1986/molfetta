const V='molfetta-v2', TILES='molfetta-tiles-v2', MAX_TILES=900;
const SHELL=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png',["https://unpkg.com/leaflet-ant-path@1.3.0/dist/leaflet-ant-path.min.js", "https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css", "https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js", "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css", "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css", "https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js", "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css", "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"]];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V&&k!==TILES).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
async function trim(c){const ks=await c.keys(); if(ks.length>MAX_TILES) for(const k of ks.slice(0,ks.length-MAX_TILES)) await c.delete(k);}
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET') return; const u=new URL(r.url);
  if(u.hostname==='tile.openstreetmap.org'){ // tessere mappa: cache-first, le aree viste restano offline
    e.respondWith(caches.open(TILES).then(async c=>{const h=await c.match(r); if(h) return h;
      try{const n=await fetch(r); if(n.ok||n.type==='opaque'){c.put(r,n.clone()); trim(c);} return n;}catch(x){return h||Response.error();}}));
    return;
  }
  if(u.origin===location.origin){ // app: rete per prima (aggiornamenti subito), cache se offline
    e.respondWith(fetch(r).then(n=>{if(n.ok){const k=n.clone(); caches.open(V).then(c=>c.put(r,k));} return n;}).catch(()=>caches.match(r,{ignoreSearch:true}).then(h=>h||caches.match('./index.html'))));
    return;
  }
  if(u.hostname==='unpkg.com'){ // app e librerie: cache, aggiornate in background
    e.respondWith(caches.open(V).then(async c=>{const h=await c.match(r,{ignoreSearch:true});
      const net=fetch(r).then(n=>{if(n.ok) c.put(r,n.clone()); return n;}).catch(()=>null);
      return h||net||Response.error();}));
  }
});
