/* Generated at build time; contains only this release's public game assets. */
const CACHE = '__CACHE_NAME__';
const ASSETS = __ASSET_LIST__;
const BASE = new URL(self.registration.scope).pathname;
self.addEventListener('install', event => {
 event.waitUntil((async()=>{
  try { const cache=await caches.open(CACHE);await cache.addAll(ASSETS.map(url=>new Request(url,{cache:'reload'}))); }
  catch(error){await caches.delete(CACHE);throw error;}
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  for(const key of await caches.keys())if(key.startsWith('brunya-offline-'+encodeURIComponent(BASE)+'-')&&key!==CACHE)await caches.delete(key);
  await self.clients.claim();
 })());
});
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_UPDATE')self.skipWaiting();});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  const key=request.mode==='navigate'&&(url.pathname===BASE||url.pathname===BASE+'index.html')?BASE:url.pathname;
  if(ASSETS.includes(key)){const cached=await cache.match(key);if(cached)return cached;}
  return fetch(request);
 })());
});
