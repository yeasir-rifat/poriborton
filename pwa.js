/* পরিবর্তন PWA — রেজিস্ট্রেশন, ইনস্টল বোতাম ও অফলাইন নোটিস */
(function () {
  'use strict';

  // ---------- 1. Service Worker রেজিস্টার ----------
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').catch(function (err) {
        console.warn('Service worker নিবন্ধন ব্যর্থ:', err);
      });
    });
  }

  // ---------- 2. ইনস্টল বোতাম ----------
  var DISMISS_KEY = 'pb_install_dismissed_at';
  var DISMISS_DAYS = 7;

  var isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (isStandalone) return; // আগে থেকেই অ্যাপ হিসেবে চললে কিছু দেখানোর দরকার নেই

  var dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
  if (dismissedAt && Date.now() - dismissedAt < DISMISS_DAYS * 864e5) return;

  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  var deferredPrompt = null;

  // CSS (ইনজেক্ট করা হচ্ছে যাতে আলাদা ফাইল লাগে না)
  var css = [
    /* ইনস্টল ব্যানার: left/right দিয়ে প্রস্থ নির্ধারণ, তাই ছোট স্ক্রিনেও পুরো প্রস্থ পায় */
    '.pwa-install{position:fixed;left:16px;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));',
    'margin:0 auto;width:auto;max-width:440px;box-sizing:border-box;transform:translateY(170%);',
    'z-index:950;display:flex;align-items:center;gap:12px;padding:12px 14px;',
    'background:#FCF8EE;color:#241B15;border:1px solid rgba(36,27,21,.12);border-radius:8px;',
    'box-shadow:0 12px 30px rgba(36,20,14,.18);font-family:"Hind Siliguri","Noto Sans Bengali",sans-serif;',
    'transition:transform .35s ease;}',
    '.pwa-install.show{transform:translateY(0);}',
    '.pwa-install img{width:44px;height:44px;border-radius:10px;flex:0 0 auto;}',
    '.pwa-install .pwa-txt{flex:1 1 auto;min-width:0;font-size:.98rem;font-weight:600;line-height:1.4;}',
    '.pwa-install .pwa-txt small{display:block;margin-top:2px;color:#5A4C3F;font-size:.8rem;font-weight:400;line-height:1.4;}',
    '.pwa-install button{font:inherit;font-weight:600;border:0;border-radius:6px;padding:9px 16px;cursor:pointer;white-space:nowrap;flex:0 0 auto;}',
    '.pwa-install .pwa-add{background:#6E1F2B;color:#F6F0E2;}',
    '.pwa-install .pwa-x{background:transparent;color:#5A4C3F;padding:8px 6px;font-size:1.3rem;line-height:1;}',
    '@media (max-width:360px){.pwa-install{left:10px;right:10px;gap:9px;padding:10px;}',
    '.pwa-install img{width:38px;height:38px;}.pwa-install .pwa-txt{font-size:.9rem;}',
    '.pwa-install button{padding:8px 12px;}}',
    /* অফলাইন নোটিস */
    '.pwa-offline{position:fixed;top:calc(12px + env(safe-area-inset-top,0px));left:16px;right:16px;margin:0 auto;',
    'width:max-content;max-width:calc(100% - 32px);box-sizing:border-box;text-align:center;white-space:nowrap;',
    'transform:translateY(-200%);z-index:960;background:#241B15;color:#F6F0E2;padding:8px 16px;border-radius:6px;',
    'font-size:.9rem;font-family:"Hind Siliguri","Noto Sans Bengali",sans-serif;transition:transform .3s ease;}',
    '.pwa-offline.show{transform:translateY(0);}'
  ].join('');
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  function buildBar(text, btnLabel, onAdd) {
    var bar = document.createElement('div');
    bar.className = 'pwa-install';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'অ্যাপ ইনস্টল');
    bar.innerHTML =
      '<img src="./icons/icon-192.png" alt="">' +
      '<div class="pwa-txt">' + text + '</div>' +
      '<button type="button" class="pwa-add">' + btnLabel + '</button>' +
      '<button type="button" class="pwa-x" aria-label="বন্ধ করুন">×</button>';
    document.body.appendChild(bar);
    bar.querySelector('.pwa-add').addEventListener('click', onAdd);
    bar.querySelector('.pwa-x').addEventListener('click', function () {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
      hide(bar);
    });
    return bar;
  }

  function show(bar) { requestAnimationFrame(function () { bar.classList.add('show'); }); }
  function hide(bar) { bar.classList.remove('show'); setTimeout(function () { bar.remove(); }, 400); }

  // Android / Chrome / Edge: ব্রাউজারের নিজস্ব ইনস্টল প্রম্পট
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    var bar = buildBar('অ্যাপ হিসেবে ইনস্টল করুন<small>দ্রুত খুলুন, অফলাইনেও পড়ুন</small>', 'ইনস্টল', function () {
      bar.querySelector('.pwa-add').disabled = true;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(function () {
        deferredPrompt = null;
        hide(bar);
      });
    });
    show(bar);
  });

  // iOS Safari: অটো-প্রম্পট নেই, তাই ধাপ দেখানো হয়
  if (isIOS && /safari/i.test(navigator.userAgent) && !/crios|fxios|edgios/i.test(navigator.userAgent)) {
    setTimeout(function () {
      var bar = buildBar(
        'হোম স্ক্রিনে যোগ করুন<small>শেয়ার <b>⬆︎</b> বোতাম → “Add to Home Screen”</small>',
        'বুঝেছি',
        function () { localStorage.setItem(DISMISS_KEY, String(Date.now())); hide(bar); }
      );
      show(bar);
    }, 1500);
  }

  window.addEventListener('appinstalled', function () {
    document.querySelectorAll('.pwa-install').forEach(function (b) { b.remove(); });
  });

  // ---------- 3. অফলাইন নোটিস ----------
  var off = document.createElement('div');
  off.className = 'pwa-offline';
  off.textContent = 'আপনি অফলাইনে আছেন';
  document.body.appendChild(off);
  function syncNet() { off.classList.toggle('show', !navigator.onLine); }
  window.addEventListener('online', syncNet);
  window.addEventListener('offline', syncNet);
  syncNet();
})();
