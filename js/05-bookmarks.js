
/* ============================================================
   লেখার মাঝখানে বুকমার্ক
   - যেকোনো অনুচ্ছেদের পাশের বুকমার্ক আইকনে ক্লিক করলে সেখানে বুকমার্ক বসে (প্রতি লেখায় একটি)
   - যে লেখায় বুকমার্ক আছে, তার কার্ডে "বুকমার্ক করা আছে" ব্যাজ দেখা যায়
   - সেই কার্ডে ক্লিক করলে সরাসরি বুকমার্ক করা স্থানে খুলবে
   ============================================================ */
(function(){
  const KEY = 'parivartan_para_bookmarks';
  const readingPage = document.getElementById('reading-page');
  const body = document.getElementById('readBody');
  if (!readingPage || !body) return;

  const ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>';
  const ARROW_UP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>';
  const ARROW_DOWN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  const toBn = n => String(n).replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]);

  function load(){
    if (window.__pbParaLoad) return window.__pbParaLoad();
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch(e){ return {}; }
  }
  function save(all){ try { localStorage.setItem(KEY, JSON.stringify(all)); } catch(e){} }
  const curId = () => String(readingPage.dataset.currentId || '');

  // ---- ছোট টোস্ট ----
  const toast = document.createElement('div');
  toast.className = 'bm-toast'; toast.setAttribute('role','status');
  document.body.appendChild(toast);
  let tt;
  function say(msg){
    toast.textContent = msg; toast.classList.add('show');
    clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 2400);
  }

  // ---- ভাসমান বোতাম ----
  const floatBtn = document.createElement('button');
  floatBtn.type = 'button'; floatBtn.className = 'bm-float';
  document.body.appendChild(floatBtn);

  // ---- বুকমার্ক মোড (উপরের বুকমার্ক বোতামে চালু/বন্ধ) ----
  const topBtn = document.getElementById('readBookmarkBtn');
  const hint = document.createElement('div');
  hint.className = 'bm-mode-hint'; hint.id = 'bmModeHint';
  hint.innerHTML = '<div>' + ICON.replace('<svg','<svg style="width:18px;height:18px;flex-shrink:0;fill:none;stroke:var(--read-accent);stroke-width:2"') +
    '<span>যে অনুচ্ছেদে বুকমার্ক রাখতে চান, তার পাশের আইকনে ট্যাপ করুন</span><button type="button">বাতিল</button></div>';
  body.parentNode.insertBefore(hint, body);
  hint.querySelector('button').addEventListener('click', () => setMode(false));

  function setMode(on){
    body.classList.toggle('bm-mode', on);
    hint.classList.toggle('show', on);
    if (topBtn){
      topBtn.classList.toggle('bm-mode-on', on);
      topBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      const t = on ? 'বুকমার্ক মোড বন্ধ করুন' : 'লেখার মাঝে বুকমার্ক রাখুন';
      topBtn.title = t; topBtn.setAttribute('aria-label', t);
    }
  }
  function syncTopBtn(){
    if (topBtn) topBtn.classList.toggle('bm-has', !!findBlock(load()[curId()]));
  }
  if (topBtn){
    // আগের "পুরো লেখা সংরক্ষণ" আচরণের বদলে এখন এই বোতাম বুকমার্ক মোড চালু/বন্ধ করে
    topBtn.addEventListener('click', e => {
      e.stopImmediatePropagation();
      setMode(!body.classList.contains('bm-mode'));
    }, true);
  }

  const blocks = () => Array.from(body.children).filter(el => el.classList.contains('bm-block'));
  const snip = el => (el.textContent || '').replace(/\s+/g,' ').trim().slice(0, 60);

  // সংরক্ষিত বুকমার্কের জন্য সঠিক অনুচ্ছেদ খোঁজা (ইনডেক্স না মিললে লেখা দিয়ে খোঁজা)
  function findBlock(bm){
    const list = blocks();
    if (!bm) return null;
    const byIdx = list[bm.p];
    if (byIdx && snip(byIdx) === bm.s) return byIdx;
    return list.find(el => snip(el) === bm.s) || byIdx || null;
  }

  function decorate(){
    setMode(false);
    // প্রতিটি অনুচ্ছেদে আইকন বসানো
    Array.from(body.children).forEach((el, i) => {
      el.classList.add('bm-block');
      el.dataset.pi = i;
      el.classList.remove('is-bookmarked','bm-flash');
      el.querySelector(':scope > .bm-flag')?.remove();
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'bm-flag'; b.contentEditable = 'false';
      b.setAttribute('aria-label', 'এখানে বুকমার্ক রাখুন'); b.title = 'এখানে বুকমার্ক রাখুন';
      b.innerHTML = ICON;
      el.insertBefore(b, el.firstChild);
    });
    paintBookmark();
    renderBanner();
    refreshBadges();
    updateFloat();
    syncTopBtn();
  }

  function paintBookmark(){
    blocks().forEach(el => el.classList.remove('is-bookmarked'));
    const bm = load()[curId()];
    const el = findBlock(bm);
    if (el) el.classList.add('is-bookmarked');
    blocks().forEach(b => {
      const on = b.classList.contains('is-bookmarked');
      const f = b.querySelector(':scope > .bm-flag');
      if (f){ const t = on ? 'বুকমার্ক সরান' : 'এখানে বুকমার্ক রাখুন'; f.title = t; f.setAttribute('aria-label', t); }
    });
  }

  // ---- লেখার শুরুতে ব্যানার ----
  function renderBanner(){
    document.getElementById('bmBanner')?.remove();
    const bm = load()[curId()];
    const el = findBlock(bm);
    if (!el) return;
    const wrap = document.createElement('div');
    wrap.className = 'bm-banner'; wrap.id = 'bmBanner';
    wrap.innerHTML = '<div class="bm-banner-inner">' + ICON +
      '<div class="bm-txt">এই লেখায় আপনার একটি বুকমার্ক আছে<small>' + toBn(Number(el.dataset.pi) + 1) + ' নম্বর অনুচ্ছেদ</small></div>' +
      '<div class="bm-actions"><button type="button" class="bm-go">বুকমার্কে যান</button>' +
      '<button type="button" class="bm-del">সরান</button></div></div>';
    wrap.querySelector('.bm-go').addEventListener('click', () => jump(true));
    wrap.querySelector('.bm-del').addEventListener('click', removeBookmark);
    body.parentNode.insertBefore(wrap, body);
  }

  // ---- বুকমার্কে যাওয়া ----
  function jump(smooth){
    const el = findBlock(load()[curId()]);
    if (!el) return;
    try { el.scrollIntoView({ block:'start', behavior: smooth ? 'smooth' : 'instant' }); }
    catch(e){ el.scrollIntoView(true); }
    el.classList.remove('bm-flash'); void el.offsetWidth; el.classList.add('bm-flash');
  }

  function setBookmark(el){
    if (window.__pbNeedLogin && window.__pbNeedLogin(curId())) return;
    const all = load();
    all[curId()] = { p: Number(el.dataset.pi), s: snip(el), t: Date.now() };
    save(all);
    if (window.__pbParaSync) window.__pbParaSync(curId(), all[curId()]);
    setMode(false); paintBookmark(); renderBanner(); refreshBadges(); updateFloat(); syncTopBtn();
    say('এখানে বুকমার্ক রাখা হয়েছে');
  }
  function removeBookmark(){
    const all = load(); delete all[curId()]; save(all);
    if (window.__pbParaSync) window.__pbParaSync(curId(), null);
    setMode(false); paintBookmark(); renderBanner(); refreshBadges(); updateFloat(); syncTopBtn();
    say('বুকমার্ক সরানো হয়েছে');
  }

  window.__pbParaRefresh = function(){ if (readingPage.classList.contains('is-active')) paintBookmark(); renderBanner(); refreshBadges(); updateFloat(); syncTopBtn(); };
  body.addEventListener('click', e => {
    const f = e.target.closest('.bm-flag');
    if (!f) return;
    const el = f.parentElement;
    if (el.classList.contains('is-bookmarked')) removeBookmark(); else setBookmark(el);
  });

  // ---- ভাসমান বোতাম: বুকমার্ক স্ক্রিনে না থাকলে দেখায় ----
  let raf = 0;
  function updateFloat(){
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const el = readingPage.classList.contains('is-active') ? findBlock(load()[curId()]) : null;
      if (!el){ floatBtn.classList.remove('in'); floatBtn.classList.remove('show'); return; }
      const r = el.getBoundingClientRect();
      const above = r.bottom < 70, below = r.top > window.innerHeight - 40;
      if (above || below){
        floatBtn.innerHTML = (above ? ARROW_UP : ARROW_DOWN) + 'বুকমার্কে ফিরুন';
        floatBtn.classList.add('show');
        requestAnimationFrame(() => floatBtn.classList.add('in'));
      } else {
        floatBtn.classList.remove('in');
        setTimeout(() => { if (!floatBtn.classList.contains('in')) floatBtn.classList.remove('show'); }, 260);
      }
    });
  }
  floatBtn.addEventListener('click', () => jump(true));
  window.addEventListener('scroll', updateFloat, { passive:true });
  window.addEventListener('resize', updateFloat);

  // ---- কার্ডে ব্যাজ ----
  function refreshBadges(){
    const all = load();
    document.querySelectorAll('.write-card[data-article]').forEach(card => {
      const bm = all[card.dataset.article];
      card.querySelector(':scope > .bm-badge')?.remove();
      card.querySelector(':scope > .bm-resume')?.remove();
      card.classList.toggle('has-bm', !!bm);
      if (!bm) { card.removeAttribute('data-bm'); return; }
      card.dataset.bm = '1';
      const badge = document.createElement('span');
      badge.className = 'bm-badge';
      badge.innerHTML = ICON + 'বুকমার্ক করা আছে';
      card.appendChild(badge);
      const hint = document.createElement('span');
      hint.className = 'bm-resume';
      hint.textContent = 'ক্লিক করলে ' + toBn(bm.p + 1) + ' নম্বর অনুচ্ছেদ থেকে পড়া শুরু হবে';
      const tag = card.querySelector('.tag');
      const meta = card.querySelector('.meta');
      if (meta) card.insertBefore(hint, meta); else card.appendChild(hint);
    });
  }

  // কার্ডে (বুকমার্কসহ) ক্লিক করলে লেখা খুলে সরাসরি সেখানে যাবে
  function markJump(e){
    const card = e.target.closest && e.target.closest('.write-card[data-article]');
    if (card && card.dataset.bm === '1') window.__bmJump = card.dataset.article;
  }
  document.addEventListener('click', markJump, true);
  document.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') markJump(e); }, true);

  // ---- লেখা খোলার হুক ----
  const origOpen = window.openReadingArticle;
  window.openReadingArticle = function(id){
    if (origOpen) origOpen(id);
    decorate();
    if (window.__bmJump && String(window.__bmJump) === String(id)){
      window.__bmJump = null;
      setTimeout(() => { jump(false); say('আপনার বুকমার্ক করা স্থানে নেওয়া হয়েছে'); }, 120);
    }
  };
  const origAuthor = window.openAuthorPage;
  if (origAuthor) window.openAuthorPage = function(id){ origAuthor(id); refreshBadges(); };

  window.addEventListener('hashchange', () => { setTimeout(() => { refreshBadges(); updateFloat(); }, 0); });
  window.addEventListener('storage', e => { if (e.key === KEY){ paintBookmark(); renderBanner(); refreshBadges(); updateFloat(); } });

  // পেজ লোডের সময় আগে থেকেই কোনো লেখা খোলা থাকলে
  refreshBadges();
  if (readingPage.classList.contains('is-active') && readingPage.dataset.currentId) decorate();
})();
