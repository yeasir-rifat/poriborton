পরিবর্তন PWA — ফাইল কাঠামো ও আপডেটের নিয়ম

ফোল্ডার কাঠামো (সব কিছু রিপোর রুটে থাকবে):
  index.html                 শুধু HTML (কাঠামো ও লেখা)
  css/style.css              পুরো সাইটের CSS
  js/01-supabase-config.js   Supabase সংযোগ + লেখার ধরন (GenreStore)
  js/02-admin-panel.js       এডমিন প্যানেলের কোড
  js/03-admin-login.js       এডমিন লগইন
  js/04-main.js              মূল সাইটের কোড
  js/05-bookmarks.js         বুকমার্ক ফিচার
  js/06-modal-flag.js        পপআপ খোলা থাকার ফ্ল্যাগ
  js/07-no-zoom.js           জুম বন্ধ করার কোড
  pwa.js, sw.js, manifest.webmanifest, offline.html, vercel.json
  icons/, splash/

জরুরি নিয়ম:
- js ফাইলের নামের ক্রম (01 থেকে 07) বদলাবেন না। index.html এ এই ক্রমেই লোড হয়,
  এবং প্রতিটি স্ক্রিপ্ট নিজের নির্দিষ্ট জায়গায় বসানো আছে। ফাইল এক করবেন না।
- GitHub-এ আগে আপলোড করা পুরোনো index.html, sw.js ওভাররাইট করুন।
- ভবিষ্যতে CSS/JS/HTML বদলালে sw.js এর VERSION (v2 -> v3) বাড়ান।
- রিপোতে আগে থেকে vercel.json থাকলে headers অংশ মার্জ করুন।
