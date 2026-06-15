const CACHE='papa-v1';
const ASSETS=['/','index.html','/manifest.json'];

self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS).catch(()=>{})));
});

self.addEventListener('activate',e=>{
  e.waitUntil(Promise.all([
    clients.claim(),
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
  ]));
});

self.addEventListener('fetch',e=>{
  // Only cache GET requests, skip API calls
  if(e.request.method!=='GET'||e.request.url.includes('/api/'))return;
  e.respondWith(
    fetch(e.request).catch(()=>caches.match(e.request))
  );
});

// Push notifications
self.addEventListener('push',e=>{
  const data=e.data?e.data.json():{};
  e.waitUntil(self.registration.showNotification(data.title||'Personal PA Pro',{
    body:data.body||'You have a reminder',
    icon:'/icon-192.png',
    badge:'/icon-192.png',
    tag:data.tag||'reminder'
  }));
});

self.addEventListener('notificationclick',e=>{
  e.notification.close();
  e.waitUntil(clients.matchAll({type:'window'}).then(cs=>{
    for(const c of cs)if('focus' in c)return c.focus();
    if(clients.openWindow)return clients.openWindow('/');
  }));
});
