/* 支线任务清单 PWA Service Worker */
const CACHE = 'side-quest-v1';
const ASSETS = [
  './',
  './index.html',
  './支线任务清单.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

/* 安装：预缓存核心资源 */
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(cache){
      return cache.addAll(ASSETS).catch(function(err){
        console.warn('[SW] precache partial:', err);
      });
    }).then(function(){ return self.skipWaiting(); })
  );
});

/* 激活：清理旧缓存 */
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; })
            .map(function(k){ return caches.delete(k); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

/* 请求：离线优先 */
self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function(hit){
      return hit || fetch(e.request).then(function(resp){
        /* 仅缓存同源成功响应 */
        if(resp && resp.ok && new URL(e.request.url).origin === self.location.origin){
          var clone = resp.clone();
          caches.open(CACHE).then(function(cache){ cache.put(e.request, clone); });
        }
        return resp;
      }).catch(function(){
        /* 离线且未命中时回退到首页 */
        if(e.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});