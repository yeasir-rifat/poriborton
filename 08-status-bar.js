/* পরিবর্তন — ডাইনামিক স্ট্যাটাস বার
 * মোবাইলের ওপরের বার (সময়, নেটওয়ার্ক, ব্যাটারি) এর রং <meta name="theme-color"> থেকে আসে।
 * এখানে পর্দার একদম ওপরে এই মুহূর্তে যা দেখা যাচ্ছে (হেডার, পড়ার পেজের থিম, পপআপের ছায়া ইত্যাদি)
 * তার আসল রং স্তরে স্তরে মিশিয়ে মাপা হয় এবং সেই রংই স্ট্যাটাস বারে বসানো হয়।
 * কোনো পেজ বা থিমের নাম ধরা নেই, তাই ভবিষ্যতে নতুন পেজ/থিম যোগ করলেও নিজে থেকে মানিয়ে নেবে।
 */
(function () {
  'use strict';

  var PAPER = [246, 240, 226];   // #F6F0E2, সাইটের ডিফল্ট কাগজি রং
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }

  var current = '';
  var rafId = 0, pendingFast = 0, pendingLate = 0;

  function num(p) { return parseFloat(p); }

  // "rgb(…)" / "rgba(…)" → [r, g, b, a]
  function parseColor(str) {
    var m = /rgba?\(([^)]+)\)/.exec(str || '');
    if (!m) return null;
    var parts = m[1].replace('/', ' ').split(/[\s,]+/).filter(Boolean);
    if (parts.length < 3) return null;
    var ch = [0, 1, 2].map(function (i) {
      return /%$/.test(parts[i]) ? num(parts[i]) * 2.55 : num(parts[i]);
    });
    var a = 1;
    if (parts.length > 3) a = /%$/.test(parts[3]) ? num(parts[3]) / 100 : num(parts[3]);
    if (isNaN(ch[0]) || isNaN(ch[1]) || isNaN(ch[2]) || isNaN(a)) return null;
    return [ch[0], ch[1], ch[2], a];
  }

  // নিজের ও সব অভিভাবকের opacity গুণ করে আসল স্বচ্ছতা
  function opacityOf(el) {
    var o = 1;
    for (var n = el; n && n.nodeType === 1; n = n.parentElement) {
      var v = num(getComputedStyle(n).opacity);
      if (!isNaN(v)) o *= v;
      if (o < 0.02) return 0;
    }
    return o;
  }

  function hex2(v) {
    v = Math.max(0, Math.min(255, Math.round(v)));
    return (v < 16 ? '0' : '') + v.toString(16);
  }

  // পর্দার ওপরের প্রান্তে (মাঝখানের পিক্সেল) সব স্তর নিচ থেকে ওপরে মিশিয়ে রং বের করা
  function sample() {
    var list = document.elementsFromPoint
      ? document.elementsFromPoint(Math.round(window.innerWidth / 2), 1) : [];
    var r = PAPER[0], g = PAPER[1], b = PAPER[2];
    for (var i = list.length - 1; i >= 0; i--) {
      var el = list[i];
      // খুব পাতলা সাজসজ্জা (যেমন স্ক্রল-প্রগ্রেস রেখা) ধর্তব্য নয়
      if (el.getBoundingClientRect().height < 8) continue;
      var cs = getComputedStyle(el);
      if (cs.visibility === 'hidden') continue;
      var bg = parseColor(cs.backgroundColor);
      if (!bg || bg[3] <= 0) continue;
      var a = bg[3] * opacityOf(el);
      if (a <= 0) continue;
      r = r * (1 - a) + bg[0] * a;
      g = g * (1 - a) + bg[1] * a;
      b = b * (1 - a) + bg[2] * a;
    }
    return '#' + hex2(r) + hex2(g) + hex2(b);
  }

  function apply() {
    var hex;
    try { hex = sample(); } catch (e) { return; }
    if (hex !== current) {
      current = hex;
      meta.setAttribute('content', hex);
    }
  }

  // স্ক্রল/রিসাইজ: প্রতি ফ্রেমে সর্বোচ্চ একবার
  function onFrame() {
    if (rafId) return;
    rafId = requestAnimationFrame(function () { rafId = 0; apply(); });
  }

  // পেজ/থিম/পপআপ বদল: একবার দ্রুত, আরেকবার ট্রানজিশন শেষে
  function settle() {
    if (!pendingFast) pendingFast = setTimeout(function () { pendingFast = 0; apply(); }, 90);
    if (!pendingLate) pendingLate = setTimeout(function () { pendingLate = 0; apply(); }, 460);
  }

  window.addEventListener('scroll', onFrame, { passive: true });
  window.addEventListener('resize', onFrame);
  window.addEventListener('orientationchange', settle);
  window.addEventListener('hashchange', settle);
  window.addEventListener('pageshow', settle);
  window.addEventListener('load', settle);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) settle(); });

  try {
    new MutationObserver(settle).observe(document.documentElement, {
      attributes: true, subtree: true,
      attributeFilter: ['class', 'style', 'data-rtheme', 'hidden']
    });
  } catch (e) {}

  window.PBStatusBar = { update: apply };
  apply();
})();
