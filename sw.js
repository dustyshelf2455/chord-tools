// Offline support for the home-screen app: network first so updates arrive at once, cache as the fallback when there is no connection.
const CACHE='chord-tools-v1';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET')return;
  const u=new URL(r.url), fonts=/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if(u.origin!==location.origin&&!fonts)return;
  if(fonts){
    e.respondWith(caches.open(CACHE).then(c=>c.match(r).then(hit=>hit||fetch(r).then(res=>{c.put(r,res.clone());return res}))));
  }else{
    e.respondWith(fetch(r).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(r,copy))}return res})
      .catch(()=>caches.match(r,{ignoreSearch:true}).then(hit=>hit||Response.error())));
  }
});
