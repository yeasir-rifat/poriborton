
  // Icons are decorative: if the CDN fails, the rest of the site must still work.
  function renderIcons(){
    try{ if (window.lucide && typeof lucide.createIcons === 'function') lucide.createIcons(); }catch(e){}
  }
  renderIcons();

  // Footer logo: reuse the navbar logo image so it isn't embedded twice.
  (function(){
    const navLogo = document.querySelector('header .brand-logo');
    const footLogo = document.getElementById('footerLogo');
    if (navLogo && footLogo && navLogo.getAttribute('src')){
      footLogo.src = navLogo.getAttribute('src');
      footLogo.closest('.footer-brand').classList.add('has-logo');
    }
  })();

  // Admin panel logo: reuse the navbar logo image (same approach as the footer) so it isn't embedded again.
  (function(){
    const navLogo = document.querySelector('header .brand-logo');
    const src = navLogo && navLogo.getAttribute('src');
    if (!src) return;
    [['admSidebarLogo', '.adm-sidebar-brand'], ['admLoginLogo', '.adm-login-brand'], ['admTopbarLogo', '.adm-topbar-brand']].forEach(([id, wrap]) => {
      const img = document.getElementById(id);
      if (!img) return;
      img.src = src;
      img.closest(wrap).classList.add('has-logo');
    });
  })();

  // Keep the drawer/scrim aligned to the real header height (device UI, font
  // scaling, etc. can all shift this), instead of trusting a hardcoded value.
  const headerEl = document.querySelector('header');
  function syncHeaderHeight(){
    if (!headerEl) return;
    // Some webviews (e.g. a file opened from content://downloads/...) report 0 for the
    // header height when measured before layout settles. A 0 here makes the drawer slide
    // up over the header and hide the X button, so ignore implausible values and keep
    // the CSS fallback (72px) until a real measurement is available.
    const h = Math.round(headerEl.getBoundingClientRect().height || headerEl.offsetHeight);
    if (h >= 40) document.documentElement.style.setProperty('--header-h', h + 'px');
  }
  syncHeaderHeight();
  window.addEventListener('resize', syncHeaderHeight);
  window.addEventListener('orientationchange', syncHeaderHeight);
  window.addEventListener('load', syncHeaderHeight);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncHeaderHeight);
  // Re-measure whenever the header itself changes size (font load, logo load, text scaling)
  if (window.ResizeObserver && headerEl) new ResizeObserver(syncHeaderHeight).observe(headerEl);
  // Always re-measure right before the drawer opens, so it can never use a stale value
  const _mt = document.getElementById('menuToggle');
  if (_mt) _mt.addEventListener('click', syncHeaderHeight, true);

  // On phones, move each section's "see more" head-action button to the
  // bottom of that section's content instead of next to the heading.
  // Desktop/tablet/laptop layouts are untouched, this only re-parents the
  // button element for narrow viewports and puts it back above that width.
  (function(){
    const sections = ['writings','magazine','events','gallery'];
    const MOBILE_QUERY = '(max-width:480px)';
    const mq = window.matchMedia(MOBILE_QUERY);
    const moved = new Map(); // id -> {action, originalParent, originalNext}

    sections.forEach(id => {
      const section = document.getElementById(id);
      if (!section) return;
      const action = section.querySelector('.head-action');
      const wrap = section.querySelector(':scope > .wrap');
      if (!action || !wrap) return;
      moved.set(id, { action, originalParent: action.parentNode, originalNext: action.nextSibling, wrap });
    });

    function apply(isMobile){
      moved.forEach(({ action, originalParent, originalNext, wrap }) => {
        if (isMobile){
          if (action.parentNode !== wrap || wrap.lastElementChild !== action){
            wrap.appendChild(action);
            action.classList.add('head-action--bottom');
          }
        } else {
          if (action.parentNode !== originalParent){
            originalParent.insertBefore(action, originalNext);
          }
          action.classList.remove('head-action--bottom');
        }
      });
    }
    apply(mq.matches);
    mq.addEventListener('change', (e) => apply(e.matches));
  })();

  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  const navScrim = document.getElementById('navScrim');

  function setMenu(isOpen){
    navLinks.classList.toggle('open', isOpen);
    menuToggle.classList.toggle('is-open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন');
    if (navScrim) navScrim.classList.toggle('open', isOpen);
    document.body.classList.toggle('nav-open', isOpen);
  }
  menuToggle.addEventListener('click', () => {
    setMenu(!navLinks.classList.contains('open'));
  });
  if (navScrim) navScrim.addEventListener('click', () => setMenu(false));
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) setMenu(false);
  });

  // Reveal on scroll, re-usable observer; call refreshReveal() after showing a
  // previously-hidden page so its .reveal elements (which never intersected
  // while display:none) get animated in too.
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  function refreshReveal(scope){
    (scope || document).querySelectorAll('.reveal:not(.in)').forEach(el => io.observe(el));
  }
  refreshReveal();

  const bnDigits = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
  const toBn = n => String(n).replace(/\d/g, d => bnDigits[d]);

  function pageButton(label, page, onSelect, opts){
    opts = opts || {};
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'page-btn' + (opts.active ? ' active' : '') + (opts.nav ? ' nav-btn' : '');
    btn.innerHTML = label;
    btn.disabled = !!opts.disabled;
    if (!opts.disabled) btn.addEventListener('click', () => onSelect(page));
    return btn;
  }

  function renderPager(pagerEl, current, totalPages, onSelect){
    pagerEl.innerHTML = '';
    if (totalPages <= 1) return;
    pagerEl.appendChild(pageButton('← আগের', current - 1, onSelect, { nav:true, disabled: current === 1 }));
    const pages = [];
    for (let p = 1; p <= totalPages; p++){
      if (p === 1 || p === totalPages || Math.abs(p - current) <= 1) pages.push(p);
    }
    let last = 0;
    pages.forEach(p => {
      if (last && p - last > 1){
        const dots = document.createElement('span');
        dots.className = 'page-ellipsis';
        dots.textContent = '…';
        pagerEl.appendChild(dots);
      }
      pagerEl.appendChild(pageButton(toBn(p), p, onSelect, { active: p === current }));
      last = p;
    });
    pagerEl.appendChild(pageButton('পরের →', current + 1, onSelect, { nav:true, disabled: current === totalPages }));
  }

  // ---------- ধরনের ফিল্টার চিপ: GenreStore (এডমিনের তালিকা) থেকে তৈরি ----------
  window.__renderGenreChips = function(){
    const store = window.GenreStore; if (!store) return;
    const esc = v => String(v).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const names = store.names().slice();
    // তালিকার বাইরের কোনো ধরনের লেখা থাকলেও যেন ফিল্টারে হারিয়ে না যায়
    document.querySelectorAll('#cardGrid .write-card[data-cat], #lekhaCardGrid .write-card[data-cat]').forEach(c => {
      const k = c.dataset.cat; if (k && !names.includes(k)) names.push(k);
    });
    ['homeFilterRow', 'lekhaFilterRow'].forEach(id => {
      const row = document.getElementById(id); if (!row) return;
      const act = row.querySelector('.chip.active');
      const cur = act ? act.dataset.filter : 'all';
      row.innerHTML = '<button type="button" class="chip" role="tab" aria-selected="false" data-filter="all">সব লেখা</button>' +
        names.map(n => '<button type="button" class="chip" role="tab" aria-selected="false" data-filter="' + esc(n) + '">' + esc(n) + '</button>').join('');
      const target = Array.from(row.querySelectorAll('.chip')).find(c => c.dataset.filter === cur) || row.querySelector('.chip');
      target.classList.add('active'); target.setAttribute('aria-selected', 'true');
    });
  };

  // ---------- Home page: Writings filter tabs (no pagination, original behavior) ----------
  window.__initHomeFilter = function(){
    const chips = document.querySelectorAll('#homeFilterRow .chip[data-filter]');
    const cards = document.querySelectorAll('#cardGrid .write-card');
    const emptyNote = document.getElementById('emptyNote');
    if (!chips.length) return;

    chips.forEach(chip => {
      const f = chip.dataset.filter;
      const n = f === 'all' ? cards.length : [...cards].filter(c => c.dataset.cat === f).length;
      const badge = document.createElement('span');
      badge.className = 'count';
      badge.textContent = '(' + n + ')';
      chip.appendChild(badge);
    });

    function applyFilter(filter){
      let visible = 0;
      cards.forEach(card => {
        const match = filter === 'all' || card.dataset.cat === filter;
        card.classList.toggle('is-hidden', !match);
        if (match){
          visible++;
          card.classList.add('in');
          card.classList.remove('fade-in');
          void card.offsetWidth;
          card.classList.add('fade-in');
        }
      });
      emptyNote.classList.toggle('show', visible === 0);
    }

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => { c.classList.remove('active'); c.setAttribute('aria-selected','false'); });
        chip.classList.add('active');
        chip.setAttribute('aria-selected','true');
        applyFilter(chip.dataset.filter);
      });
    });
  };

  // ---------- Lekha subpage: filter (বিভাগ + লেখক পপআপ) + pagination ----------
  // ক্যাটাগরি ট্যাবে চাপ দিলে নির্বাচিত ট্যাব সারির মাঝে চলে আসে (মোবাইলে সারিটি স্ক্রল হয়)
  document.addEventListener('click', e => {
    const c = e.target.closest('.filter-row .chip');
    if (c) c.scrollIntoView({ inline:'center', block:'nearest', behavior:'smooth' });
  });

  window.__initLekha = function(){
    const chips = document.querySelectorAll('#lekhaFilterRow .chip[data-filter]');
    const allCards = Array.from(document.querySelectorAll('#lekhaCardGrid .write-card'));
    const emptyNote = document.getElementById('lekhaEmptyNote');
    const pagerEl = document.getElementById('lekhaPager');
    const filterBar = document.getElementById('lekhaFilterBar');
    const authorBtn = document.getElementById('lekhaAuthorBtn');
    const activeBox = document.getElementById('lekhaAuthorActive');
    const activeName = document.getElementById('lekhaAuthorActiveName');
    const activeClear = document.getElementById('lekhaAuthorActiveClear');
    const listEl = document.getElementById('lekhaAuthorList');
    const searchEl = document.getElementById('lekhaAuthorSearch');
    const applyBtn = document.getElementById('lekhaAuthorApply');
    const resetBtn = document.getElementById('lekhaAuthorReset');
    if (!chips.length) return;
    const PER_PAGE = 9;
    let activeFilter = 'all';
    let activeAuthor = 'all';
    let pendingAuthor = 'all';
    let authorMeta = {};   // name -> { pic }
    let authorNames = [];
    let currentPage = 1;

    const badges = new Map();
    chips.forEach(chip => {
      const badge = document.createElement('span');
      badge.className = 'count';
      chip.appendChild(badge);
      badges.set(chip, badge);
    });

    const matchCat = c => activeFilter === 'all' || c.dataset.cat === activeFilter;
    const matchAuthor = c => activeAuthor === 'all' || c.dataset.author === activeAuthor;
    function getFiltered(){ return allCards.filter(c => matchCat(c) && matchAuthor(c)); }

    // Category counts follow the chosen author.
    function updateCounts(){
      chips.forEach(chip => {
        const f = chip.dataset.filter;
        const n = allCards.filter(c => matchAuthor(c) && (f === 'all' || c.dataset.cat === f)).length;
        badges.get(chip).textContent = '(' + n + ')';
      });
      const on = activeAuthor !== 'all';
      authorBtn.classList.toggle('is-set', on);
      activeBox.classList.toggle('show', on);
      filterBar.classList.toggle('has-tag', on);
      activeName.textContent = on ? activeAuthor : '';
    }

    function renderPage(page){
      const filtered = getFiltered();
      const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
      currentPage = Math.min(Math.max(1, page), totalPages);

      allCards.forEach(c => c.classList.add('is-hidden'));
      filtered.forEach((c, i) => {
        const onPage = Math.floor(i / PER_PAGE) === currentPage - 1;
        c.classList.toggle('is-hidden', !onPage);
        if (onPage){
          c.classList.remove('fade-in');
          void c.offsetWidth;
          c.classList.add('fade-in', 'in');
        }
      });

      emptyNote.textContent = activeAuthor === 'all'
        ? 'এই বিভাগে এখনো কোনো লেখা নেই।'
        : 'এই ফিল্টারে কোনো লেখা পাওয়া যায়নি।';
      emptyNote.classList.toggle('show', filtered.length === 0);
      updateCounts();
      renderPager(pagerEl, currentPage, totalPages, renderPage);
    }

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => { c.classList.remove('active'); c.setAttribute('aria-selected','false'); });
        chip.classList.add('active');
        chip.setAttribute('aria-selected','true');
        activeFilter = chip.dataset.filter;
        renderPage(1);
      });
    });

    // ---- Author popup ----
    function bnNum(n){ return String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]); }

    function renderAuthorList(){
      const q = (searchEl.value || '').trim().toLowerCase();
      listEl.innerHTML = '';
      const rows = [{ name:'all', label:'সব লেখক' }]
        .concat(authorNames.map(n => ({ name:n, label:n })))
        .filter(r => r.name === 'all' ? !q : r.label.toLowerCase().includes(q));

      if (!rows.length){
        const none = document.createElement('div');
        none.className = 'af-none';
        none.textContent = 'এই নামে কোনো লেখক পাওয়া যায়নি।';
        listEl.appendChild(none);
        return;
      }
      rows.forEach(r => {
        const n = allCards.filter(c => matchCat(c) && (r.name === 'all' || c.dataset.author === r.name)).length;
        const label = document.createElement('label');
        label.className = 'af-item';

        const input = document.createElement('input');
        input.type = 'radio'; input.name = 'lekhaAuthor'; input.value = r.name;
        input.checked = pendingAuthor === r.name;
        input.addEventListener('change', () => { pendingAuthor = r.name; });

        const av = document.createElement('span');
        av.className = 'af-av' + (r.name === 'all' ? ' is-all' : '');
        const pic = r.name !== 'all' && authorMeta[r.name] && authorMeta[r.name].pic;
        if (pic){ const im = document.createElement('img'); im.src = pic; im.alt = ''; av.appendChild(im); }
        else av.textContent = r.name === 'all' ? '∗' : r.name.charAt(0);

        const nm = document.createElement('span'); nm.className = 'af-name'; nm.textContent = r.label;
        const ct = document.createElement('span'); ct.className = 'af-count'; ct.textContent = '(' + bnNum(n) + ')';
        const tick = document.createElement('span'); tick.className = 'af-tick';

        label.append(input, av, nm, ct, tick);
        listEl.appendChild(label);
      });
    }

    // The modal itself is opened by the generic [data-open-modal] handler;
    // here we only prepare its contents.
    authorBtn.addEventListener('click', () => {
      pendingAuthor = activeAuthor;
      searchEl.value = '';
      renderAuthorList();
    });
    searchEl.addEventListener('input', renderAuthorList);
    applyBtn.addEventListener('click', () => {
      activeAuthor = pendingAuthor;
      closeModal('lekhaAuthorModal');
      renderPage(1);
    });
    resetBtn.addEventListener('click', () => {
      pendingAuthor = 'all'; activeAuthor = 'all';
      closeModal('lekhaAuthorModal');
      renderPage(1);
    });
    activeClear.addEventListener('click', () => { activeAuthor = 'all'; renderPage(1); });

    // Called from the Reading engine once ARTICLES exists: tag each card with its
    // author, show the real author on the card, and collect the author list.
    window.__lekhaSetAuthors = function(ARTICLES){
      allCards.forEach(card => {
        const a = ARTICLES[card.dataset.article];
        if (!a) return;
        card.dataset.author = a.author;
        const nameEl = card.querySelector('.author-name');
        if (nameEl) nameEl.textContent = a.author;
        const subEl = card.querySelector('.author-sub');
        if (subEl && a.authorSub) subEl.textContent = a.authorSub;
        const av = card.querySelector('.avatar');
        if (av){
          if (a.pic){
            av.textContent = '';
            const im = document.createElement('img');
            im.src = a.pic; im.alt = '';
            av.appendChild(im);
          } else {
            av.textContent = a.author.charAt(0);
          }
        }
        authorMeta[a.author] = { pic: a.pic || '' };
      });
      authorNames = Array.from(new Set(allCards.map(c => c.dataset.author).filter(Boolean)))
        .sort((x, y) => x.localeCompare(y, 'bn'));
      renderPage(currentPage);
    };

    renderPage(1);
    window.__lekhaRenderPage = renderPage;
  };

  // ---------- Generic simple pagination (magazine / onushthan / gallery) ----------
  function setupSimplePagination(gridId, itemSelector, pagerId, perPage){
    const grid = document.getElementById(gridId);
    const pagerEl = document.getElementById(pagerId);
    if (!grid || !pagerEl) return null;
    const items = Array.from(grid.querySelectorAll(itemSelector));
    const totalPages = Math.max(1, Math.ceil(items.length / perPage));
    let current = 1;

    function renderPage(page){
      current = Math.min(Math.max(1, page), totalPages);
      items.forEach((el, i) => {
        const onPage = Math.floor(i / perPage) === current - 1;
        el.style.display = onPage ? '' : 'none';
      });
      renderPager(pagerEl, current, totalPages, renderPage);
    }

    renderPage(1);
    return renderPage;
  }

  window.__initSimplePaginations = function(){
    setupSimplePagination('magGrid', '.mag-card', 'magazinePager', 8);
    setupSimplePagination('eventList', '.tl-item', 'onushthanPager', 5);
    setupSimplePagination('galleryGrid', '.g-item', 'galleryPager', 6);
  };

  // ---------- Modals (Login / Join) ----------
  let lastFocus = null;
  function openModal(id){
    const m = document.getElementById(id);
    if (!m) return;
    document.querySelectorAll('.modal-backdrop.open').forEach(x => closeModal(x.id, true));
    lastFocus = document.activeElement;
    m.classList.add('open');
    m.setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
    setMenu(false);
    renderIcons();
    const first = m.querySelector('input');
    setTimeout(() => first && first.focus(), 120);
  }
  window.openModal = openModal;
  function closeModal(id, keepScrollLock){
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.remove('open');
    m.setAttribute('aria-hidden','true');
    m.querySelectorAll('[data-msg]').forEach(x => { x.className = 'form-msg'; x.textContent = ''; });
    if (!keepScrollLock){
      document.body.classList.remove('modal-open');
      if (lastFocus) lastFocus.focus();
    }
  }

  document.querySelectorAll('[data-open-modal]').forEach(btn =>
    btn.addEventListener('click', () => openModal(btn.dataset.openModal)));
  // Only the site's own modals (.modal-backdrop). Admin modals use .adm-modal-backdrop and close themselves.
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    const bd = btn.closest('.modal-backdrop');
    if (bd) btn.addEventListener('click', () => closeModal(bd.id));
  });
  document.querySelectorAll('[data-switch-modal]').forEach(btn =>
    btn.addEventListener('click', () => openModal(btn.dataset.switchModal)));
  document.querySelectorAll('.modal-backdrop').forEach(bd =>
    bd.addEventListener('click', e => { if (e.target === bd) closeModal(bd.id); }));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape'){
      const open = document.querySelector('.modal-backdrop.open');
      if (open) closeModal(open.id);
    }
  });

  // password show/hide
  document.querySelectorAll('.pw-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.parentElement.querySelector('input');
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.innerHTML = '<i data-lucide="' + (show ? 'eye-off' : 'eye') + '" width="18" height="18"></i>';
      btn.setAttribute('aria-label', show ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখান');
      renderIcons();
    });
  });

  // form validation + feedback (front-end only, hook your backend here)
  const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  function showMsg(form, type, text){
    const box = form.closest('.modal').querySelector('[data-msg]');
    box.className = 'form-msg show ' + type;
    box.textContent = text;
  }
  document.querySelectorAll('form[data-form]').forEach(form => {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type=submit], .btn-primary');
      if (submitBtn && submitBtn.disabled) return;
      const kind = form.dataset.form;
      const inputs = form.querySelectorAll('input:not([type=checkbox])');
      const vals = {}; inputs.forEach(i => vals[i.id] = i.value.trim());
      const interests = kind === 'join' ? Array.from(form.querySelectorAll('input[name=interest]:checked')).map(i => i.value) : [];
      const rawPass = kind === 'login' ? (document.getElementById('loginPass') || {}).value : (document.getElementById('joinPass') || {}).value;

      if (kind === 'login'){
        if (!emailOk(vals.loginEmail)) { showMsg(form,'err','সঠিক ইমেইল ঠিকানা দিন।'); return; }
        if (!rawPass) { showMsg(form,'err','পাসওয়ার্ড দিন।'); return; }
      } else {
        if (!vals.joinName) { showMsg(form,'err','আপনার পূর্ণ নাম লিখুন।'); return; }
        if (!emailOk(vals.joinEmail)) { showMsg(form,'err','সঠিক ইমেইল ঠিকানা দিন।'); return; }
        if (!rawPass || rawPass.length < 6) { showMsg(form,'err','পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'); return; }
      }
      if (!window.sb){ showMsg(form,'err','Supabase এখনো সংযুক্ত নয়।'); return; }

      if (submitBtn) submitBtn.disabled = true;
      let keepDisabled = false;   // set when the card is closing automatically
      try {
        if (kind === 'login'){
          const { error } = await sb.auth.signInWithPassword({ email: vals.loginEmail, password: rawPass });
          if (error){ showMsg(form,'err','ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।'); return; }
          showMsg(form,'ok','লগইন সফল হয়েছে!');
          form.reset();
          // Let the member read the confirmation, then close the card and open the homepage (logged-in state)
          keepDisabled = true;
          const card = form.closest('.modal-backdrop');
          setTimeout(() => {
            if (card) closeModal(card.id);
            if ((location.hash || '#top') !== '#top') location.hash = '#top';   // router shows the homepage
            else window.scrollTo({ top: 0, behavior: 'smooth' });
            if (submitBtn) submitBtn.disabled = false;
          }, 1400);
          return;
        } else {
          const { data, error } = await sb.auth.signUp({
            email: vals.joinEmail, password: rawPass,
            options: { data: { name: vals.joinName, interests: interests } }
          });
          if (error){ showMsg(form,'err','অ্যাকাউন্ট তৈরি করা যায়নি: ' + error.message); return; }
          form.reset();
          if (data.session) showMsg(form,'ok','ধন্যবাদ! আপনার অ্যাকাউন্ট তৈরি হয়েছে।');
          else showMsg(form,'ok','ধন্যবাদ! নিশ্চিত করার জন্য আপনার ইমেইলে একটি লিংক পাঠানো হয়েছে।');
        }
      } finally {
        if (submitBtn && !keepDisabled) submitBtn.disabled = false;
      }
    });
  });
  document.querySelector('[data-forgot]').addEventListener('click', async e => {
    e.preventDefault();
    const f = document.querySelector('form[data-form=login]');
    const mail = (document.getElementById('loginEmail') || {}).value;
    if (!mail || !emailOk(mail.trim())){ showMsg(f,'err','রিসেট লিংকের জন্য উপরে আপনার ইমেইল ঠিকানা দিন।'); return; }
    if (!window.sb){ showMsg(f,'err','Supabase এখনো সংযুক্ত নয়।'); return; }
    const { error } = await sb.auth.resetPasswordForEmail(mail.trim(), { redirectTo: location.href.split('#')[0] });
    showMsg(f, error ? 'err' : 'ok', error ? 'রিসেট লিংক পাঠানো যায়নি।' : 'পাসওয়ার্ড রিসেট লিংক ইমেইলে পাঠানো হয়েছে।');
  });

  // Keep the nav in sync with the real Supabase session (survives refresh)
  if (window.sb){
    sb.auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
    sb.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
      setTimeout(() => window.dispatchEvent(new CustomEvent('pb-auth')), 0);   // কলব্যাকের ভেতরে সরাসরি Supabase কল নয়
    });
  }

  // ---------- সদস্য হোন -> লেখা পাঠান (login-state swap, driven by Supabase session) ----------
  function setLoggedIn(on){
    document.getElementById('navLoginBtn').style.display = on ? 'none' : '';
    document.getElementById('navJoinBtn').style.display = on ? 'none' : '';
    document.getElementById('navSubmitBtn').style.display = on ? '' : 'none';
    document.getElementById('navLogoutBtn').style.display = on ? '' : 'none';
    document.getElementById('heroJoinBtn').style.display = on ? 'none' : '';
    document.getElementById('heroSubmitBtn').style.display = on ? '' : 'none';
    renderIcons();
  }

  // Close the mobile drawer if it is open (uses the existing menu toggle, so its state stays in sync)
  function closeDrawerIfOpen(){
    const nl = document.getElementById('navLinks'), mt = document.getElementById('menuToggle');
    if (nl && mt && nl.classList.contains('open')) mt.click();
  }
  // Members: log out from the drawer (or header on desktop) and close the menu
  document.getElementById('navLogoutBtn').addEventListener('click', async function(){
    closeDrawerIfOpen();
    if (window.sb){ try { await sb.auth.signOut(); } catch (err) {} }
  });
  // Login / join open a modal: close the drawer so it does not stay behind the modal
  document.querySelectorAll('#navLinks .btn[data-open-modal]').forEach(b => b.addEventListener('click', closeDrawerIfOpen));

  // Header background on scroll
  const header = document.querySelector('header');
  window.addEventListener('scroll', () => {
    header.style.boxShadow = window.scrollY > 40 ? '0 4px 20px rgba(36,20,14,0.08)' : 'none';
  });

  // ---------- প্রোফাইল পিকচার কম্প্রেশন: মাঝখান থেকে বর্গাকারে কেটে ছোট করে WebP তে রূপান্তর ----------
  window.compressProfilePic = function(file, opts){
    opts = opts || {};
    const maxSide = opts.size || 320;          // সর্বোচ্চ প্রস্থ/উচ্চতা (px)
    const quality = opts.quality || 0.78;      // WebP কোয়ালিটি
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const side = Math.min(img.naturalWidth, img.naturalHeight);
        const out = Math.min(maxSide, side);
        const c = document.createElement('canvas');
        c.width = c.height = out;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, out, out);
        URL.revokeObjectURL(url);
        c.toBlob(blob => {
          if (!blob){ reject(new Error('convert-failed')); return; }
          const r = new FileReader();
          r.onload = () => resolve({ dataUrl: r.result, blob: blob, type: blob.type, bytes: blob.size });
          r.onerror = () => reject(new Error('read-failed'));
          r.readAsDataURL(blob);
        }, 'image/webp', quality);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('load-failed')); };
      img.src = url;
    });
  };
  window.fmtPicSize = function(bytes){
    const bn = n => String(n).replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]);
    if (bytes < 1024) return bn(bytes) + ' বাইট';
    if (bytes < 1024 * 1024) return bn((bytes / 1024).toFixed(1)) + ' KB';
    return bn((bytes / (1024 * 1024)).toFixed(1)) + ' MB';
  };

  // ---------- লেখা পাঠান (Submit Writing), standalone page ----------
  (function(){
    const page = document.getElementById('lekha-joma-page');
    if (!page) return;

    const form = document.getElementById('jomaForm');
    const successBox = document.getElementById('jomaSuccess');
    let genre = 'কবিতা';
    let picFile = null;
    let picDataUrl = '';

    // ---- লেখকের তথ্য একবার দিলে সংরক্ষিত থাকবে (ব্যাকএন্ড যুক্ত হলে ইউজার প্রোফাইলে সংরক্ষণ হবে) ----
    const PROFILE_KEY = 'parivartan_author_profile';
    const nameEl = document.getElementById('jomaName');
    const facultyEl = document.getElementById('jomaFaculty');
    const batchEl = document.getElementById('jomaBatch');
    const bioEl = document.getElementById('jomaBio');
    const savedNote = document.getElementById('jomaSavedNote');
    const bioCount = document.getElementById('jomaBioCount');
    const bnDigits = n => String(n).replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]);

    function dataUrlToFile(dataUrl, filename){
      try {
        const parts = dataUrl.split(',');
        const mime = (parts[0].match(/:(.*?);/) || [])[1] || 'image/webp';
        const bin = atob(parts[1]);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        return new File([arr], filename, { type: mime });
      } catch (e) { return null; }
    }
    function readProfile(){
      let d = null;
      try { d = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null'); } catch (e) {}
      const p = window.__pbProfile;      // লগইন থাকলে Supabase প্রোফাইল (loadMe থেকে)
      if (p){
        d = Object.assign({}, d || {});
        ['name', 'faculty', 'batch', 'bio'].forEach(k => { if (p[k]) d[k] = p[k]; });
        if (!d.pic && p.avatar_url) d.pic = p.avatar_url;
      }
      return d;
    }
    function saveProfile(){
      const data = {
        name: nameEl.value.trim(), faculty: facultyEl.value, batch: batchEl.value.trim(),
        bio: bioEl.value.trim(), pic: picDataUrl || ''
      };
      const hasAny = data.name || data.faculty || data.batch || data.bio || data.pic;
      try {
        if (hasAny) localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
        else localStorage.removeItem(PROFILE_KEY);
      } catch (e) { /* স্টোরেজ ভর্তি বা বন্ধ থাকলে চুপচাপ এড়িয়ে যাই */ }
      savedNote.classList.toggle('show', !!(hasAny && data.name && data.faculty && data.batch));
    }
    function applyProfile(){
      const d = readProfile();
      if (!d) { savedNote.classList.remove('show'); return; }
      nameEl.value = d.name || '';
      facultyEl.value = d.faculty || '';
      batchEl.value = d.batch || '';
      bioEl.value = d.bio || '';
      bioCount.textContent = bnDigits(bioEl.value.length);
      if (d.pic){
        picDataUrl = d.pic;
        picImg.src = d.pic;
        picPreview.classList.add('has-img');
        picFile = dataUrlToFile(d.pic, 'profile.webp');
      }
      savedNote.classList.toggle('show', !!(d.name && d.faculty && d.batch));
    }

    // ---- প্রোফাইল পিকচার আপলোড ----
    const picPreview = document.getElementById('jomaPicPreview');
    const picImg = document.getElementById('jomaPicImg');
    const picInput = document.getElementById('jomaPicInput');
    const picBtn = document.getElementById('jomaPicBtn');
    function openPicPicker(){ picInput.click(); }
    picPreview.addEventListener('click', openPicPicker);
    picPreview.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openPicPicker(); } });
    picBtn.addEventListener('click', openPicPicker);
    const picInfo = document.getElementById('jomaPicInfo');
    picInput.addEventListener('change', async () => {
      const f = picInput.files[0];
      picInput.value = '';
      if (!f) return;
      if (!/^image\/(png|jpe?g)$/i.test(f.type)){ picInfo.textContent = 'শুধু JPG / PNG ছবি দেওয়া যাবে'; return; }
      if (f.size > 10 * 1024 * 1024){ picInfo.textContent = 'ছবি সর্বোচ্চ ১০MB হতে পারবে'; return; }
      picInfo.textContent = 'ছবি কম্প্রেস হচ্ছে…';
      try {
        const r = await window.compressProfilePic(f);
        // কম্প্রেসড WebP ফাইল: এটিই সার্ভারে আপলোড হবে
        picFile = new File([r.blob], 'profile.webp', { type: r.type });
        picImg.src = r.dataUrl;
        picPreview.classList.add('has-img');
        picInfo.textContent = (r.type === 'image/webp' ? 'WebP · ' : 'কম্প্রেসড · ') + window.fmtPicSize(r.bytes) + ' (আগে ' + window.fmtPicSize(f.size) + ')';
        picDataUrl = r.dataUrl;
        saveProfile();
      } catch (err) {
        picInfo.textContent = 'ছবিটি প্রসেস করা যায়নি, অন্য ছবি দিন';
      }
    });

    // ---- বায়োডাটা অক্ষর গণনা ----
    bioEl.addEventListener('input', () => { bioCount.textContent = bnDigits(bioEl.value.length); });

    // লেখকের তথ্যের যেকোনো ফিল্ড বদলালে সংরক্ষণ
    [nameEl, facultyEl, batchEl, bioEl].forEach(el => el.addEventListener('input', saveProfile));
    facultyEl.addEventListener('change', saveProfile);

    // ---- লেখার ধরন (genre chips) ----
    // মূল ধরনগুলো এডমিন প্যানেলের তালিকা (GenreStore) থেকে আসে। লেখক নিজের নতুন ধরন যোগ, এডিট ও ডিলেট করতে পারেন;
    // লেখা অনুমোদনের সময় সেই ধরন স্বয়ংক্রিয়ভাবে মূল তালিকায় যুক্ত হয়, ফলে পুরো সাইটে ধরন একই থাকে।
    const genreGrid = document.getElementById('jomaGenreGrid');
    const genreAddBtn = document.getElementById('jomaGenreAddBtn');
    const GS = window.GenreStore;
    const CUSTOM_KEY = 'pb_custom_genres';
    const MAX_CUSTOM = 5, MAX_LEN = 24;
    const gEsc = v => String(v).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const gNorm = v => String(v || '').replace(/\s+/g, ' ').trim();
    let customGenres = [];
    try {
      const raw = JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]');
      if (Array.isArray(raw)) customGenres = raw.filter(x => typeof x === 'string' && gNorm(x)).slice(0, MAX_CUSTOM);
    } catch (e) {}
    let addBox = null;
    let editingCustom = null;     // এডিট চলাকালীন নিজস্ব ধরনের পুরনো নাম

    const masterNames = () => GS ? GS.names() : [];
    const activeCustoms = () => customGenres.filter(c => !masterNames().includes(c));   // মূল তালিকায় চলে গেলে আর আলাদা দেখানো হয় না
    const saveCustom = () => { try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(customGenres)); } catch (e) {} };

    function markActive(){
      genreGrid.querySelectorAll('button[data-genre]').forEach(b => {
        const on = b.dataset.genre === genre;
        b.classList.toggle('active', on);
        const w = b.closest('.genre-custom'); if (w) w.classList.toggle('is-active', on);
      });
    }
    function updateAddBtn(){
      genreAddBtn.style.display = (addBox || activeCustoms().length >= MAX_CUSTOM) ? 'none' : '';
    }
    function renderGenreChips(){
      genreGrid.querySelectorAll('[data-gchip]').forEach(n => n.remove());
      const masters = masterNames(), customs = activeCustoms();
      if (!masters.includes(genre) && !customs.includes(genre)) genre = masters[0] || customs[0] || '';
      const frag = document.createDocumentFragment();
      masters.forEach(n => {
        const b = document.createElement('button');
        b.type = 'button'; b.dataset.genre = n; b.dataset.gchip = '1'; b.textContent = n;
        frag.appendChild(b);
      });
      customs.forEach(n => {
        const w = document.createElement('span');
        w.className = 'genre-custom'; w.dataset.gchip = '1';
        w.innerHTML = '<button type="button" data-genre="' + gEsc(n) + '">' + gEsc(n) + '</button>' +
          '<button type="button" class="g-act g-edit" data-gedit="' + gEsc(n) + '" title="এডিট করুন" aria-label="' + gEsc(n) + ' এডিট করুন"><i data-lucide="pencil" width="14" height="14"></i></button>' +
          '<button type="button" class="g-act g-del" data-gdel="' + gEsc(n) + '" title="মুছুন" aria-label="' + gEsc(n) + ' মুছুন"><i data-lucide="trash-2" width="14" height="14"></i></button>';
        frag.appendChild(w);
      });
      genreGrid.insertBefore(frag, genreAddBtn);
      updateAddBtn(); markActive(); renderIcons();
    }

    genreGrid.addEventListener('click', e => {
      const ed = e.target.closest('[data-gedit]');
      if (ed){ openAddBox(ed.dataset.gedit); return; }
      const del = e.target.closest('[data-gdel]');
      if (del){ deleteCustom(del.dataset.gdel); return; }
      const btn = e.target.closest('button[data-genre]');
      if (btn){ genre = btn.dataset.genre; markActive(); }
    });

    function deleteCustom(name){
      if (!confirm('“' + name + '” ধরনটি মুছে ফেলবেন?')) return;
      customGenres = customGenres.filter(c => c !== name);
      saveCustom();
      if (genre === name) genre = masterNames()[0] || '';
      if (editingCustom === name) closeAddBox();
      renderGenreChips();
    }
    function closeAddBox(){
      if (addBox){ addBox.remove(); addBox = null; }
      editingCustom = null;
      updateAddBtn();
    }
    function openAddBox(editName){
      if (addBox) closeAddBox();
      editingCustom = (typeof editName === 'string' && editName) ? editName : null;
      genreAddBtn.style.display = 'none';
      addBox = document.createElement('span');
      addBox.className = 'genre-add-box';
      addBox.innerHTML = '<input type="text" maxlength="' + MAX_LEN + '" placeholder="নতুন ধরনের নাম" aria-label="নতুন লেখার ধরন">' +
        '<button type="button" class="g-ok">' + (editingCustom ? 'সংরক্ষণ' : 'যুক্ত করুন') + '</button>' +
        '<button type="button" class="g-cancel" aria-label="বাতিল">✕</button>';
      genreGrid.appendChild(addBox);
      const input = addBox.querySelector('input');
      if (editingCustom) input.value = editingCustom;
      input.focus();
      const confirmAdd = () => {
        const val = gNorm(input.value).slice(0, MAX_LEN);
        if (!val){ input.focus(); return; }
        const low = val.toLowerCase();
        const dupMaster = masterNames().find(n => n.toLowerCase() === low);
        if (dupMaster){ genre = dupMaster; closeAddBox(); renderGenreChips(); return; }   // মূল তালিকায় থাকলে সেটিই বেছে নেওয়া হয়
        const dupCustom = customGenres.find(n => n.toLowerCase() === low && n !== editingCustom);
        if (dupCustom){ genre = dupCustom; closeAddBox(); renderGenreChips(); return; }
        if (editingCustom){
          const i = customGenres.indexOf(editingCustom);
          if (i > -1) customGenres[i] = val; else customGenres.push(val);
          if (genre === editingCustom) genre = val;
        } else {
          if (customGenres.length >= MAX_CUSTOM){ closeAddBox(); return; }
          customGenres.push(val);
          genre = val;
        }
        saveCustom(); closeAddBox(); renderGenreChips();
      };
      addBox.querySelector('.g-ok').addEventListener('click', confirmAdd);
      addBox.querySelector('.g-cancel').addEventListener('click', closeAddBox);
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter'){ e.preventDefault(); confirmAdd(); }
        else if (e.key === 'Escape'){ closeAddBox(); }
      });
    }
    genreAddBtn.addEventListener('click', () => openAddBox());
    function resetGenreSelection(){
      closeAddBox();
      genre = masterNames()[0] || '';
      renderGenreChips();
    }
    renderGenreChips();
    if (GS) GS.onChange(renderGenreChips);

    // ---- Rich Text Editor টুলবার ----
    const editor = document.getElementById('jomaEditor');
    const toolbar = document.getElementById('jomaRteToolbar');
    toolbar.querySelectorAll('button[data-cmd]').forEach(btn => btn.addEventListener('click', () => {
      editor.focus();
      const cmd = btn.dataset.cmd;
      const val = btn.dataset.value || null;
      document.execCommand(cmd, false, val);
    }));

    // ---- পূর্ণ স্ক্রিন লেখার মোড ----
    const writeField = document.getElementById('jomaWriteField');
    const fsBtn = document.getElementById('jomaFsBtn');
    const fsCount = document.getElementById('jomaFsCount');
    const toBnDigits = n => String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
    function updateFsCount(){
      const t = (editor.innerText || '').trim();
      fsCount.textContent = 'শব্দ: ' + toBnDigits(t ? t.split(/\s+/).length : 0);
    }
    // মোবাইলে কিবোর্ড উঠলে লেখার জায়গা যেন কিবোর্ডের ওপরেই থাকে
    function syncFsViewport(){
      const vv = window.visualViewport;
      if (!vv) return;
      writeField.style.setProperty('--fs-top', vv.offsetTop + 'px');
      writeField.style.setProperty('--fs-h', vv.height + 'px');
    }
    // পেজের কার্ডে transform থাকায় position:fixed ঠিকমতো কাজ করে না, তাই পূর্ণ স্ক্রিনে এডিটরটি <body>-তে সরানো হয়
    let fsMarker = null;
    function setFullscreen(on){
      if (on === writeField.classList.contains('is-fullscreen')) return;
      if (on){
        fsMarker = document.createComment('rte-home');
        writeField.parentNode.insertBefore(fsMarker, writeField);
        document.body.appendChild(writeField);
      } else if (fsMarker && fsMarker.parentNode){
        fsMarker.parentNode.insertBefore(writeField, fsMarker);
        fsMarker.remove(); fsMarker = null;
      }
      writeField.classList.toggle('is-fullscreen', on);
      document.body.classList.toggle('rte-fs-open', on);
      fsBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      const label = on ? 'পূর্ণ স্ক্রিন থেকে বেরিয়ে আসুন' : 'পূর্ণ স্ক্রিনে লিখুন';
      fsBtn.title = label; fsBtn.setAttribute('aria-label', label);
      fsBtn.innerHTML = '<i data-lucide="' + (on ? 'minimize-2' : 'maximize-2') + '" width="18" height="18"></i>';
      renderIcons();
      if (window.visualViewport){
        const vv = window.visualViewport;
        if (on){ syncFsViewport(); vv.addEventListener('resize', syncFsViewport); vv.addEventListener('scroll', syncFsViewport); }
        else {
          vv.removeEventListener('resize', syncFsViewport); vv.removeEventListener('scroll', syncFsViewport);
          writeField.style.removeProperty('--fs-top'); writeField.style.removeProperty('--fs-h');
        }
      }
      if (on){
        updateFsCount();
        editor.focus();
        const sel = window.getSelection(), range = document.createRange();
        range.selectNodeContents(editor); range.collapse(false);
        sel.removeAllRanges(); sel.addRange(range);
        editor.scrollTop = editor.scrollHeight;
      } else {
        writeField.scrollIntoView({ block:'center' });
      }
    }
    fsBtn.addEventListener('click', () => setFullscreen(!writeField.classList.contains('is-fullscreen')));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && writeField.classList.contains('is-fullscreen')) setFullscreen(false); });
    editor.addEventListener('input', () => { if (writeField.classList.contains('is-fullscreen')) updateFsCount(); });
    window.addEventListener('hashchange', () => setFullscreen(false));

    // ---- ফাইল আপলোড প্যানেল ----
    const dropZone = document.getElementById('jomaDropZone');
    const fileInput = document.getElementById('jomaFileInput');
    const uploadList = document.getElementById('jomaUploadList');
    let uploadedFiles = [];
    const ALLOWED_EXT = /\.(jpe?g|pdf|docx?|txt)$/i;
    const MAX_FILE_BYTES = 10 * 1024 * 1024;

    function formatSize(bytes){
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function renderUploadList(){
      uploadList.innerHTML = uploadedFiles.map((f, i) => `
        <div class="u-row">
          <i data-lucide="file-text" width="16" height="16"></i>
          <span class="u-name">${f.name}</span>
          <span class="u-size">${formatSize(f.size)}</span>
          <button type="button" class="u-remove" data-remove="${i}" aria-label="সরিয়ে ফেলুন"><i data-lucide="x" width="14" height="14"></i></button>
        </div>
      `).join('');
      renderIcons();
      uploadList.querySelectorAll('[data-remove]').forEach(btn => btn.addEventListener('click', () => {
        uploadedFiles.splice(Number(btn.dataset.remove), 1);
        renderUploadList();
      }));
    }

    function acceptFiles(fileListLike){
      const rejected = [];
      Array.from(fileListLike).forEach(f => {
        if (!ALLOWED_EXT.test(f.name)) { rejected.push(f.name + ' (ফরম্যাট সমর্থিত নয়)'); return; }
        if (f.size > MAX_FILE_BYTES) { rejected.push(f.name + ' (সর্বোচ্চ ১০MB এর বেশি)'); return; }
        uploadedFiles.push(f);
      });
      if (rejected.length) alert('নিচের ফাইলগুলো গ্রহণ করা হয়নি:\n' + rejected.join('\n'));
      renderUploadList();
    }

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });
    fileInput.addEventListener('change', () => { acceptFiles(fileInput.files); fileInput.value = ''; });
    ['dragover', 'dragenter'].forEach(ev => dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.add('drag'); }));
    ['dragleave', 'drop'].forEach(ev => dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.remove('drag'); }));
    dropZone.addEventListener('drop', e => acceptFiles(e.dataTransfer.files));

    // ---- ফর্ম সাবমিট (Supabase: প্রোফাইল, ছবি, ফাইল, লেখা) ----
    const msgBox = page.querySelector('[data-msg]');
    const say = (type, text) => { msgBox.className = type ? 'form-msg show ' + type : 'form-msg'; msgBox.textContent = text || ''; };
    const MIME_BY_EXT = { pdf: 'application/pdf', txt: 'text/plain', doc: 'application/msword', jpg: 'image/jpeg', jpeg: 'image/jpeg',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };

    // এডিটরের লেখা সাধারণ টেক্সটে: অনুচ্ছেদ ফাঁকা লাইন দিয়ে আলাদা, উদ্ধৃতি "…" চিহ্নে (পাঠ পেজ এটাই চেনে)
    function editorToText(){
      const blocks = [];
      const push = t => { t = String(t || '').replace(/\u00a0/g, ' ').trim(); if (t) blocks.push(t); };
      editor.childNodes.forEach(n => {
        if (n.nodeType === 3){ push(n.textContent); return; }
        if (n.nodeType !== 1) return;
        const tag = n.tagName;
        if (tag === 'UL' || tag === 'OL'){ n.querySelectorAll('li').forEach(li => push('• ' + li.innerText)); return; }
        if (tag === 'BLOCKQUOTE'){ const t = n.innerText.trim(); if (t) push('"' + t + '"'); return; }
        push(n.innerText || n.textContent);
      });
      return blocks.join('\n\n');
    }

    form.addEventListener('submit', async e => {
      e.preventDefault();
      say('', '');
      const name = document.getElementById('jomaName').value.trim();
      const faculty = document.getElementById('jomaFaculty').value.trim();
      const batch = document.getElementById('jomaBatch').value.trim();
      const title = document.getElementById('jomaTitleInput').value.trim();
      const bio = document.getElementById('jomaBio').value.trim();
      if (!name || !faculty || !batch){
        say('err', 'লেখকের নাম, ফ্যাকাল্টি ও ব্যাচ দিন।');
        (!name ? document.getElementById('jomaName') : !faculty ? document.getElementById('jomaFaculty') : document.getElementById('jomaBatch')).focus();
        return;
      }
      if (!title){ say('err', 'লেখার শিরোনাম দিন।'); document.getElementById('jomaTitleInput').focus(); return; }
      if (title.length > 200){ say('err', 'শিরোনাম ২০০ অক্ষরের মধ্যে রাখুন।'); return; }
      const bodyText = editorToText();
      if (!bodyText && !uploadedFiles.length){ say('err', 'লেখা লিখুন অথবা ফাইল যুক্ত করুন।'); editor.focus(); return; }
      if (bodyText.length > 100000){ say('err', 'লেখাটি অনেক বড়, ফাইল হিসেবে আপলোড করুন।'); return; }
      if (!window.sb){ say('err', 'Supabase এখনো সংযুক্ত নয়।'); return; }

      const { data: sess } = await sb.auth.getSession();
      const user = sess.session && sess.session.user;
      if (!user){
        say('err', 'লেখা জমা দিতে আগে লগইন করুন। আপনার লেখা এখানেই থাকবে।');
        if (window.openModal) window.openModal('loginModal');
        return;
      }

      const btn = form.querySelector('button[type=submit]');
      btn.disabled = true;
      try {
        // ১) লেখক প্রোফাইল (ছবি আপলোডসহ)
        const upd = { name: name, faculty: faculty, batch: batch, bio: bio };
        if (picFile){
          const path = user.id + '/profile.webp';
          const up = await sb.storage.from('avatars').upload(path, picFile, { upsert: true, contentType: picFile.type || 'image/webp' });
          if (!up.error) upd.avatar_url = sb.storage.from('avatars').getPublicUrl(path).data.publicUrl + '?v=' + Date.now();
        }
        const pr = await sb.from('profiles').update(upd).eq('id', user.id);
        if (pr.error) throw pr.error;
        window.__pbProfile = Object.assign({}, window.__pbProfile || {}, upd);

        // ২) ফাইল (প্রাইভেট বাকেট, নিজের ফোল্ডারে)
        const paths = [];
        for (let i = 0; i < uploadedFiles.length; i++){
          const f = uploadedFiles[i];
          const ext = ((f.name.match(/\.([A-Za-z0-9]+)$/) || [])[1] || '').toLowerCase();
          const path = user.id + '/' + Date.now() + '-' + i + (ext ? '.' + ext : '');
          const up = await sb.storage.from('submissions').upload(path, f, { contentType: f.type || MIME_BY_EXT[ext] || 'application/octet-stream' });
          if (up.error) throw up.error;
          paths.push(path);
        }

        // ৩) লেখা জমা (অনুমোদন পর্যন্ত pending)
        const ins = await sb.from('submissions').insert({
          title: title, genre: genre, body_text: bodyText || '(লেখাটি সংযুক্ত ফাইলে)', file_paths: paths
        });
        if (ins.error) throw ins.error;

        saveProfile();
        form.style.display = 'none';
        successBox.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) {
        console.error('submission failed', err);
        say('err', 'লেখা জমা দেওয়া যায়নি। আবার চেষ্টা করুন।');
      } finally {
        btn.disabled = false;
      }
    });

    // পেজ নতুন করে খোলার সময় রিসেট (হ্যাশ দিয়ে আবার #lekha-joma এ এলে)
    window.addEventListener('hashchange', () => {
      if ((location.hash || '').replace('#','') === 'lekha-joma'){
        form.style.display = '';
        successBox.style.display = 'none';
        form.reset();
        editor.innerHTML = '';
        // লেখকের তথ্য আগের মতোই থাকবে: সংরক্ষিত প্রোফাইল আবার বসানো হয়
        picFile = null; picDataUrl = '';
        picImg.removeAttribute('src');
        picPreview.classList.remove('has-img');
        picInfo.textContent = '';
        bioCount.textContent = '০';
        applyProfile();
        uploadedFiles = [];
        renderUploadList();
        resetGenreSelection();
      }
    });

    // পেজ প্রথমবার লোড হলেই সংরক্ষিত তথ্য বসানো
    applyProfile();
    window.addEventListener('pb-profile', applyProfile);   // লগইনের পর ডাটাবেজের প্রোফাইল বসানো
  })();

  // ---------- যোগাযোগ ফর্ম -> contact_messages ----------
  (function(){
    const btn = document.getElementById('contactSendBtn');
    const box = document.getElementById('contactMsg');
    if (!btn || !box) return;
    const say = (type, text) => { box.className = type ? 'form-msg show ' + type : 'form-msg'; box.textContent = text || ''; };
    btn.addEventListener('click', async () => {
      const name = document.getElementById('contactName').value.trim();
      const email = document.getElementById('contactEmail').value.trim();
      const message = document.getElementById('contactMessage').value.trim();
      if (!name){ say('err', 'আপনার নাম লিখুন।'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ say('err', 'সঠিক ইমেইল ঠিকানা দিন।'); return; }
      if (!message){ say('err', 'বার্তা লিখুন।'); return; }
      if (name.length > 100 || message.length > 3000){ say('err', 'নাম বা বার্তা অনেক বড়।'); return; }
      if (!window.sb){ say('err', 'Supabase এখনো সংযুক্ত নয়।'); return; }
      btn.disabled = true;
      const { error } = await sb.from('contact_messages').insert({ name: name, email: email, message: message });
      btn.disabled = false;
      if (error){
        say('err', /অনেক বেশি বার্তা/.test(error.message || '') ? 'অনেক বেশি বার্তা পাঠানো হয়েছে, কিছুক্ষণ পরে চেষ্টা করুন।' : 'বার্তা পাঠানো যায়নি। আবার চেষ্টা করুন।');
        return;
      }
      say('ok', 'ধন্যবাদ! আপনার বার্তা পাঠানো হয়েছে।');
      ['contactName', 'contactEmail', 'contactMessage'].forEach(id => { document.getElementById(id).value = ''; });
    });
  })();

  // ---------- Single-page router ----------
  const SUBPAGE_IDS = {
    'lekha': 'lekha-page',
    'magazine-page': 'magazine-page',
    'onushthan': 'onushthan-page',
    'gallery-page': 'gallery-page',
    'admin': 'admin-page',
    'lekha-joma': 'lekha-joma-page'
  };

  const HOME_ANCHORS = ['top','about','writings','magazine','events','gallery','join'];
  const homePage = document.getElementById('home-page');
  const subpages = document.querySelectorAll('.subpage');

  const siteHeader = document.querySelector('header');
  const siteFooter = document.querySelector('footer');

  function showSubpage(key, directId){
    homePage.classList.add('is-hidden');
    subpages.forEach(p => p.classList.remove('is-active'));
    const targetId = directId || SUBPAGE_IDS[key];
    const target = document.getElementById(targetId);
    if (target){
      target.classList.add('is-active');
      refreshReveal(target);
    }
    // Admin panel & the Reading Page are standalone views: hide the main site chrome around them.
    const hideChrome = (key === 'admin') || (targetId === 'reading-page');
    if (siteHeader) siteHeader.style.display = hideChrome ? 'none' : '';
    if (siteFooter) siteFooter.style.display = hideChrome ? 'none' : '';
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function showHome(anchor){
    homePage.classList.remove('is-hidden');
    subpages.forEach(p => p.classList.remove('is-active'));
    if (siteHeader) siteHeader.style.display = '';
    if (siteFooter) siteFooter.style.display = '';
    refreshReveal(homePage);
    if (anchor && anchor !== 'top'){
      requestAnimationFrame(() => {
        const el = document.getElementById(anchor);
        if (el) el.scrollIntoView({ behavior:'smooth', block:'start' });
      });
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }

  function route(){
    const hash = (location.hash || '#top').replace('#','');
    if (hash.indexOf('author/') === 0){
      showSubpage(null, 'author-page');
      if (window.openAuthorPage) window.openAuthorPage(hash.slice(7));
      return;
    }
    if (hash.indexOf('read/') === 0){
      const articleId = hash.slice(5);
      showSubpage(null, 'reading-page');
      if (window.openReadingArticle) window.openReadingArticle(articleId);
      return;
    }
    if (SUBPAGE_IDS[hash]){
      showSubpage(hash);
    } else if (HOME_ANCHORS.includes(hash)){
      showHome(hash);
    } else {
      showHome('top');
    }
  }

  // ---------- Reading Page engine ----------
  (function(){
    const ARTICLES = {
      1: {
        cat: 'কবিতা', title: 'নদীর কাছে ফেরা চিঠি',
        author: 'রুবাইয়াত হোসেন', authorSub: 'বাংলা বিভাগ · ১৪তম ব্যাচ',
        date: '১২ আগস্ট, ২০২৬', tags: ['কবিতা','প্রকৃতি','স্মৃতি'],
        bio: 'রুবাইয়াত মূলত কবিতা লেখেন, নদী আর গ্রামের স্মৃতি তার লেখার প্রিয় বিষয়। ক্লাবের প্রতিষ্ঠাকালীন সদস্যদের একজন।',
        body: [
          'নদীটা এখনও সেখানেই বয়ে যায়, শুধু তার পাড়ে দাঁড়িয়ে থাকা মানুষগুলো বদলে গেছে। আমি যখন ছোট ছিলাম, তখন এই জলের শব্দই ছিল আমার প্রথম শেখা গান। প্রতিটা ঢেউয়ে যেন একেকটা না-বলা কথা ভেসে বেড়াতো।',
          'বাবার হাত ধরে ঘাটে বসে থাকা বিকেলগুলো আজ শুধু স্মৃতির অ্যালবামে। শহরের কোলাহলে হারিয়ে যাওয়া সেই সরল জীবনটাকে খুঁজে ফিরি প্রতিটা কবিতার লাইনে, প্রতিটা শব্দচয়নে।',
          'কেউ কেউ বলে নস্টালজিয়া একটা রোগ। আমি বলি, এটাই একমাত্র ওষুধ যা আমাদের মনে করিয়ে দেয়, আমরা কোথা থেকে এসেছি, আর কী হারিয়ে ফেলেছি পথে।',
          '"নদী কখনো থেমে থাকে না, কিন্তু তার তীরে দাঁড়িয়ে থাকা মানুষ প্রতিদিন একটু একটু করে থেমে যায়।"',
          'তবু প্রতি বছর বর্ষায় যখন নদী নতুন রূপে ফিরে আসে, আমার ভেতরের সেই ছোট্ট ছেলেটাও যেন এক লহমার জন্য জেগে ওঠে। হয়তো এটাই ফেরার আসল অর্থ, সম্পূর্ণ ফিরে না গিয়েও, কিছু একটা অংশ চিরকাল সেখানেই রয়ে যাওয়া।'
        ]
      },
      2: {
        cat: 'গল্প', title: 'শেষ ট্রেনের যাত্রী',
        author: 'ফারহানা আক্তার', authorSub: 'অর্থনীতি বিভাগ · ১২তম ব্যাচ',
        date: '৩ সেপ্টেম্বর, ২০২৬', tags: ['গল্প','শহর','সম্পর্ক'],
        bio: 'ফারহানা শহুরে জীবনের ছোট ছোট মুহূর্ত নিয়ে গল্প লিখতে ভালোবাসেন। তার গল্পে প্রায়ই ট্রেন, স্টেশন আর অপরিচিত মানুষদের দেখা মেলে।',
        body: [
          'রাত সাড়ে এগারোটার লাস্ট ট্রেনটা যখন প্ল্যাটফর্মে এসে থামলো, তখন কামরায় হাতে গোনা কয়েকজন যাত্রী। জানালার পাশের সিটে বসে থাকা মেয়েটি বারবার ঘড়ি দেখছিল, যেন সময়টাই তার সবচেয়ে বড় শত্রু।',
          'আমি তার উল্টো দিকের সিটে বসে বইয়ের পাতা উল্টাচ্ছিলাম, কিন্তু মন পড়ে ছিল তার অস্থিরতায়। কিছু মানুষের নীরবতাও অনেক কথা বলে দেয়।',
          'স্টেশন আসতেই সে হঠাৎ বলে উঠলো, "আপনার কি মনে হয়, দেরি হয়ে গেলে সব সম্পর্ক শেষ হয়ে যায়?" প্রশ্নটা এতটাই আকস্মিক ছিল যে আমি কিছুক্ষণ চুপ করে থাকলাম।',
          '"দেরি আর শেষ হয়ে যাওয়া এক জিনিস নয়," আমি বললাম। "কখনো কখনো দেরিটাই মানুষকে বুঝিয়ে দেয়, সম্পর্কটা আসলে কতটা জরুরি ছিল।"',
          'ট্রেন থেমে গেল। মেয়েটি নেমে গেল কোনো উত্তর না দিয়েই। কিন্তু প্ল্যাটফর্মের আলোয় আমি দেখলাম, সে ছুটছে, কারো দিকে, দেরিকে পেছনে ফেলে।'
        ]
      },
      3: {
        cat: 'প্রবন্ধ', title: 'তরুণ প্রজন্মের পাঠাভ্যাস: সংকট নাকি রূপান্তর?',
        author: 'ইমরান কবির', authorSub: 'গণযোগাযোগ বিভাগ · ১১তম ব্যাচ',
        date: '২০ জুলাই, ২০২৬', tags: ['প্রবন্ধ','শিক্ষা','সমাজ'],
        bio: 'ইমরান গণমাধ্যম ও তরুণ সমাজ নিয়ে বিশ্লেষণধর্মী লেখা লেখেন। বিভিন্ন পত্রিকায় তার কলাম নিয়মিত প্রকাশিত হয়।',
        body: [
          'প্রায়ই শোনা যায়, "আজকালকার তরুণরা বই পড়ে না।" কিন্তু বাস্তবতা কি সত্যিই তাই, নাকি আমরা শুধু পাঠের পুরনো সংজ্ঞাটা আঁকড়ে ধরে বসে আছি?',
          'পরিসংখ্যান বলছে ছাপা বইয়ের বিক্রি কমলেও, ই-বুক, অডিওবুক আর অনলাইন লেখার পাঠক সংখ্যা প্রতি বছর বাড়ছে। পাঠাভ্যাস হয়তো বদলাচ্ছে না, বদলাচ্ছে শুধু তার মাধ্যম।',
          'সমস্যাটা গভীরতায়। ছোট ছোট স্ক্রিনে দ্রুত স্ক্রল করে যাওয়া কনটেন্ট মস্তিষ্ককে দীর্ঘ মনোযোগ দিতে অভ্যস্ত করে না। এখানেই সাহিত্য ক্লাবের মতো উদ্যোগের গুরুত্ব, যেখানে ধীরে পড়া আর গভীরভাবে ভাবার চর্চা টিকিয়ে রাখা যায়।',
          'প্রয়োজন নতুন কৌশলের, ছোট গল্প, পডকাস্ট আকারে সাহিত্য আলোচনা, আর ডিজিটাল প্ল্যাটফর্মে মানসম্মত লেখার সহজলভ্যতা। রূপান্তরকে স্বীকার করে নিয়েই এগোতে হবে, প্রতিরোধ করে নয়।'
        ]
      },
      4: {
        cat: 'অনুবাদ', title: 'নীরবতার ভাষা (মূল: জাপানি লোককথা অবলম্বনে)',
        author: 'সাদিয়া ইসলাম', authorSub: 'ইংরেজি বিভাগ · ১৩তম ব্যাচ',
        date: '৫ জুন, ২০২৬', tags: ['অনুবাদ','লোককথা'],
        bio: 'সাদিয়া বিভিন্ন ভাষার লোককথা ও ছোটগল্প বাংলায় অনুবাদ করেন। ভাষার সীমানা পেরিয়ে গল্প পৌঁছে দেওয়াই তার লক্ষ্য।',
        body: [
          'পাহাড়ের কোলে ছোট্ট গ্রামে এক বৃদ্ধ কুমোর বাস করতেন, যিনি কখনো কথা বলতেন না। গ্রামবাসীরা তাকে "নীরব শিল্পী" বলে ডাকতো, কারণ তার হাতে তৈরি মাটির পাত্রগুলো নিজেরাই যেন কথা বলতো।',
          'একদিন এক তরুণ তার কাছে শিখতে এলো। "আপনি কথা বলেন না কেন?" প্রশ্ন করেছিল সে। বৃদ্ধ শুধু হাসলেন এবং একটা কাদার তাল তুলে দিলেন তার হাতে।',
          'মাসের পর মাস তরুণটি কাজ শিখলো নীরবতার মধ্য দিয়েই, হাতের স্পর্শ দেখে, চোখের ইশারা বুঝে। একদিন সে বুঝলো, প্রতিটা পাত্রের আকৃতিই ছিল বৃদ্ধের একেকটা বাক্য।',
          '"কিছু শিল্প কথায় শেখানো যায় না," শেষ পর্যন্ত বৃদ্ধ বললেন, বহু বছরে এই প্রথম মুখ খুলে। "সেগুলো শুধু নীরবতায় বেড়ে ওঠে, ধৈর্যের মাটিতে।"'
        ]
      },
      5: {
        cat: 'কবিতা', title: 'একলা দুপুরের কবিতা',
        author: 'তানভীর আহমেদ', authorSub: 'পদার্থবিজ্ঞান বিভাগ · ১৫তম ব্যাচ',
        date: '১৮ মে, ২০২৬', tags: ['কবিতা','নিঃসঙ্গতা'],
        bio: 'তানভীর বিজ্ঞানের ছাত্র হলেও কবিতার প্রতি তার টান সেই ছোটবেলা থেকে। নিরিবিলি মুহূর্তগুলোই তার কবিতার প্রধান উপজীব্য।',
        body: [
          'দুপুরের রোদ জানালা গলে ঘরে ঢোকে, ধুলোর কণাগুলো আলোয় নেচে ওঠে নীরব এক নাচে। এই সময়টায় বাড়ি একদম চুপচাপ, শুধু ঘড়ির কাঁটার শব্দ।',
          'এই নিঃসঙ্গতা কোনো শাস্তি নয়, বরং একধরনের উপহার। এখানে নিজের সাথে দেখা হয় প্রতিদিন, প্রশ্ন করার সুযোগ মেলে, আমি আসলে কে, কী চাই।',
          '"একলা থাকা মানে ফাঁকা থাকা নয়। এটা নিজের ভেতরের ঘরটা গুছিয়ে নেওয়ার সময়।"',
          'বিকেল নামার আগে এই দুপুরটুকুই আমার প্রিয় সময়, যখন পৃথিবী থেমে যায় আর আমি নিজেকে আবার নতুন করে চিনে নিই।'
        ]
      },
      7: {
        cat: 'কবিতা', title: 'বর্ষার প্রথম দিন',
        author: 'রুবাইয়াত হোসেন', authorSub: 'বাংলা বিভাগ · ১৪তম ব্যাচ',
        date: '২৮ জুলাই, ২০২৬', tags: ['কবিতা','বর্ষা'],
        bio: 'রুবাইয়াত মূলত কবিতা লেখেন, নদী আর গ্রামের স্মৃতি তার লেখার প্রিয় বিষয়। ক্লাবের প্রতিষ্ঠাকালীন সদস্যদের একজন।',
        body: [
          'আকাশটা সকাল থেকেই ভার হয়ে ছিল, দুপুরের দিকে প্রথম ফোঁটাটা পড়লো টিনের চালে। সেই শব্দ শুনেই বুঝলাম, এবারের বর্ষা এসে গেছে।',
          'মাটির গন্ধ ওঠে, উঠোনে জমে জল, আর ছোটবেলার সব কাগজের নৌকা একসাথে ভেসে ওঠে মনের ভেতর।',
          '\"প্রথম বৃষ্টি আসলে আকাশের পাঠানো একটা চিঠি, যার ঠিকানা আমাদের সবার স্মৃতি।\"'
        ]
      },
      8: {
        cat: 'কবিতা', title: 'ঘাটের ওপারে',
        author: 'রুবাইয়াত হোসেন', authorSub: 'বাংলা বিভাগ · ১৪তম ব্যাচ',
        date: '৯ জুন, ২০২৬', tags: ['কবিতা','নদী'],
        bio: 'রুবাইয়াত মূলত কবিতা লেখেন, নদী আর গ্রামের স্মৃতি তার লেখার প্রিয় বিষয়। ক্লাবের প্রতিষ্ঠাকালীন সদস্যদের একজন।',
        body: [
          'ঘাটের ওপারে একটা আলো জ্বলে সন্ধ্যা নামলেই। কেউ জানে না সেটা কার, তবু রোজ তাকিয়ে থাকি।',
          'হয়তো ওপারেও কেউ একজন এপারের আলোর দিকে তাকিয়ে আছে, একই প্রশ্ন নিয়ে।'
        ]
      },
      9: {
        cat: 'গল্প', title: 'স্টেশনের চা-ওয়ালা',
        author: 'ফারহানা আক্তার', authorSub: 'অর্থনীতি বিভাগ · ১২তম ব্যাচ',
        date: '১৪ আগস্ট, ২০২৬', tags: ['গল্প','স্টেশন'],
        bio: 'ফারহানা শহুরে জীবনের ছোট ছোট মুহূর্ত নিয়ে গল্প লিখতে ভালোবাসেন। তার গল্পে প্রায়ই ট্রেন, স্টেশন আর অপরিচিত মানুষদের দেখা মেলে।',
        body: [
          'প্রতিদিন ভোরের ট্রেন আসার আগে রহিম চাচা কেটলি চড়িয়ে দেন। তার চা খেয়ে কত যাত্রী যে গন্তব্যে পৌঁছেছে, সেই হিসাব কেউ রাখেনি।',
          'একদিন এক অচেনা যাত্রী বলে গেল, \"আপনার চায়ের স্বাদ আমি সারা জীবন মনে রাখবো।\" চাচা শুধু হাসলেন, কেটলিতে আবার জল ঢাললেন।'
        ]
      },
      6: {
        cat: 'গল্প', title: 'পুরনো বাড়ির চাবি',
        author: 'নুসরাত জাহান', authorSub: 'ইতিহাস বিভাগ · ১০তম ব্যাচ',
        date: '২ এপ্রিল, ২০২৬', tags: ['গল্প','পরিবার','স্মৃতি'],
        bio: 'নুসরাত পারিবারিক ইতিহাস আর পুরনো স্মৃতি নিয়ে গল্প লিখতে পছন্দ করেন। তার লেখায় প্রায়ই অতীত আর বর্তমানের সংলাপ দেখা যায়।',
        body: [
          'দাদির মৃত্যুর পর যখন বাড়িটা বিক্রি করার সিদ্ধান্ত হলো, আমি শেষবারের মতো সেই পুরনো কাঠের আলমারিটা খুললাম। ভেতরে একটা মরচে ধরা চাবি, যার তালা কোথায় তা কেউ জানতো না।',
          'সারা বাড়ি খুঁজেও কোনো মিল পেলাম না। শেষে বাগানের কোণে পুরনো একটা কাঠের বাক্স খুঁজে পেলাম, মাটির নিচে চাপা পড়ে থাকা।',
          'বাক্সের ভেতর ছিল দাদার লেখা কিছু চিঠি, দাদির কাছে, যেগুলো কখনো পাঠানো হয়নি। প্রতিটা লাইনে এমন এক ভালোবাসার গল্প, যা আমরা কখনো জানতামই না।',
          '"কিছু ভালোবাসা কথায় প্রকাশ পায় না, লুকিয়ে থাকে সময়ের গভীরে, অপেক্ষা করে সঠিক হাতের।"',
          'চাবিটা আসলে কোনো তালা খোলার জন্য ছিল না। এটা ছিল একটা স্মৃতি ধরে রাখার প্রতীক, যা আমাকে আমার পরিবারের এক অজানা অধ্যায়ের সাথে পরিচয় করিয়ে দিলো।'
        ]
      }
    };

    // ==================================================================
    // Supabase থেকে সব পাঠযোগ্য কনটেন্ট লোড। সংযোগ না থাকলে বা ব্যর্থ হলে
    // নিচের হার্ডকোড ডেটা ও স্ট্যাটিক কার্ডই থাকে।
    // ==================================================================
    (async function boot(){
      await Promise.resolve();   // IIFE-র বাকি অংশ (ফাংশন/const) তৈরি হওয়া পর্যন্ত অপেক্ষা

      const pub = (bucket, path) => path ? sb.storage.from(bucket).getPublicUrl(path).data.publicUrl : '';
      const cssUrl = u => "url('" + String(u).replace(/["'()\s\\]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')) + "')";
      const BN_TZ = 'Asia/Dhaka';
      const bnDay  = d => new Intl.DateTimeFormat('bn-BD', { timeZone: BN_TZ, day: '2-digit' }).format(d);
      const bnMon  = d => new Intl.DateTimeFormat('bn-BD', { timeZone: BN_TZ, month: 'long' }).format(d);
      const bnMonYear = d => new Intl.DateTimeFormat('bn-BD', { timeZone: BN_TZ, month: 'long', year: 'numeric' }).format(d);
      function bnTime(d){
        const p = new Intl.DateTimeFormat('en-GB', { timeZone: BN_TZ, hour: 'numeric', minute: '2-digit', hour12: false }).formatToParts(d);
        const h = +p.find(x => x.type === 'hour').value % 24, m = p.find(x => x.type === 'minute').value;
        if (h === 0 && m === '00') return 'সারাদিনব্যাপী';
        const period = h < 5 ? 'ভোর' : h < 12 ? 'সকাল' : h < 16 ? 'দুপুর' : h < 18 ? 'বিকাল' : h < 20 ? 'সন্ধ্যা' : 'রাত';
        const h12 = h % 12 === 0 ? 12 : h % 12;
        return period + ' ' + toBnLocal(h12) + ':' + toBnLocal(m);
      }
      const emptyHtml = '<div class="empty-note show" style="grid-column:1/-1;">এখনো কিছু যোগ করা হয়নি।</div>';
      const setGrid = (grid, html, keepSel) => {
        if (!grid) return;
        Array.from(grid.children).forEach(ch => { if (!(keepSel && ch.matches(keepSel))) ch.remove(); });
        grid.insertAdjacentHTML('afterbegin', html);
        if (typeof watchCards === 'function') watchCards(grid);
      };

      function articleCard(k, a, cls){
        const { minutes } = wordsToReadTime(a.body);
        return '<div class="write-card ' + cls + '" data-cat="' + escapeHtml(a.cat) + '" data-article="' + escapeHtml(k) + '" tabindex="0" role="button">' +
          '<div class="write-head"><h3>' + escapeHtml(a.title) + '</h3>' +
          '<span class="tag">' + escapeHtml(a.cat) + '</span></div>' +
          '<p class="excerpt">' + escapeHtml(articleExcerpt(a)) + '</p>' +
          '<div class="meta"><div class="author"><span class="avatar">' + (a.pic ? '<img src="' + escapeHtml(a.pic) + '" alt="">' : escapeHtml((a.author || '?').charAt(0))) + '</span>' +
          '<div class="author-info"><span class="author-name">' + escapeHtml(a.author) + '</span>' +
          '<span class="author-sub">' + escapeHtml(a.authorSub || '') + '</span></div></div>' +
          '<span class="read-time">' + toBnLocal(minutes) + ' মিনিট পঠন</span></div></div>';
      }
      function magCard(r, cls){
        const cover = r.cover_path ? pub('covers', r.cover_path) : '';
        const label = r.issue_no != null ? 'সংখ্যা ' + toBnLocal(r.issue_no) : '';
        const when = r.published_on ? bnMonYear(new Date(r.published_on + 'T00:00:00')) : '';
        const dl = r.pdf_path
          ? '<a class="dl" data-issue="' + escapeHtml(r.id) + '" href="' + escapeHtml(pub('magazine-pdfs', r.pdf_path)) + '" target="_blank" rel="noopener" title="ডাউনলোড" aria-label="ডাউনলোড"><i data-lucide="download" width="18" height="18"></i></a>'
          : '';
        const date = when ? '<span class="mag-date"><i data-lucide="calendar" width="14" height="14"></i>' + escapeHtml(when) + '</span>' : '<span></span>';
        const coverCls = cover ? 'mag-cover' : 'mag-cover is-plain';
        const coverStyle = cover ? ' style="background:' + cssUrl(cover) + ' center/cover no-repeat;"' : '';
        return '<div class="mag-card ' + cls + '">' +
          '<div class="' + coverCls + '"' + coverStyle + '>' + (label ? '<span class="mag-issue">' + escapeHtml(label) + '</span>' : '') + '</div>' +
          '<div class="mag-info"><h4>' + escapeHtml(r.title) + '</h4>' +
          '<div class="mag-meta">' + date + dl + '</div></div></div>';
      }
      function eventItem(r, cls){
        const d = r.starts_at ? new Date(r.starts_at) : null;
        return '<div class="tl-item ' + cls + '"><div class="tl-dot"></div><div class="tl-card">' +
          (d ? '<div class="tl-date"><b>' + escapeHtml(bnDay(d)) + '</b><span>' + escapeHtml(bnMon(d)) + '</span></div>' : '') +
          '<div class="tl-body"><h4>' + escapeHtml(r.title) + '</h4>' +
          (r.description ? '<p>' + escapeHtml(r.description) + '</p>' : '') +
          '<div class="tl-meta">' +
          (r.location ? '<span><i data-lucide="map-pin" width="14" height="14"></i> ' + escapeHtml(r.location) + '</span>' : '') +
          (d ? '<span><i data-lucide="clock" width="14" height="14"></i> ' + escapeHtml(bnTime(d)) + (r.ends_at ? ' থেকে ' + escapeHtml(bnTime(new Date(r.ends_at))) : '') + '</span>' : '') +
          '</div></div></div></div>';
      }
      function galleryItem(r, cls){
        return '<div class="g-item ' + cls + '" tabindex="0" style="background:' + cssUrl(pub('gallery', r.image_path)) + ' center/cover no-repeat;">' +
          (r.caption ? '<span class="g-label"><i data-lucide="image" width="14" height="14"></i> ' + escapeHtml(r.caption) + '</span>' : '') + '</div>';
      }

      let pages = {};
      const genrePromise = window.GenreStore.load().catch(() => {});
      if (window.sb) {
        try {
          const q = (t, cols) => sb.from(t).select(cols);
          const [rA, rI, rE, rG, rS, rC, rV, rP] = await Promise.all([
            q('articles', 'id,legacy_id,slug,title,genre,tags,body,author_name,author_sub,author_bio,author_avatar,published_at').eq('status', 'published').order('published_at', { ascending: false }),
            q('magazine_issues', 'id,issue_no,title,cover_path,pdf_path,published_on').eq('published', true).order('published_on', { ascending: false, nullsFirst: false }),
            q('events', 'id,title,description,starts_at,ends_at,location').eq('published', true).order('starts_at', { ascending: false, nullsFirst: false }),
            q('gallery_items', 'id,caption,image_path').eq('published', true).order('sort_order').order('created_at', { ascending: false }),
            q('site_settings', 'key,value'),
            q('site_content', 'key,value'),
            q('site_values', 'title,description').order('sort_order').order('id'),
            q('pages', 'slug,title,body')
          ]);

          // author_avatar কলাম এখনো না থাকলে (authors.sql চালানো না হলে) আগের মতো ছাড়া লোড
          if (rA.error){
            const r2 = await q('articles', 'id,legacy_id,slug,title,genre,tags,body,author_name,author_sub,author_bio,published_at').eq('status', 'published').order('published_at', { ascending: false });
            rA.data = r2.data; rA.error = r2.error;
          }
          await genrePromise;
          // --- লেখা ---
          if (!rA.error && rA.data) {
            Object.keys(ARTICLES).forEach(k => delete ARTICLES[k]);
            rA.data.forEach(r => {
              const key = r.legacy_id != null ? String(r.legacy_id) : r.slug;   // পুরনো #read/1 লিংক চালু থাকে
              ARTICLES[key] = {
                uuid: r.id, cat: window.GenreStore.canon(r.genre || ''), title: r.title,
                author: r.author_name || '', authorSub: fmtAuthorSub(r.author_sub || ''),
                date: r.published_at ? new Date(r.published_at + 'T00:00:00').toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }) : '',
                tags: r.tags || [], bio: r.author_bio || '', pic: r.author_avatar || '',
                body: Array.isArray(r.body) ? r.body : []
              };
            });
            const keys = Object.keys(ARTICLES);
            setGrid(document.getElementById('cardGrid'), keys.slice(0, 6).map(k => articleCard(k, ARTICLES[k], 'reveal in')).join(''), '#emptyNote');
            setGrid(document.getElementById('lekhaCardGrid'), keys.map(k => articleCard(k, ARTICLES[k], 'reveal item in')).join(''), '#lekhaEmptyNote');
          }
          // --- ম্যাগাজিন ---
          if (!rI.error && rI.data) {
            const html = c => rI.data.length ? rI.data.map(r => magCard(r, c)).join('') : emptyHtml;
            setGrid(document.querySelector('#magazine .mag-grid'), rI.data.length ? rI.data.slice(0, 4).map(r => magCard(r, 'reveal in')).join('') : emptyHtml);
            setGrid(document.getElementById('magGrid'), html('reveal item in'));
          }
          // --- অনুষ্ঠান: হোমে ৩টি (আগে আসন্ন, তারপর সাম্প্রতিক) ---
          if (!rE.error && rE.data) {
            const now = Date.now();
            const up = rE.data.filter(r => r.starts_at && new Date(r.starts_at) >= now).sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
            const past = rE.data.filter(r => !r.starts_at || new Date(r.starts_at) < now);
            const home = up.concat(past).slice(0, 3);
            setGrid(document.querySelector('#events .timeline'), home.length ? home.map(r => eventItem(r, 'reveal in')).join('') : emptyHtml);
            setGrid(document.getElementById('eventList'), rE.data.length ? rE.data.map(r => eventItem(r, 'reveal item in')).join('') : emptyHtml);
          }
          // --- গ্যালারি ---
          if (!rG.error && rG.data) {
            setGrid(document.querySelector('#gallery .gallery-grid'), rG.data.length ? rG.data.slice(0, 6).map(r => galleryItem(r, 'reveal in')).join('') : emptyHtml);
            const homeGrid = document.querySelector('#gallery .gallery-grid');
            if (homeGrid) homeGrid.classList.toggle('is-few', rG.data.length < 6);
            setGrid(document.getElementById('galleryGrid'), rG.data.length ? rG.data.map(r => galleryItem(r, 'reveal item in')).join('') : emptyHtml);
          }

          // --- সাইট সেটিংস: ফুটার ও যোগাযোগ ---
          const set = {}; (rS.data || []).forEach(r => { set[r.key] = r.value; });
          const putText = (id, v) => { const el = document.getElementById(id); if (el && v) el.textContent = v; };
          const hideIfEmpty = (id, v, parentSel) => { const el = document.getElementById(id); if (el && !v) (parentSel ? el.closest(parentSel) : el).style.display = 'none'; };
          if (!rS.error) {
            putText('ftSlogan', set.footer_slogan);
            putText('ftEmail', set.contact_email); putText('ftPhone', set.contact_phone); putText('ftAddress', set.address);
            const fb = document.getElementById('ftFb'); if (fb) { if (/^https?:\/\//.test(set.facebook_url || '')) { fb.href = set.facebook_url; fb.target = '_blank'; fb.rel = 'noopener'; } else fb.style.display = 'none'; }
            const tel = document.getElementById('ftTel'); if (tel) { if (set.contact_phone) tel.href = 'tel:' + String(set.contact_phone).replace(/[^\d+]/g, ''); else tel.style.display = 'none'; }
            const ml = document.getElementById('ftMail'); if (ml && set.contact_email) ml.href = 'mailto:' + set.contact_email;
            hideIfEmpty('ftPhone', set.contact_phone, 'li'); hideIfEmpty('ftAddress', set.address, 'li');
            if (set.site_name) {
              const brandTxt = document.querySelector('.footer-brand-text'); if (brandTxt) brandTxt.textContent = set.site_name;
              document.title = set.site_name;
            }
            if (set.logo_path) {
              const logoUrl = pub('covers', set.logo_path);
              const navL = document.querySelector('header .brand-logo'); if (navL) navL.src = logoUrl;
              const fl = document.getElementById('footerLogo');
              if (fl) { fl.src = logoUrl; fl.closest('.footer-brand').classList.add('has-logo'); }
              [['admSidebarLogo', '.adm-sidebar-brand'], ['admLoginLogo', '.adm-login-brand'], ['admTopbarLogo', '.adm-topbar-brand']].forEach(([id, wrap]) => {
                const img = document.getElementById(id);
                if (img) { img.src = logoUrl; img.closest(wrap).classList.add('has-logo'); }
              });
            }
          }

          // --- হোমপেজ টেক্সট: হিরো স্ট্যাটস ও "আমাদের সম্পর্কে" ---
          const content = {}; (rC.data || []).forEach(r => { content[r.key] = r.value; });
          const heroC = content.hero || {};
          if (heroC.title && heroC.title.includes('|')) { const h = document.querySelector('.hero-copy h1'); if (h) h.innerHTML = heroC.title.split('|').map(s => '<span class=\"hero-line\">' + escapeHtml(s.trim()).replace(/\*(.+?)\*/, '<em>$1</em>') + '</span>').join(''); }
          if (heroC.desc) { const l = document.querySelector('.hero-copy .lede'); if (l) l.textContent = heroC.desc; }
          if (content.hero_stats) {
            const els = document.querySelectorAll('.hero-stats .stat b');
            ['members', 'issues', 'years'].forEach((k, i) => { if (els[i] && content.hero_stats[k]) els[i].textContent = content.hero_stats[k]; });
          }
          if (content.about) {
            const h = document.querySelector('#about h2'); if (h && content.about.title) h.textContent = content.about.title;
            const box = document.querySelector('#about .about-text');
            if (box && Array.isArray(content.about.paragraphs) && content.about.paragraphs.length) {
              box.innerHTML = content.about.paragraphs.map(p => '<p>' + escapeHtml(p) + '</p>').join('');
            }
          }
          if (!rV.error && rV.data && rV.data.length) {
            const icons = ['pen-line', 'users', 'bookmark', 'mic'];
            const list = document.querySelector('#about .value-list');
            if (list) list.innerHTML = rV.data.map((r, i) =>
              '<div class="value-item"><div class="ico"><i data-lucide="' + icons[i % icons.length] + '" width="18" height="18"></i></div>' +
              '<div><h4>' + escapeHtml(r.title) + '</h4>' + (r.description ? '<p>' + escapeHtml(r.description) + '</p>' : '') + '</div></div>').join('');
          }
          (rP.data || []).forEach(r => { pages[r.slug] = r; });
        } catch (err) { console.error('Supabase content load failed, using static content', err); }
      }

      await genrePromise;
      if (window.__renderGenreChips) window.__renderGenreChips();
      // ফিল্টার/পেজিনেশন এখন চালু (স্ট্যাটিক বা লোড-করা কার্ডের ওপর)
      if (window.__initHomeFilter) window.__initHomeFilter();
      if (window.__initLekha) window.__initLekha();
      if (window.__initSimplePaginations) window.__initSimplePaginations();
      if (window.__lekhaSetAuthors) window.__lekhaSetAuthors(ARTICLES);
      renderIcons();
      try { await loadMe(); } catch (err) { console.error('loadMe failed', err); }
      if ((location.hash || '').indexOf('#read/') === 0 && window.openReadingArticle) window.openReadingArticle(location.hash.slice(6));

      // ডাউনলোড গণনা (ব্যর্থ হলেও ডাউনলোড আটকাবে না)
      document.addEventListener('click', e => {
        const a = e.target.closest && e.target.closest('a.dl[data-issue]');
        if (a && window.sb) sb.rpc('increment_download', { issue: a.dataset.issue }).then(() => {}, () => {});
      });

      // ফুটারের পেজ (নিয়মাবলী / নির্দেশিকা / FAQ): সাধারণ টেক্সট, HTML নয়
      document.addEventListener('click', async e => {
        const a = e.target.closest && e.target.closest('a[data-page]');
        if (!a) return;
        e.preventDefault();
        let pg = pages[a.dataset.page];
        if (!pg && window.sb) {
          const { data } = await sb.from('pages').select('slug,title,body').eq('slug', a.dataset.page).maybeSingle();
          if (data) pg = pages[data.slug] = data;
        }
        const title = pg ? pg.title : a.textContent.trim();
        const paras = pg && pg.body ? pg.body.split(/\n{2,}/) : ['শীঘ্রই যুক্ত করা হবে।'];
        const old = document.getElementById('pbPageOverlay'); if (old) old.remove();
        const ov = document.createElement('div');
        ov.id = 'pbPageOverlay';
        ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
        ov.style.cssText = 'position:fixed;inset:0;z-index:2000;background:rgba(36,20,14,.55);display:flex;align-items:center;justify-content:center;padding:20px;';
        const card = document.createElement('div');
        card.style.cssText = 'background:var(--paper-card,#fff);color:var(--ink,#222);max-width:640px;width:100%;max-height:85vh;overflow:auto;border-radius:10px;padding:28px 26px;box-shadow:0 20px 60px rgba(0,0,0,.3);';
        const h = document.createElement('h3'); h.textContent = title; h.style.cssText = 'margin:0 0 14px;font-size:1.3rem;';
        card.appendChild(h);
        paras.forEach(t => { const p = document.createElement('p'); p.textContent = t; p.style.cssText = 'margin:0 0 12px;line-height:1.8;white-space:pre-line;'; card.appendChild(p); });
        const x = document.createElement('button'); x.type = 'button'; x.textContent = 'বন্ধ করুন';
        x.style.cssText = 'margin-top:8px;padding:9px 18px;border:none;border-radius:6px;background:var(--maroon,#7a1f2b);color:#fff;cursor:pointer;font:inherit;';
        const close = () => { ov.remove(); document.removeEventListener('keydown', onKey); };
        const onKey = ev => { if (ev.key === 'Escape') close(); };
        x.addEventListener('click', close);
        ov.addEventListener('click', ev => { if (ev.target === ov) close(); });
        document.addEventListener('keydown', onKey);
        card.appendChild(x); ov.appendChild(card); document.body.appendChild(ov);
      });
    })();

    const CAT_ICON = { 'কবিতা':'feather', 'গল্প':'book-open', 'প্রবন্ধ':'file-text', 'অনুবাদ':'languages' };

    function wordsToReadTime(bodyArr){
      const words = bodyArr.join(' ').split(/\s+/).filter(Boolean).length;
      const minutes = Math.max(1, Math.round(words / 180));
      return { words, minutes };
    }

    function toBnLocal(n){
      const map = {'0':'০','1':'১','2':'২','3':'৩','4':'৪','5':'৫','6':'৬','7':'৭','8':'৮','9':'৯'};
      return String(n).replace(/[0-9]/g, d => map[d]);
    }
    // Batch wording on author lines: "ব্যাচ ২০" is shown as "২০তম ব্যাচ"
    function fmtAuthorSub(t){
      return String(t || '').replace(/ব্যাচ\s*([০-৯0-9]+)/g, (m, n) => toBnLocal(n) + 'তম ব্যাচ');
    }

    const readingPage = document.getElementById('reading-page');
    const readProgress = document.getElementById('readProgress');

    // লেখকের প্রোফাইল পিকচার (article.pic = কম্প্রেসড WebP এর URL/ডেটা) থাকলে ছবি, না থাকলে নামের প্রথম অক্ষর
    function setAvatar(el, article){
      if (article.pic){
        el.textContent = '';
        const im = document.createElement('img');
        im.src = article.pic; im.alt = article.author;
        el.appendChild(im);
      } else {
        el.textContent = article.author.charAt(0);
      }
    }

    function renderArticle(id){
      const article = ARTICLES[id] || ARTICLES[1];
      const { words, minutes } = wordsToReadTime(article.body);

      document.getElementById('readTag').querySelector('span').textContent = article.cat;
      document.getElementById('readTag').querySelector('i')?.setAttribute('data-lucide', CAT_ICON[article.cat] || 'tag');
      document.getElementById('readTitle').textContent = article.title;
      document.getElementById('readAuthorName').textContent = article.author;
      document.getElementById('readAuthorSub').textContent = article.authorSub;
      setAvatar(document.getElementById('readAvatar'), article);
      document.getElementById('readDate').textContent = article.date;
      document.getElementById('readTime').textContent = toBnLocal(minutes) + ' মিনিট পঠন';
      document.getElementById('readWordCount').textContent = toBnLocal(words) + ' শব্দ';
      setAvatar(document.getElementById('readAuthorCardAvatar'), article);
      document.getElementById('readMoreAuthorBtn').setAttribute('href', '#author/' + (ARTICLES[id] ? id : 1));
      document.getElementById('readAuthorCardName').textContent = article.author;
      document.getElementById('readAuthorCardSub').textContent = article.authorSub || '';
      const bioEl = document.getElementById('readAuthorCardBio');
      bioEl.textContent = article.bio || '';
      bioEl.style.display = article.bio ? '' : 'none';

      const bodyEl = document.getElementById('readBody');
      bodyEl.innerHTML = article.body.map(p => {
        if (p.startsWith('"') || p.startsWith('"')) return `<blockquote>${escapeHtml(p)}</blockquote>`;
        return `<p>${escapeHtml(p)}</p>`;
      }).join('');

      document.getElementById('readTags').innerHTML = article.tags.map(t => `<span>#${escapeHtml(t)}</span>`).join('');

      // Bookmark / like state from localStorage
      syncEngagement(id);
      if (dbMode(id)){
        loadLikeCount(id).then(() => syncEngagement(id));
        if (!viewedThisSession.has(String(id))){ viewedThisSession.add(String(id)); sb.rpc('record_view', { aid: uuidOf(id) }).then(() => {}, () => {}); }
      }

      // Comments for this article
      renderComments(id);
      if (dbMode(id)) refreshComments(id);

      renderIcons();
      readingPage.scrollTop = 0;
      window.scrollTo({ top: 0, behavior: 'auto' });
      updateProgress();
    }

    // ==================================================================
    // Supabase ডেটা লেয়ার: লাইক, বুকমার্ক, মন্তব্য, রিডিং সেটিংস।
    // article-এ uuid থাকলে (অর্থাৎ ডাটাবেজ থেকে এলে) Supabase, নইলে আগের localStorage।
    // ==================================================================
    const DB = { likes: new Set(), likeCount: {}, commentLikes: new Set(), comments: {}, para: {} };
    let ME = null;            // { id, name, isAdmin }
    let settingsTimer = null;
    const viewedThisSession = new Set();
    const uuidOf = key => (ARTICLES[String(key)] || {}).uuid;
    const dbMode = key => !!(window.sb && uuidOf(key));
    function needLogin(key){
      if (dbMode(key) && !ME){
        if (window.openModal) window.openModal('loginModal');
        return true;
      }
      return false;
    }
    window.__pbNeedLogin = needLogin;

    async function loadLikeCount(key){
      const aid = uuidOf(key); if (!aid) return;
      const { data } = await sb.from('article_like_counts').select('likes').eq('article_id', aid).maybeSingle();
      DB.likeCount[aid] = data ? data.likes : 0;
    }

    async function fetchComments(key){
      const aid = uuidOf(key); if (!aid) return;
      let { data, error } = await sb.from('comments_view')
        .select('id,parent_id,user_id,body,created_at,edited_at,author_name')
        .eq('article_id', aid).order('created_at', { ascending: true });
      if (error || !data){
        console.warn('comments_view load failed, falling back to comments table', error);
        const r1 = await sb.from('comments')
          .select('id,parent_id,user_id,body,created_at,edited_at')
          .eq('article_id', aid).order('created_at', { ascending: true });
        if (r1.error || !r1.data){ console.error('comments load failed', r1.error); return; }
        data = r1.data;
        const uids = [...new Set(data.map(x => x.user_id).filter(Boolean))];
        const names = {};
        if (uids.length){
          const pr = await sb.from('profiles').select('id,name').in('id', uids);
          (pr.data || []).forEach(p => { names[p.id] = p.name; });
        }
        data.forEach(x => { x.author_name = names[x.user_id] || ''; });
      }
      const counts = {};
      if (data.length){
        const r2 = await sb.from('comment_like_counts').select('comment_id,likes').in('comment_id', data.map(r => r.id));
        (r2.data || []).forEach(x => { counts[x.comment_id] = x.likes; });
      }
      // likeCount-এ নিজের লাইক বাদ দেওয়া হয়, কারণ দেখানোর সময় liked হলে +১ যোগ হয়
      const mk = r => ({
        id: r.id, userId: r.user_id, name: r.author_name || 'সদস্য', text: r.body,
        time: new Date(r.created_at).getTime(), edited: !!r.edited_at,
        likeCount: Math.max(0, (counts[r.id] || 0) - (DB.commentLikes.has(r.id) ? 1 : 0)), replies: []
      });
      const top = [], byId = {};
      data.forEach(r => { if (!r.parent_id){ const c = mk(r); byId[r.id] = c; top.push(c); } });
      data.forEach(r => { if (r.parent_id && byId[r.parent_id]) byId[r.parent_id].replies.push(mk(r)); });
      DB.comments[String(key)] = top;
    }
    async function refreshComments(key){
      await fetchComments(key);
      if (String(readingPage.dataset.currentId) === String(key)) renderComments(key);
    }

    async function remotePost(key, text, parentId){
      if (needLogin(key)) return false;
      const row = { article_id: uuidOf(key), user_id: ME.id, body: text };
      if (parentId) row.parent_id = parentId;
      const { error } = await sb.from('comments').insert(row);
      if (error){
        console.error('comment insert failed', error);
        alert('মন্তব্য পাঠানো যায়নি: ' + (error.message || 'অজানা ত্রুটি'));
        return false;
      }
      await refreshComments(key);
      return true;
    }
    async function remoteEdit(key, cid, text){
      const { error } = await sb.from('comments').update({ body: text, edited_at: new Date().toISOString() }).eq('id', cid);
      if (error) alert('মন্তব্য সম্পাদনা করা যায়নি।');
      await refreshComments(key);
    }
    async function remoteDelete(key, cid){
      const { error } = await sb.from('comments').delete().eq('id', cid);
      if (error) alert('মন্তব্য মোছা যায়নি।');
      await refreshComments(key);
    }
    async function remoteToggleCommentLike(cid){
      const key = String(readingPage.dataset.currentId);
      if (needLogin(key)) return;
      if (DB.commentLikes.has(cid)){
        DB.commentLikes.delete(cid); renderComments(key);
        await sb.from('comment_likes').delete().eq('comment_id', cid).eq('user_id', ME.id);
      } else {
        DB.commentLikes.add(cid); renderComments(key);
        await sb.from('comment_likes').insert({ comment_id: cid, user_id: ME.id });
      }
      await refreshComments(key);
    }

    // অনুচ্ছেদ বুকমার্ক মডিউলের জন্য হুক (নিচের আলাদা IIFE এগুলো ব্যবহার করে)
    window.__pbParaLoad = function(){
      let out = {};
      try { out = JSON.parse(localStorage.getItem('parivartan_para_bookmarks') || '{}') || {}; } catch (e) { out = {}; }
      if (!window.sb) return out;
      Object.keys(ARTICLES).forEach(k => {
        const aid = ARTICLES[k].uuid; if (!aid) return;
        delete out[k];
        if (ME && DB.para[aid] != null) out[k] = { p: DB.para[aid], s: undefined, t: 0 };
      });
      return out;
    };
    window.__pbParaSync = function(key, bm){
      const aid = uuidOf(key); if (!aid || !ME) return;
      if (bm) DB.para[aid] = bm.p; else delete DB.para[aid];
      (async () => {
        await sb.from('paragraph_bookmarks').delete().eq('article_id', aid).eq('user_id', ME.id);
        if (bm) await sb.from('paragraph_bookmarks').insert({ article_id: aid, user_id: ME.id, paragraph_index: bm.p });
      })().catch(() => {});
    };

    function refreshReadingUI(){
      const key = readingPage.dataset.currentId;
      if (readingPage.classList.contains('is-active') && key){
        syncEngagement(key);
        if (dbMode(key)) refreshComments(key);
      }
      updateComposerAvatar();
      if (window.__pbParaRefresh) window.__pbParaRefresh();
    }

    // লগইন অবস্থা ও ব্যক্তিগত ডেটা লোড
    async function loadMe(){
      if (!window.sb) return;
      let session = null;
      try { session = (await sb.auth.getSession()).data.session; } catch (e) {}
      if (!session){
        ME = null; DB.likes = new Set(); DB.commentLikes = new Set(); DB.para = {};
        CURRENT_USER.name = 'পাঠক সদস্য';
        window.__pbProfile = null;
        refreshReadingUI();
        return;
      }
      const uid = session.user.id;
      const [p, l, cl, pb] = await Promise.all([
        sb.from('profiles').select('name,faculty,batch,bio,avatar_url,role,reading_settings').eq('id', uid).maybeSingle(),
        sb.from('article_likes').select('article_id').eq('user_id', uid),
        sb.from('comment_likes').select('comment_id').eq('user_id', uid),
        sb.from('paragraph_bookmarks').select('article_id,paragraph_index').eq('user_id', uid)
      ]);
      const prof = p.data || {};
      const wasId = ME && ME.id;
      ME = { id: uid, name: prof.name || (session.user.email || '').split('@')[0] || 'সদস্য', isAdmin: prof.role === 'admin' };
      CURRENT_USER.name = ME.name;
      window.__pbProfile = { name: prof.name, faculty: prof.faculty, batch: prof.batch, bio: prof.bio, avatar_url: prof.avatar_url };
      if (wasId !== uid) setTimeout(() => window.dispatchEvent(new CustomEvent('pb-profile')), 0);
      DB.likes = new Set((l.data || []).map(r => r.article_id));
      DB.commentLikes = new Set((cl.data || []).map(r => r.comment_id));
      DB.para = {}; (pb.data || []).forEach(r => { DB.para[r.article_id] = r.paragraph_index; });
      // রিডিং সেটিংস: প্রোফাইলে থাকলে সেটি, না থাকলে এই ডিভাইসের সেটিং প্রোফাইলে পাঠানো
      const rs = prof.reading_settings;
      if (rs && Object.keys(rs).length){
        settings = Object.assign({}, DEFAULTS, rs);
        try { localStorage.setItem('parivartan_read_settings', JSON.stringify(settings)); } catch (e) {}
        applySettings();
      } else {
        sb.from('profiles').update({ reading_settings: settings }).eq('id', uid).then(() => {}, () => {});
      }
      refreshReadingUI();
    }
    window.addEventListener('pb-auth', loadMe);
    window.__pbLoadMe = loadMe;

    function syncEngagement(id){
      const key = String(id), db = dbMode(key), aid = uuidOf(key);
      const bookmarks = db ? [] : JSON.parse(localStorage.getItem('parivartan_bookmarks') || '[]');
      const likes = db ? [] : JSON.parse(localStorage.getItem('parivartan_likes') || '[]');
      const bmBtn = document.getElementById('readBookmarkBtn');
      const likeBtn = document.getElementById('readLikeBtn');
      const likeCountEl = document.getElementById('readLikeCount');
      const isBookmarked = bookmarks.includes(Number(id));
      const isLiked = db ? DB.likes.has(aid) : likes.includes(Number(id));
      bmBtn.classList.toggle('is-active', isBookmarked);
      bmBtn.querySelector('i')?.setAttribute('fill', isBookmarked ? 'currentColor' : 'none');
      likeBtn.classList.toggle('is-active', isLiked);
      likeBtn.querySelector('i')?.setAttribute('fill', isLiked ? 'currentColor' : 'none');
      likeCountEl.textContent = toBnLocal(db ? (DB.likeCount[aid] || 0) : 124 + (isLiked ? 1 : 0));
      renderIcons();
    }

    // ==================================================================
    // Comments, Facebook-style: name + text composer, nested one-level
    // replies, per-comment likes. Text only (no images/GIFs). Persisted
    // per article id in localStorage.
    // ==================================================================
    const COMMENTS_KEY = 'parivartan_comments';
    // Placeholder for the logged-in user's profile, swap with real auth/profile data when available.
    const CURRENT_USER = { name: 'পাঠক সদস্য' };
    const COMMENT_LIKES_KEY = 'parivartan_comment_likes';
    const AVATAR_PALETTE = ['#8B2E3C','#2F6F4E','#A97D35','#3A5A8C','#7A4B8C','#B0563F'];

    function avatarColor(seed){
      let h = 0;
      for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
      return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
    }

    function loadAllComments(){
      try{ return JSON.parse(localStorage.getItem(COMMENTS_KEY) || '{}'); }
      catch(e){ return {}; }
    }
    function saveAllComments(all){
      localStorage.setItem(COMMENTS_KEY, JSON.stringify(all));
    }
    function getCommentsFor(id){
      if (dbMode(String(id))) return DB.comments[String(id)] || [];
      const all = loadAllComments();
      return all[id] || [];
    }
    function setCommentsFor(id, list){
      if (dbMode(String(id))){ DB.comments[String(id)] = list; return; }
      const all = loadAllComments();
      all[id] = list;
      saveAllComments(all);
    }
    function getLikedCommentIds(){
      if (dbMode(String(readingPage.dataset.currentId))) return Array.from(DB.commentLikes);
      try{ return JSON.parse(localStorage.getItem(COMMENT_LIKES_KEY) || '[]'); }
      catch(e){ return []; }
    }
    function setLikedCommentIds(arr){
      localStorage.setItem(COMMENT_LIKES_KEY, JSON.stringify(arr));
    }
    function totalCommentCount(list){
      return list.reduce((sum, c) => sum + 1 + (c.replies ? c.replies.length : 0), 0);
    }
    function relativeTime(ts){
      const diff = Math.max(0, Date.now() - ts);
      const min = Math.floor(diff / 60000);
      if (min < 1) return 'এইমাত্র';
      if (min < 60) return toBnLocal(min) + ' মিনিট আগে';
      const hr = Math.floor(min / 60);
      if (hr < 24) return toBnLocal(hr) + ' ঘণ্টা আগে';
      const day = Math.floor(hr / 24);
      if (day < 30) return toBnLocal(day) + ' দিন আগে';
      const mon = Math.floor(day / 30);
      return toBnLocal(mon) + ' মাস আগে';
    }
    function escapeHtml(str){
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    function buildCommentHtml(c, articleId, isReply){
      const liked = getLikedCommentIds().includes(c.id);
      const likeCount = (c.likeCount || 0) + (liked ? 1 : 0);
      const initial = (c.name || 'অ').charAt(0);
      const isOwn = c.userId ? !!(ME && c.userId === ME.id) : c.name === CURRENT_USER.name;
      const canDel = isOwn || !!(ME && ME.isAdmin && c.userId);
      return `
        <div class="comment-item" data-comment-id="${c.id}" data-reply="${isReply ? 'true' : 'false'}">
          <div class="c-avatar" style="background:${avatarColor(c.name || 'অ')}">${escapeHtml(initial)}</div>
          <div class="comment-main">
            <div class="comment-bubble-wrap" data-bubble-wrap="${c.id}">
              <div class="comment-bubble">
                <div class="comment-author">${escapeHtml(c.name)}</div>
                <div class="comment-text">${escapeHtml(c.text)}</div>
              </div>
            </div>
            <div class="comment-actions">
              <button type="button" class="comment-action-btn ${liked ? 'liked' : ''}" data-action="like-comment" data-id="${c.id}">পছন্দ</button>
              ${!isReply ? `<button type="button" class="comment-action-btn" data-action="reply" data-id="${c.id}">উত্তর দিন</button>` : ''}
              <span class="comment-time">${relativeTime(c.time)}</span>
              ${canDel ? `
                <div class="comment-more-wrap" data-more-wrap="${c.id}">
                  <button type="button" class="comment-more-btn" data-action="more" data-id="${c.id}" aria-label="আরও অপশন"><i data-lucide="more-horizontal" width="16" height="16"></i></button>
                  <div class="comment-more-menu" data-more-menu="${c.id}">
                    ${isOwn ? `<button type="button" class="comment-more-item" data-action="edit" data-id="${c.id}"><i data-lucide="pencil" width="14" height="14"></i> এডিট করুন</button>` : ''}
                    <button type="button" class="comment-more-item danger" data-action="delete" data-id="${c.id}"><i data-lucide="trash-2" width="14" height="14"></i> মুছুন</button>
                  </div>
                </div>` : ''}
              ${c.edited ? `<span class="comment-edited-tag">সম্পাদিত</span>` : ''}
              ${likeCount > 0 ? `<span class="comment-like-count"><i data-lucide="heart" width="11" height="11" fill="currentColor"></i> ${toBnLocal(likeCount)}</span>` : ''}
            </div>
            ${!isReply ? `<div class="reply-slot" data-reply-slot="${c.id}"></div>` : ''}
            ${!isReply && c.replies && c.replies.length ? `<div class="comment-replies">${c.replies.map(r => buildCommentHtml(r, articleId, true)).join('')}</div>` : ''}
          </div>
        </div>`;
    }

    function renderComments(articleId){
      const list = getCommentsFor(articleId);
      const listEl = document.getElementById('commentList');
      const headingEl = document.getElementById('commentsHeading');
      const countBadge = document.getElementById('readCommentCount');
      const total = totalCommentCount(list);

      headingEl.textContent = total > 0 ? `মন্তব্য (${toBnLocal(total)})` : 'মন্তব্য';
      countBadge.textContent = total > 0 ? `মন্তব্য (${toBnLocal(total)})` : 'মন্তব্য';

      if (!list.length){
        listEl.innerHTML = '<div class="comments-empty">এখনো কোনো মন্তব্য নেই। প্রথম মন্তব্যটি আপনিই করুন।</div>';
      } else {
        // newest first
        const sorted = [...list].sort((a,b) => b.time - a.time);
        listEl.innerHTML = sorted.map(c => buildCommentHtml(c, articleId, false)).join('');
      }
      renderIcons();
      updateComposerAvatar();
    }

    function updateComposerAvatar(){
      const avatarEl = document.getElementById('commentComposerAvatar');
      avatarEl.textContent = CURRENT_USER.name.charAt(0);
      avatarEl.style.background = avatarColor(CURRENT_USER.name);
    }

    function autoGrow(textarea){
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(160, textarea.scrollHeight) + 'px';
    }

    function updateSendBtnState(textarea, btn){
      const ready = textarea.value.trim().length > 0;
      btn.classList.toggle('is-ready', ready);
    }

    function postComment(articleId, text, name){
      if (dbMode(String(articleId))) return remotePost(articleId, text, null);
      const list = getCommentsFor(articleId);
      const comment = {
        id: 'c' + Date.now() + Math.random().toString(36).slice(2,7),
        name: name,
        text: text,
        time: Date.now(),
        likeCount: 0,
        replies: []
      };
      list.push(comment);
      setCommentsFor(articleId, list);
      renderComments(articleId);
      return true;
    }

    function postReply(articleId, parentId, text, name){
      if (dbMode(String(articleId))) return remotePost(articleId, text, parentId);
      const list = getCommentsFor(articleId);
      const parent = list.find(c => c.id === parentId);
      if (!parent) return;
      if (!parent.replies) parent.replies = [];
      parent.replies.push({
        id: 'r' + Date.now() + Math.random().toString(36).slice(2,7),
        name: name,
        text: text,
        time: Date.now(),
        likeCount: 0
      });
      setCommentsFor(articleId, list);
      renderComments(articleId);
    }

    function toggleCommentLike(commentId){
      if (dbMode(String(readingPage.dataset.currentId))){ remoteToggleCommentLike(commentId); return; }
      let liked = getLikedCommentIds();
      if (liked.includes(commentId)) liked = liked.filter(x => x !== commentId);
      else liked.push(commentId);
      setLikedCommentIds(liked);
      renderComments(readingPage.dataset.currentId);
    }

    // ---- Edit / delete helpers (search top-level comments and their replies) ----
    function updateCommentText(articleId, commentId, newText){
      if (dbMode(String(articleId))) remoteEdit(articleId, commentId, newText);
      const list = getCommentsFor(articleId);
      for (const c of list){
        if (c.id === commentId){ c.text = newText; c.edited = true; setCommentsFor(articleId, list); return true; }
        if (c.replies){
          for (const r of c.replies){
            if (r.id === commentId){ r.text = newText; r.edited = true; setCommentsFor(articleId, list); return true; }
          }
        }
      }
      return false;
    }
    function deleteCommentById(articleId, commentId){
      if (dbMode(String(articleId))) remoteDelete(articleId, commentId);
      let list = getCommentsFor(articleId);
      const beforeLen = list.length;
      list = list.filter(c => c.id !== commentId);
      if (list.length !== beforeLen){
        setCommentsFor(articleId, list);
        return true;
      }
      // Not a top-level comment, check replies
      let changed = false;
      list.forEach(c => {
        if (c.replies){
          const before = c.replies.length;
          c.replies = c.replies.filter(r => r.id !== commentId);
          if (c.replies.length !== before) changed = true;
        }
      });
      if (changed) setCommentsFor(articleId, list);
      return changed;
    }

    // ---- Composer events (main comment box) ----
    (function(){
      const textInput = document.getElementById('commentTextInput');
      const sendBtn = document.getElementById('commentSendBtn');

      textInput.addEventListener('input', () => { autoGrow(textInput); updateSendBtnState(textInput, sendBtn); });
      textInput.addEventListener('focus', () => { if (needLogin(readingPage.dataset.currentId)) textInput.blur(); });

      let sending = false;
      async function submit(){
        const text = textInput.value.trim();
        if (!text || sending) return;
        const articleId = readingPage.dataset.currentId;
        if (needLogin(articleId)) return;
        sending = true;
        let ok;
        try { ok = await postComment(articleId, text, CURRENT_USER.name); }
        catch (err){ console.error(err); ok = false; alert('মন্তব্য পাঠানো যায়নি: ' + err.message); }
        sending = false;
        if (ok === false) return;
        textInput.value = '';
        autoGrow(textInput);
        updateSendBtnState(textInput, sendBtn);
        document.querySelector(`.comment-item[data-comment-id]`)?.scrollIntoView({ behavior:'smooth', block:'center' });
      }

      sendBtn.addEventListener('click', submit);
      textInput.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey){
          e.preventDefault();
          submit();
        }
      });
    })();

    // ---- Delegated events for comment list: like + reply ----
    document.getElementById('commentList').addEventListener('click', e => {
      const likeBtn = e.target.closest('[data-action="like-comment"]');
      if (likeBtn){
        toggleCommentLike(likeBtn.dataset.id);
        return;
      }

      const moreBtn = e.target.closest('[data-action="more"]');
      if (moreBtn){
        const menu = document.querySelector(`[data-more-menu="${moreBtn.dataset.id}"]`);
        const wasOpen = menu.classList.contains('open');
        document.querySelectorAll('.comment-more-menu.open').forEach(m => m.classList.remove('open'));
        if (!wasOpen) menu.classList.add('open');
        return;
      }

      const editBtn = e.target.closest('[data-action="edit"]');
      if (editBtn){
        document.querySelectorAll('.comment-more-menu.open').forEach(m => m.classList.remove('open'));
        openEditMode(editBtn.dataset.id);
        return;
      }

      const deleteBtn = e.target.closest('[data-action="delete"]');
      if (deleteBtn){
        document.querySelectorAll('.comment-more-menu.open').forEach(m => m.classList.remove('open'));
        if (confirm('আপনি কি এই মন্তব্যটি মুছে ফেলতে চান?')){
          deleteCommentById(readingPage.dataset.currentId, deleteBtn.dataset.id);
          renderComments(readingPage.dataset.currentId);
        }
        return;
      }

      const replyBtn = e.target.closest('[data-action="reply"]');
      if (replyBtn){
        if (needLogin(readingPage.dataset.currentId)) return;
        const commentId = replyBtn.dataset.id;
        const slot = document.querySelector(`[data-reply-slot="${commentId}"]`);
        if (!slot) return;
        // Toggle: if already open, close it
        if (slot.dataset.open === 'true'){
          slot.innerHTML = '';
          slot.dataset.open = 'false';
          return;
        }
        slot.dataset.open = 'true';
        slot.innerHTML = `
          <div class="reply-composer">
            <div class="c-avatar" style="background:${avatarColor(CURRENT_USER.name)}">${escapeHtml(CURRENT_USER.name.charAt(0))}</div>
            <div class="comment-composer-body" style="flex:1;">
              <div class="comment-textarea-wrap">
                <textarea class="comment-textarea" placeholder="একটি উত্তর লিখুন…" rows="1" maxlength="1000"></textarea>
                <button type="button" class="comment-send-btn" aria-label="উত্তর পাঠান"><i data-lucide="arrow-right" width="16" height="16"></i></button>
              </div>
            </div>
          </div>`;
        renderIcons();
        const rTextInput = slot.querySelector('.comment-textarea');
        const rSendBtn = slot.querySelector('.comment-send-btn');
        rTextInput.addEventListener('input', () => { autoGrow(rTextInput); updateSendBtnState(rTextInput, rSendBtn); });
        rTextInput.focus();
        function submitReply(){
          const text = rTextInput.value.trim();
          if (!text) return;
          postReply(readingPage.dataset.currentId, commentId, text, CURRENT_USER.name);
        }
        rSendBtn.addEventListener('click', submitReply);
        rTextInput.addEventListener('keydown', ev => {
          if (ev.key === 'Enter' && !ev.shiftKey){ ev.preventDefault(); submitReply(); }
        });
      }
    });

    // Close any open three-dot menu when clicking outside it
    document.addEventListener('click', e => {
      if (!e.target.closest('.comment-more-wrap')){
        document.querySelectorAll('.comment-more-menu.open').forEach(m => m.classList.remove('open'));
      }
    });

    function openEditMode(commentId){
      const wrap = document.querySelector(`[data-bubble-wrap="${commentId}"]`);
      if (!wrap) return;
      const item = wrap.closest('.comment-item');
      const isReply = item?.dataset.reply === 'true';
      const articleId = readingPage.dataset.currentId;
      const list = getCommentsFor(articleId);
      let target = list.find(c => c.id === commentId);
      if (!target){
        for (const c of list){ if (c.replies){ target = c.replies.find(r => r.id === commentId); if (target) break; } }
      }
      if (!target) return;

      const originalHtml = wrap.innerHTML;
      wrap.innerHTML = `
        <div class="comment-edit-box">
          <textarea maxlength="1000" rows="1">${escapeHtml(target.text)}</textarea>
          <div class="comment-edit-actions">
            <button type="button" class="cancel-btn">বাতিল</button>
            <button type="button" class="save-btn">সংরক্ষণ করুন</button>
          </div>
        </div>`;
      const ta = wrap.querySelector('textarea');
      autoGrow(ta);
      ta.focus();
      ta.setSelectionRange(ta.value.length, ta.value.length);
      ta.addEventListener('input', () => autoGrow(ta));

      wrap.querySelector('.cancel-btn').addEventListener('click', () => {
        wrap.innerHTML = originalHtml;
      });
      wrap.querySelector('.save-btn').addEventListener('click', () => {
        const newText = ta.value.trim();
        if (!newText) return;
        updateCommentText(articleId, commentId, newText);
        renderComments(articleId);
      });
      ta.addEventListener('keydown', ev => {
        if (ev.key === 'Enter' && !ev.shiftKey){
          ev.preventDefault();
          const newText = ta.value.trim();
          if (!newText) return;
          updateCommentText(articleId, commentId, newText);
          renderComments(articleId);
        } else if (ev.key === 'Escape'){
          wrap.innerHTML = originalHtml;
        }
      });
    }

    window.openReadingArticle = function(id){
      readingPage.dataset.currentId = id;
      renderArticle(id);
    };

    // ==================================================================
    // লেখক পেজ: কোনো লেখার "আরও লেখা পড়ুন" বাটন থেকে এখানে আসা যায়।
    // হ্যাশ: #author/<যে লেখা থেকে এসেছে তার id>। লেখকের পরিচয় সেই লেখা থেকেই নেওয়া হয়।
    // (ব্যাকএন্ড যুক্ত হলে authorId দিয়ে বদলে নিন।)
    // ==================================================================
    function articleExcerpt(a){
      const all = (a.body || []).join(' ').replace(/\s+/g, ' ').trim();
      return all.length > 1500 ? all.slice(0, 1500) : all;   // the card shows as much as fits; the rest is in reading mode
    }
    // Fit the excerpt to the card: as much text as the card holds, cut at a word, ending with "…"
    function fitExcerpt(p){
      if (!p) return;
      if (p.dataset.full === undefined) p.dataset.full = p.textContent;
      const full = p.dataset.full;
      p.textContent = full;
      if (p.clientHeight === 0) return;                    // hidden right now: fitted when it is shown
      if (p.scrollHeight <= p.clientHeight + 1) return;     // everything fits
      let lo = 0, hi = full.length;
      while (lo < hi){
        const mid = Math.ceil((lo + hi) / 2);
        p.textContent = full.slice(0, mid).replace(/\s+\S*$/, '') + '…';
        if (p.scrollHeight <= p.clientHeight + 1) lo = mid; else hi = mid - 1;
      }
      p.textContent = full.slice(0, lo).replace(/\s+\S*$/, '') + '…';
    }
    const excerptObserver = ('ResizeObserver' in window) ? new ResizeObserver(entries => {
      entries.forEach(en => fitExcerpt(en.target.querySelector('p.excerpt')));
    }) : null;
    function watchCards(root){
      (root || document).querySelectorAll('.card-grid .write-card').forEach(card => {
        const p = card.querySelector('p.excerpt');
        if (!p) return;
        if (!card._fitWatch){ card._fitWatch = true; if (excerptObserver) excerptObserver.observe(card); }
        fitExcerpt(p);
      });
    }
    watchCards(document);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => watchCards(document));
    window.openAuthorPage = function(fromId){
      const origin = ARTICLES[fromId] || ARTICLES[1];
      const originId = ARTICLES[fromId] ? String(fromId) : '1';
      const name = origin.author;
      const all = Object.keys(ARTICLES).filter(k => ARTICLES[k].author === name);
      const others = all.filter(k => k !== originId);

      document.title = name + ' · পরিবর্তন';
      document.getElementById('authorCrumbName').textContent = name;
      document.getElementById('authorName').textContent = name;
      document.getElementById('authorSub').textContent = origin.authorSub || '';
      const bioEl = document.getElementById('authorBio');
      bioEl.textContent = origin.bio || '';
      bioEl.style.display = origin.bio ? '' : 'none';
      setAvatar(document.getElementById('authorAvatar'), origin);
      document.getElementById('authorCount').textContent = 'মোট ' + toBnLocal(all.length) + 'টি লেখা';

      const back = document.getElementById('authorBackLink');
      back.setAttribute('href', '#read/' + originId);
      back.querySelector('span').textContent = '“' + origin.title + '” লেখায় ফিরুন';

      document.getElementById('authorListHeading').textContent = name + '-এর অন্যান্য লেখা';

      const grid = document.getElementById('authorCardGrid');
      grid.innerHTML = others.map(k => {
        const a = ARTICLES[k];
        const { minutes } = wordsToReadTime(a.body);
        const avatar = a.pic ? '<img src="' + escapeHtml(a.pic) + '" alt="">' : escapeHtml(a.author.charAt(0));
        return '<div class="write-card" data-cat="' + escapeHtml(a.cat) + '" data-article="' + k + '" tabindex="0" role="button">' +
          '<div class="write-head"><h3>' + escapeHtml(a.title) + '</h3>' +
          '<span class="tag">' + escapeHtml(a.cat) + '</span></div>' +
          '<p class="excerpt">' + escapeHtml(articleExcerpt(a)) + '</p>' +
          '<div class="meta"><div class="author"><span class="avatar">' + avatar + '</span>' +
          '<div class="author-info"><span class="author-name">' + escapeHtml(a.author) + '</span>' +
          '<span class="author-sub">' + escapeHtml(a.authorSub || '') + '</span></div></div></div>' +
          '</div>';
      }).join('');
      watchCards(grid);
      document.getElementById('authorEmptyNote').classList.toggle('show', others.length === 0);
      renderIcons();
    };

    // Delegate clicks on any write-card across the whole document
    document.addEventListener('click', e => {
      const card = e.target.closest('.write-card[data-article]');
      if (!card) return;
      const id = card.dataset.article;
      location.hash = '#read/' + id;
    });
    document.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest && e.target.closest('.write-card[data-article]');
      if (!card) return;
      e.preventDefault();
      location.hash = '#read/' + card.dataset.article;
    });

    // ---- Reading progress bar ----
    function updateProgress(){
      if (!readingPage.classList.contains('is-active')) return;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
      readProgress.style.width = pct + '%';
    }
    window.addEventListener('scroll', updateProgress, { passive:true });

    // ---- Bookmark / Like handlers ----
    document.getElementById('readBookmarkBtn').addEventListener('click', () => {
      const id = Number(readingPage.dataset.currentId);
      let bookmarks = JSON.parse(localStorage.getItem('parivartan_bookmarks') || '[]');
      if (bookmarks.includes(id)) bookmarks = bookmarks.filter(x => x !== id);
      else bookmarks.push(id);
      localStorage.setItem('parivartan_bookmarks', JSON.stringify(bookmarks));
      syncEngagement(id);
    });
    document.getElementById('readLikeBtn').addEventListener('click', async () => {
      const key = String(readingPage.dataset.currentId);
      if (dbMode(key)){
        if (needLogin(key)) return;
        const aid = uuidOf(key);
        if (DB.likes.has(aid)){
          DB.likes.delete(aid); DB.likeCount[aid] = Math.max(0, (DB.likeCount[aid] || 0) - 1); syncEngagement(key);
          await sb.from('article_likes').delete().eq('article_id', aid).eq('user_id', ME.id);
        } else {
          DB.likes.add(aid); DB.likeCount[aid] = (DB.likeCount[aid] || 0) + 1; syncEngagement(key);
          await sb.from('article_likes').insert({ article_id: aid, user_id: ME.id });
        }
        await loadLikeCount(key); syncEngagement(key);
        return;
      }
      const id = Number(key);
      let likes = JSON.parse(localStorage.getItem('parivartan_likes') || '[]');
      if (likes.includes(id)) likes = likes.filter(x => x !== id);
      else likes.push(id);
      localStorage.setItem('parivartan_likes', JSON.stringify(likes));
      syncEngagement(id);
    });
    // ---- Share menu ----
    (function(){
      const shareBtn   = document.getElementById('readShareBtn');
      const shareMenu  = document.getElementById('shareMenu');
      const backdrop   = document.getElementById('shareBackdrop');
      const closeBtn   = document.getElementById('shareClose');
      const nativeItem = document.getElementById('shareNativeItem');
      const linkInput  = document.getElementById('shareLinkInput');
      const copyBtn    = document.getElementById('shareCopyItem');
      const copyLabel  = document.getElementById('shareCopyLabel');
      const statusEl   = document.getElementById('shareStatus');
      const headSub    = document.getElementById('shareHeadSub');
      const isMobileUA = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      let copyTimer = null;

      if (navigator.share) nativeItem.style.display = 'flex';

      const shareUrl   = () => location.href;
      const shareTitle = () => (document.getElementById('readTitle').textContent || '').trim() || 'পরিবর্তন';

      function setStatus(msg, warn){
        statusEl.textContent = msg || '';
        statusEl.classList.toggle('warn', !!warn);
      }
      function resetCopyBtn(){
        clearTimeout(copyTimer);
        copyBtn.classList.remove('done');
        copyLabel.textContent = 'কপি';
      }
      function isOpen(){ return shareMenu.classList.contains('open'); }

      function openMenu(){
        linkInput.value = shareUrl();
        headSub.textContent = shareTitle();
        resetCopyBtn();
        setStatus('');
        if (!/^https?:$/.test(location.protocol)){
          setStatus('এই লিংকটি এখন শুধু আপনার ডিভাইসে খুলবে। ওয়েবসাইট অনলাইনে হোস্ট করার পর শেয়ার করা লিংক সবার জন্য কাজ করবে।', true);
        }
        shareMenu.classList.add('open');
        backdrop.classList.add('open');
        shareBtn.setAttribute('aria-expanded','true');
        const first = shareMenu.querySelector('.share-opt');
        if (first) setTimeout(() => first.focus({ preventScroll:true }), 60);
      }
      function closeMenu(returnFocus){
        shareMenu.classList.remove('open');
        backdrop.classList.remove('open');
        shareBtn.setAttribute('aria-expanded','false');
        resetCopyBtn();
        setStatus('');
        if (returnFocus) shareBtn.focus({ preventScroll:true });
      }

      shareBtn.addEventListener('click', e => {
        e.stopPropagation();
        isOpen() ? closeMenu() : openMenu();
      });
      closeBtn.addEventListener('click', () => closeMenu(true));
      backdrop.addEventListener('click', () => closeMenu());
      document.addEventListener('click', e => {
        if (isOpen() && !e.target.closest('.share-menu-wrap')) closeMenu();
      });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && isOpen()) closeMenu(true);
      });
      window.addEventListener('hashchange', () => { if (isOpen()) closeMenu(); });

      function popup(u){
        const w = window.open(u, '_blank', 'noopener,noreferrer,width=620,height=560');
        // with noopener the return value is always null, so a blocked popup cannot be detected here
        return w;
      }
      function openLink(u){
        const a = document.createElement('a');
        a.href = u; a.rel = 'noopener';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }

      function fallbackCopy(text){
        try{
          linkInput.removeAttribute('readonly');
          linkInput.value = text; linkInput.select(); linkInput.setSelectionRange(0, text.length);
          const ok = document.execCommand('copy');
          linkInput.setAttribute('readonly','');
          return ok;
        }catch(err){
          linkInput.setAttribute('readonly','');
          return false;
        }
      }
      function copyText(text){
        if (navigator.clipboard && window.isSecureContext){
          return navigator.clipboard.writeText(text).then(() => true).catch(() => fallbackCopy(text));
        }
        return Promise.resolve(fallbackCopy(text));
      }

      function doCopy(){
        return copyText(shareUrl()).then(ok => {
          if (ok){
            copyBtn.classList.add('done');
            copyLabel.textContent = 'কপি হয়েছে';
            setStatus('লিংক কপি হয়েছে');
            clearTimeout(copyTimer);
            copyTimer = setTimeout(() => { resetCopyBtn(); setStatus(''); }, 2200);
          } else {
            linkInput.focus(); linkInput.select();
            setStatus('অটো কপি হয়নি। লিংকটি সিলেক্ট করা আছে, নিজে কপি করে নিন।', true);
          }
          return ok;
        });
      }

      shareMenu.addEventListener('click', e => {
        const item = e.target.closest('[data-share]');
        if (!item) return;
        const url = shareUrl(), title = shareTitle();
        const enc = encodeURIComponent;
        switch (item.dataset.share){
          case 'native':
            navigator.share({ title, text: title, url }).catch(() => {});
            closeMenu();
            break;
          case 'whatsapp':
            popup('https://wa.me/?text=' + enc(title + '\n' + url));
            closeMenu();
            break;
          case 'facebook':
            popup('https://www.facebook.com/sharer/sharer.php?u=' + enc(url));
            closeMenu();
            break;
          case 'telegram':
            popup('https://t.me/share/url?url=' + enc(url) + '&text=' + enc(title));
            closeMenu();
            break;
          case 'twitter':
            popup('https://x.com/intent/post?text=' + enc(title) + '&url=' + enc(url));
            closeMenu();
            break;
          case 'email':
            openLink('mailto:?subject=' + enc(title) + '&body=' + enc(title + '\n\n' + url));
            closeMenu();
            break;
          case 'messenger':
            // Messenger has no public web share URL without a Facebook app id,
            // so the link is copied first as a safe fallback.
            copyText(url).then(ok => {
              if (isMobileUA){
                openLink('fb-messenger://share/?link=' + enc(url));
                setTimeout(() => {
                  if (document.visibilityState === 'visible' && isOpen()){
                    setStatus(ok ? 'Messenger খুলছে না? লিংক কপি করা হয়েছে, Messenger-এ পেস্ট করুন।' : 'Messenger খুলছে না? উপরের বক্স থেকে লিংক কপি করুন।', true);
                  } else { closeMenu(); }
                }, 1400);
              } else {
                popup('https://www.messenger.com/');
                setStatus(ok ? 'লিংক কপি হয়েছে। খোলা Messenger-এ পেস্ট করে পাঠান।' : 'উপরের বক্স থেকে লিংক কপি করে Messenger-এ পাঠান।', !ok);
              }
            });
            break;
          case 'copy':
            doCopy();
            break;
        }
      });
    })();

    document.getElementById('readCommentBtn').addEventListener('click', () => {
      const section = document.getElementById('commentsSection');
      section?.scrollIntoView({ behavior:'smooth', block:'start' });
      setTimeout(() => document.getElementById('commentTextInput')?.focus(), 400);
    });

    // ==================================================================
    // Settings panel: theme, font size, font family, line-height, width
    // ==================================================================
    const DEFAULTS = { theme:'light', fontStep:2, fontFamily:'kalpurush', lineHeight:2.05, width:700, autoDark:false, focus:false };
    const FONT_SIZES = ['0.98rem','1.06rem','1.15rem','1.28rem','1.42rem']; // 5 steps, index 2 = default
    let settings = Object.assign({}, DEFAULTS);

    function loadSettings(){
      try{
        const saved = JSON.parse(localStorage.getItem('parivartan_read_settings') || '{}');
        settings = Object.assign({}, DEFAULTS, saved);
      }catch(e){ settings = Object.assign({}, DEFAULTS); }
    }
    function saveSettings(){
      localStorage.setItem('parivartan_read_settings', JSON.stringify(settings));
      if (window.sb && ME){
        clearTimeout(settingsTimer);
        const uid = ME.id, snapshot = Object.assign({}, settings);
        settingsTimer = setTimeout(() => { sb.from('profiles').update({ reading_settings: snapshot }).eq('id', uid).then(() => {}, () => {}); }, 700);
      }
    }

    function applySettings(){
      // Theme (respecting auto-dark by time of day if enabled)
      let effectiveTheme = settings.theme;
      if (settings.autoDark){
        const hour = new Date().getHours();
        effectiveTheme = (hour >= 19 || hour < 6) ? 'dark' : settings.theme === 'dark' ? 'dark' : settings.theme;
      }
      readingPage.setAttribute('data-rtheme', effectiveTheme);

      readingPage.style.setProperty('--read-font-size', FONT_SIZES[settings.fontStep]);
      readingPage.style.setProperty('--read-line-height', settings.lineHeight);
      readingPage.style.setProperty('--read-max-w', settings.width + 'px');
      readingPage.style.setProperty('--read-font-family', settings.fontFamily === 'kalpurush' ? "'Kalpurush', serif" : "'Hind Siliguri', 'Noto Sans Bengali', sans-serif");
      readingPage.classList.toggle('focus-mode', !!settings.focus);

      // Reflect UI state
      document.querySelectorAll('.theme-swatch').forEach(sw => sw.classList.toggle('active', sw.dataset.theme === settings.theme));
      document.querySelectorAll('.font-choice').forEach(fc => fc.classList.toggle('active', fc.dataset.font === settings.fontFamily));
      document.getElementById('lineHeightSlider').value = settings.lineHeight;
      document.getElementById('widthSlider').value = settings.width;
      document.getElementById('autoDarkToggle').checked = settings.autoDark;
      document.getElementById('focusModeToggle').checked = settings.focus;

      const decBtn = document.getElementById('fontDecBtn');
      const incBtn = document.getElementById('fontIncBtn');
      decBtn.disabled = settings.fontStep === 0;
      incBtn.disabled = settings.fontStep === FONT_SIZES.length - 1;
      const track = document.getElementById('fontStepperTrack');
      track.innerHTML = FONT_SIZES.map((_, i) => `<span class="stepper-seg ${i <= settings.fontStep ? 'filled' : ''}"></span>`).join('');
      const labels = ['অতি ছোট','ছোট','স্বাভাবিক','বড়','অতি বড়'];
      document.getElementById('fontStepperValue').textContent = labels[settings.fontStep];
    }

    document.querySelectorAll('.theme-swatch').forEach(sw => {
      sw.addEventListener('click', () => { settings.theme = sw.dataset.theme; saveSettings(); applySettings(); });
    });
    document.querySelectorAll('.font-choice').forEach(fc => {
      fc.addEventListener('click', () => { settings.fontFamily = fc.dataset.font; saveSettings(); applySettings(); });
    });
    document.getElementById('fontIncBtn').addEventListener('click', () => {
      settings.fontStep = Math.min(FONT_SIZES.length - 1, settings.fontStep + 1); saveSettings(); applySettings();
    });
    document.getElementById('fontDecBtn').addEventListener('click', () => {
      settings.fontStep = Math.max(0, settings.fontStep - 1); saveSettings(); applySettings();
    });
    document.getElementById('lineHeightSlider').addEventListener('input', e => {
      settings.lineHeight = parseFloat(e.target.value); saveSettings(); applySettings();
    });
    document.getElementById('widthSlider').addEventListener('input', e => {
      settings.width = parseInt(e.target.value, 10); saveSettings(); applySettings();
    });
    document.getElementById('autoDarkToggle').addEventListener('change', e => {
      settings.autoDark = e.target.checked; saveSettings(); applySettings();
    });
    document.getElementById('focusModeToggle').addEventListener('change', e => {
      settings.focus = e.target.checked; saveSettings(); applySettings();
    });
    document.getElementById('settingsResetBtn').addEventListener('click', () => {
      settings = Object.assign({}, DEFAULTS); saveSettings(); applySettings();
    });

    // Open / close panel
    const settingsPanel = document.getElementById('settingsPanel');
    const settingsBackdrop = document.getElementById('settingsBackdrop');
    function openSettings(){
      settingsPanel.classList.add('open');
      settingsBackdrop.classList.add('open');
      document.getElementById('readSettingsBtn').classList.add('is-active');
    }
    function closeSettings(){
      settingsPanel.classList.remove('open');
      settingsBackdrop.classList.remove('open');
      document.getElementById('readSettingsBtn').classList.remove('is-active');
    }
    document.getElementById('readSettingsBtn').addEventListener('click', () => {
      settingsPanel.classList.contains('open') ? closeSettings() : openSettings();
    });
    document.getElementById('settingsCloseBtn').addEventListener('click', closeSettings);
    settingsBackdrop.addEventListener('click', closeSettings);

    // ---- Keyboard shortcuts (only while reading page is active) ----
    document.addEventListener('keydown', e => {
      if (!readingPage.classList.contains('is-active')) return;
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if (e.key === 'Escape'){
        if (settingsPanel.classList.contains('open')) closeSettings();
        else location.hash = '#lekha';
      } else if (e.key === '+' || e.key === '='){
        settings.fontStep = Math.min(FONT_SIZES.length - 1, settings.fontStep + 1); saveSettings(); applySettings();
      } else if (e.key === '-' || e.key === '_'){
        settings.fontStep = Math.max(0, settings.fontStep - 1); saveSettings(); applySettings();
      } else if (e.key === 'd' || e.key === 'D'){
        settings.theme = settings.theme === 'dark' ? 'light' : 'dark'; saveSettings(); applySettings();
      }
    });

    loadSettings();
    applySettings();
  })();

  window.addEventListener('hashchange', route);
  route();

  // ---------- Gallery lightbox (preview with previous / next, swipe and arrow keys) ----------
  // Wrapped in DOMContentLoaded: this script sits before the #lightboxBackdrop markup in index.html,
  // so the lightbox elements only exist once the page has finished parsing.
  document.addEventListener('DOMContentLoaded', () => {
    const backdrop = document.getElementById('lightboxBackdrop');
    if (!backdrop) return;
    const box = backdrop.querySelector('.lightbox-box');
    const labelEl = backdrop.querySelector('.lb-label');
    const countEl = backdrop.querySelector('.lb-count');
    const prevBtn = backdrop.querySelector('[data-lb-prev]');
    const nextBtn = backdrop.querySelector('[data-lb-next]');
    const toBn = n => String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
    let lastFocus = null;
    let group = [];
    let index = 0;
    let touchX = null;

    // Photos shown in the same grid; pagination hides the others with display:none
    function visibleGroup(item){
      return Array.from(item.parentElement.children).filter(el =>
        el.classList.contains('g-item') && el.style.display !== 'none');
    }

    function showAt(i){
      index = (i + group.length) % group.length;
      const item = group[index];
      const style = getComputedStyle(item);
      box.style.background = style.backgroundImage !== 'none' ? style.backgroundImage : style.backgroundColor;
      box.style.backgroundSize = 'cover';
      box.style.backgroundPosition = 'center';
      const labelSpan = item.querySelector('.g-label');
      labelEl.innerHTML = labelSpan ? labelSpan.innerHTML : '';
      const many = group.length > 1;
      countEl.textContent = many ? toBn(index + 1) + ' / ' + toBn(group.length) : '';
      prevBtn.hidden = !many;
      nextBtn.hidden = !many;
      renderIcons();
    }

    function openLightbox(item){
      group = visibleGroup(item);
      lastFocus = document.activeElement;
      backdrop.classList.add('open');
      backdrop.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      showAt(Math.max(0, group.indexOf(item)));
    }

    function closeLightbox(){
      backdrop.classList.remove('open');
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      if (lastFocus) lastFocus.focus();
    }

    function step(d){ if (group.length > 1) showAt(index + d); }

    document.addEventListener('click', e => {
      const item = e.target.closest('.g-item');
      if (item) openLightbox(item);
    });
    prevBtn.addEventListener('click', e => { e.stopPropagation(); step(-1); });
    nextBtn.addEventListener('click', e => { e.stopPropagation(); step(1); });
    backdrop.querySelector('[data-close-modal]').addEventListener('click', closeLightbox);
    backdrop.addEventListener('click', e => { if (e.target === backdrop) closeLightbox(); });

    document.addEventListener('keydown', e => {
      if (backdrop.classList.contains('open')){
        if (e.key === 'Escape') closeLightbox();
        else if (e.key === 'ArrowLeft') step(-1);
        else if (e.key === 'ArrowRight') step(1);
        return;
      }
      const item = document.activeElement && document.activeElement.closest && document.activeElement.closest('.g-item');
      if (item && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); openLightbox(item); }
    });

    // Swipe left or right on touch screens
    box.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', e => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
    });

    // Make static gallery items keyboard-focusable
    document.querySelectorAll('.g-item').forEach(it => { it.tabIndex = 0; it.style.cursor = 'pointer'; });
  });
