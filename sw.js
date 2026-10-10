/* পরিবর্তন PWA — Service Worker
 * কৌশল:
 *  - HTML পেজ      : Network-first (নেট থাকলে সবসময় নতুন), না থাকলে ক্যাশ, তারপর offline.html
 *  - নিজের CSS/JS : Network-first (সবসময় নতুন কোড), না থাকলে ক্যাশ
 *  - নিজের ছবি/আইকন: Stale-while-revalidate
 *  - ফন্ট/CDN     : Stale-while-revalidate
 *  - Supabase API : কখনো ক্যাশ হবে না (লগইন/লেখার ডেটা সবসময় লাইভ)
 *  - Supabase ছবি : ক্যাশ হবে (public storage)
 *
 * নতুন ভার্সন দিলে নিচের VERSION বাড়ান।
 */
const VERSION = 'v3';
const STATIC_CACHE  = `pb-static-${VERSION}`;
const RUNTIME_CACHE = `pb-runtime-${VERSION}`;
const OFFLINE_URL = './offline.html';
const SHELL_URL   = './index.html';
const NETWORK_TIMEOUT_MS = 4000;

const PRECACHE = [
  './',
  './index.html',
  './offline.html',
  './manifest.webmanifest',
  './pwa.js',
  './css/style.css',
  './js/01-supabase-config.js',
  './js/02-admin-panel.js',
  './js/03-admin-login.js',
  './js/04-main.js',
  './js/05-bookmarks.js',
  './js/06-modal-flag.js',
  './js/07-no-zoom.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/favicon-32.png'
];

// অন্য ডোমেইনের যেসব স্ক্রিপ্ট/ফন্ট/স্টাইল ক্যাশ করা নিরাপদ
const CACHEABLE_CDN_HOSTS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn.jsdelivr.net',
  'unpkg.com',
  'fonts.maateen.me'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => Promise.all(PRECACHE.map((u) => cache.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = [STATIC_CACHE, RUNTIME_CACHE];
    const names = await caches.keys();
    await Promise.all(names.filter((n) => !keep.includes(n)).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Supabase: API/লগইন কখনো ক্যাশ নয়, শুধু public storage-এর ছবি ক্যাশ হবে
  if (url.hostname.endsWith('.supabase.co')) {
    if (url.pathname.startsWith('/storage/v1/object/public/')) {
      event.respondWith(staleWhileRevalidate(req, RUNTIME_CACHE, event));
    }
    return; // বাকিগুলো সরাসরি নেটওয়ার্কে যাবে
  }

  // পেজ নেভিগেশন
  if (req.mode === 'navigate') {
    event.respondWith(networkFirstPage(req));
    return;
  }

  // নিজের সাইটের CSS/JS: নেট থাকলে সবসময় নতুন, না থাকলে ক্যাশ
  if (url.origin === self.location.origin &&
      (req.destination === 'script' || req.destination === 'style')) {
    event.respondWith(networkFirstAsset(req, STATIC_CACHE));
    return;
  }

  // নিজের সাইটের অন্য ফাইল (আইকন, ছবি ইত্যাদি)
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(req, STATIC_CACHE, event));
    return;
  }

  // অনুমোদিত CDN / ফন্ট
  if (CACHEABLE_CDN_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(req, RUNTIME_CACHE, event));
  }
});

/* ---------- helpers ---------- */

async function networkFirstPage(req) {
  const cache = await caches.open(STATIC_CACHE);
  try {
    const res = await withTimeout(fetch(req), NETWORK_TIMEOUT_MS);
    if (res && res.ok) {
      const u = new URL(req.url);
      const key = (u.pathname === '/' || u.pathname.endsWith('/index.html')) ? SHELL_URL : req;
      cache.put(key, res.clone());
    }
    return res;
  } catch (err) {
    const u = new URL(req.url);
    const key = (u.pathname === '/' || u.pathname.endsWith('/index.html')) ? SHELL_URL : req;
    const cached = await cache.match(key, { ignoreSearch: true })
                || await cache.match(SHELL_URL)
                || await cache.match('./');
    return cached || cache.match(OFFLINE_URL);
  }
}

async function networkFirstAsset(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await withTimeout(fetch(req), NETWORK_TIMEOUT_MS);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const cached = await cache.match(req);
    return cached || Response.error();
  }
}

async function staleWhileRevalidate(req, cacheName, event) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);

  const network = fetch(req).then((res) => {
    // opaque (no-cors) রেসপন্সও ক্যাশ করা যায়
    if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
    return res;
  }).catch(() => null);

  // ব্যাকগ্রাউন্ডে আপডেট চালু রাখা
  event.waitUntil(network);

  return cached || (await network) || Response.error();
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then((v) => { clearTimeout(t); resolve(v); },
                 (e) => { clearTimeout(t); reject(e); });
  });
}
