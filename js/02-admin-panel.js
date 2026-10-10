
  function renderIcons(){ if (window.lucide) lucide.createIcons(); }
  renderIcons();

  // ---------- Upload boxes: wire hidden file inputs, show filename, enforce 10MB limit ----------
  const ADM_MAX_FILE_BYTES = 10 * 1024 * 1024;
  function admFormatSize(bytes){
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
  function wireUploadBoxes(scope){
    (scope || document).querySelectorAll('[data-upload-box]').forEach(box => {
      const input = box.querySelector('input[type=file]');
      const labelDiv = box.querySelector('[data-upload-label]');
      if (!input || !labelDiv || input.dataset.wired) return;
      input.dataset.wired = '1';
      const original = labelDiv.textContent;
      input.addEventListener('change', () => {
        const f = input.files && input.files[0];
        if (!f) return;
        if (f.size > ADM_MAX_FILE_BYTES){
          alert('ফাইলের আকার সর্বোচ্চ ১০MB এর মধ্যে হতে হবে। (নির্বাচিত ফাইল: ' + admFormatSize(f.size) + ')');
          input.value = '';
          labelDiv.textContent = original;
          box.classList.remove('has-file');
          return;
        }
        labelDiv.textContent = f.name + ' (' + admFormatSize(f.size) + ')';
        box.classList.add('has-file');
      });
    });
  }
  wireUploadBoxes(document);

  // ---------- Responsive tables: label each cell with its column header ----------
  // On mobile, tables collapse into stacked cards (see @media max-width:680px).
  // This reads each table's <thead> once and tags every <td> with data-label
  // so the CSS can show "কলামের নাম: মান" per row without editing every row by hand.
  function labelTableCells(scope){
    (scope || document).querySelectorAll('table').forEach(table => {
      const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
      if (!headers.length) return;
      table.querySelectorAll('tbody tr').forEach(row => {
        Array.from(row.children).forEach((td, i) => {
          if (td.colSpan > 1) return;            // full-width message rows have no column
          if (headers[i] !== undefined) td.setAttribute('data-label', headers[i]);
        });
      });
    });
  }
  labelTableCells();

  // ---------- Sidebar navigation ----------
  const viewTitles = {
    dashboard:  ['ড্যাশবোর্ড', 'এডমিন প্যানেল / ড্যাশবোর্ড', 'নতুন যোগ করুন'],
    writings:   ['লেখা', 'এডমিন প্যানেল / লেখা', 'নতুন লেখা যোগ করুন'],
    magazine:   ['ম্যাগাজিন', 'এডমিন প্যানেল / ম্যাগাজিন', 'নতুন সংখ্যা যোগ করুন'],
    events:     ['অনুষ্ঠান', 'এডমিন প্যানেল / অনুষ্ঠান', 'নতুন অনুষ্ঠান যোগ করুন'],
    gallery:    ['গ্যালারি', 'এডমিন প্যানেল / গ্যালারি', 'নতুন ছবি আপলোড করুন'],
    genres:     ['ধরন', 'এডমিন প্যানেল / ধরন', 'নতুন ধরন যোগ করুন'],
    members:    ['সদস্য', 'এডমিন প্যানেল / সদস্য', 'নতুন সদস্য যোগ করুন'],
    submissions:['প্রাপ্ত লেখা', 'এডমিন প্যানেল / প্রাপ্ত লেখা', 'নতুন যোগ করুন'],
    'submission-review':['লেখা পর্যালোচনা', 'এডমিন প্যানেল / প্রাপ্ত লেখা / পর্যালোচনা', 'নতুন যোগ করুন'],
    homepage:   ['হোমপেজ টেক্সট', 'এডমিন প্যানেল / হোমপেজ টেক্সট', 'নতুন ধাপ যোগ করুন'],
    settings:   ['সেটিংস', 'এডমিন প্যানেল / সেটিংস', 'নতুন যোগ করুন']
  };

  const navItems = document.querySelectorAll('.adm-nav-item[data-view]');
  const viewPanels = document.querySelectorAll('[data-view-panel]');
  const viewTitleEl = document.getElementById('admViewTitle');
  const viewCrumbEl = document.getElementById('admViewCrumb');
  const topAddBtn = document.getElementById('admTopAddBtn');
  const topAddLabel = document.getElementById('admTopAddLabel');
  topAddBtn.style.display = 'none'; // dashboard is the default view and has no add action

  function goToView(name){
    // The review page has no menu entry of its own; keep "প্রাপ্ত লেখা" highlighted while it is open.
    const navName = (name === 'submission-review') ? 'submissions' : name;
    navItems.forEach(n => n.classList.toggle('adm-active', n.dataset.view === navName));
    document.querySelectorAll('.adm-tab[data-view]').forEach(t => t.classList.toggle('adm-active', t.dataset.view === navName));
    const mb = document.getElementById('admMoreBtn'); if (mb) mb.classList.toggle('adm-active', !document.querySelector('.adm-tab[data-view].adm-active'));
    viewPanels.forEach(p => p.classList.toggle('adm-active', p.dataset.viewPanel === name));
    const meta = viewTitles[name] || ['', '', 'নতুন যোগ করুন'];
    viewTitleEl.textContent = meta[0];
    viewCrumbEl.textContent = meta[1];
    topAddLabel.textContent = meta[2];
    topAddBtn.style.display = (name === 'dashboard' || name === 'settings' || name === 'submissions' || name === 'submission-review' || name === 'members') ? 'none' : '';
    closeSidebarOnMobile();
    window.scrollTo({top:0, behavior:'smooth'});
    // database থেকে তালিকা তাজা করা
    if (name === 'writings') loadWritings();
    if (name === 'events') loadEvents();
    if (name === 'magazine') loadMagazine();
    if (name === 'gallery') loadGallery();
    if (name === 'genres') loadGenresAdmin();
    if (name === 'dashboard') loadDashboardCounts();
    if (name === 'members') loadMembers();
    if (name === 'submissions') loadSubmissions();
    if (name === 'homepage') loadHomepage();
    if (name === 'settings') loadSettings();
  }
  navItems.forEach(btn => btn.addEventListener('click', () => goToView(btn.dataset.view)));
  document.querySelectorAll('.adm-tab[data-view]').forEach(btn => btn.addEventListener('click', () => goToView(btn.dataset.view)));
  document.getElementById('admMoreBtn').addEventListener('click', () => setSidebarState(true));
  document.querySelectorAll('[data-goto]').forEach(btn => btn.addEventListener('click', () => goToView(btn.dataset.goto)));

  // ---------- Mobile sidebar ----------
  // The layout normally switches to mobile mode purely via the
  // @media(max-width:980px) rule. Some embedding/rendering contexts
  // (e.g. this file opened directly from content://downloads/... instead
  // of inside the site's iframe) can fail to apply that breakpoint even
  // though the viewport is narrow. As a safety net, this JS mirrors the
  // same breakpoint by toggling a class on <html>, and CSS below keys off
  // BOTH the media query and this class so mobile layout is guaranteed.
  function syncMobileMode(){
    const isMobile = window.innerWidth <= 980;
    const isSmallPhone = window.innerWidth <= 680;
    document.documentElement.classList.toggle('adm-force-mobile-nav', isMobile);
    document.documentElement.classList.toggle('adm-force-mobile-nav-sm', isSmallPhone);
    if (!isMobile) closeSidebarOnMobile();
  }
  const sidebar = document.getElementById('admSidebar');
  const scrim = document.getElementById('admSidebarScrim');
  scrim.addEventListener('click', closeSidebarOnMobile);
  syncMobileMode();
  window.addEventListener('resize', syncMobileMode);
  window.addEventListener('orientationchange', syncMobileMode);

  // ---------- Mobile sidebar hardening ----------
  // Keep the drawer usable on touch devices and prevent the page behind it
  // from scrolling while the drawer is open.
  function setSidebarState(open){
    const mobile = window.innerWidth <= 980;
    sidebar.classList.toggle('adm-open', !!open && mobile);
    scrim.classList.toggle('adm-show', !!open && mobile);
    document.body.classList.toggle('adm-sidebar-is-open', !!open && mobile);
    const toggle = document.getElementById('admMenuToggle');
    if (toggle){
      const active = !!open && mobile;
      toggle.setAttribute('aria-expanded', String(active));
      toggle.classList.toggle('adm-is-open', active);
      toggle.setAttribute('aria-label', active ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন');
    }
  }

  document.getElementById('admMenuToggle').addEventListener('click', () => {
    setSidebarState(!sidebar.classList.contains('adm-open'));
  });

  // Override the earlier direct class toggles with the hardened state helper.
  function closeSidebarOnMobile(){
    setSidebarState(false);
  }

  // Close the drawer after tapping any navigation item.
  navItems.forEach(btn => {
    btn.addEventListener('click', closeSidebarOnMobile, {passive:true});
  });

  // Close with Escape.
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeSidebarOnMobile();
  });

  // ---------- Toast ----------
  const toast = document.getElementById('admToast');
  const toastMsg = document.getElementById('admToastMsg');
  function showToast(msg){
    toastMsg.textContent = msg;
    toast.classList.add('adm-show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('adm-show'), 2400);
  }

  // ---------- Add/Edit modal (UI-only demo forms per section) ----------
  const editModal = document.getElementById('admEditModal');
  const editModalTitle = document.getElementById('admEditModalTitle');
  const editModalBody = document.getElementById('admEditModalBody');
  const modalSaveBtn = document.getElementById('admModalSaveBtn');

  const formTemplates = {
    writings: (data) => `
      <div class="adm-field"><label>শিরোনাম</label><input type="text" data-f="title" value="${escAttr(data.title)}" placeholder="লেখার শিরোনাম"></div>
      <div class="adm-field-row">
        <div class="adm-field"><label>লেখক</label><input type="text" data-f="author" value="${escAttr(data.author)}" placeholder="লেখকের নাম"></div>
        <div class="adm-field"><label>ধরন</label>
          <select data-f="genre">${genreOptions(data.genre)}</select>
        </div>
      </div>
      <div class="adm-field-row">
        <div class="adm-field"><label>প্রকাশের তারিখ</label><input type="date" data-f="date" value="${data.date||''}"></div>
        <div class="adm-field"><label>অবস্থা</label><select data-f="status"><option${data.status==='draft'?'':' selected'}>প্রকাশিত</option><option${data.status==='draft'?' selected':''}>খসড়া</option></select></div>
      </div>
      <div class="adm-field"><label>মূল লেখা</label><textarea data-f="body" placeholder="এখানে লেখার মূল অংশ লিখুন। অনুচ্ছেদ আলাদা করতে একটি ফাঁকা লাইন দিন।">${escAttr(data.body)}</textarea></div>`,
    magazine: (data) => `
      <div class="adm-field-row">
        <div class="adm-field"><label>সংখ্যার শিরোনাম</label><input type="text" data-f="title" value="${escAttr(data.title)}" placeholder="যেমনঃ বসন্ত ১৪৩২"></div>
        <div class="adm-field"><label>সংখ্যা নম্বর</label><input type="number" min="1" data-f="issue_no" value="${data.issue_no ?? ''}" placeholder="যেমনঃ ৪২"></div>
      </div>
      <div class="adm-field"><label>প্রকাশের তারিখ</label><input type="date" data-f="date" value="${data.date||''}"></div>
      <div class="adm-field"><label>প্রচ্ছদ ছবি</label><label class="adm-upload-box" data-upload-box><i data-lucide="upload-cloud" width="24" height="24"></i><div data-upload-label>প্রচ্ছদ আপলোড করতে ক্লিক করুন</div><input type="file" accept=".jpg,.jpeg,.png" hidden></label></div>
      <div class="adm-field"><label>PDF ফাইল</label><label class="adm-upload-box" data-upload-box><i data-lucide="file-up" width="24" height="24"></i><div data-upload-label>সম্পূর্ণ সংখ্যার PDF আপলোড করুন</div><input type="file" accept=".pdf" hidden></label></div>`,
    events: (data) => `
      <div class="adm-field"><label>অনুষ্ঠানের নাম</label><input type="text" data-f="title" value="${escAttr(data.title)}"></div>
      <div class="adm-field-row">
        <div class="adm-field"><label>তারিখ</label><input type="date" data-f="date" value="${data.date||''}"></div>
        <div class="adm-field"><label>স্থান</label><input type="text" data-f="place" value="${escAttr(data.place)}"></div>
      </div>
      <div class="adm-field-row">
        <div class="adm-field"><label>শুরুর সময়</label><input type="time" data-f="time" value="${data.time||''}"></div>
        <div class="adm-field"><label>শেষের সময় (ঐচ্ছিক)</label><input type="time" data-f="end" value="${data.end||''}"></div>
      </div>
      <div class="adm-field"><label>বিবরণ</label><textarea data-f="desc" placeholder="অনুষ্ঠান সম্পর্কে সংক্ষিপ্ত বিবরণ...">${escAttr(data.desc)}</textarea></div>
      <div class="adm-field"><label>কভার ছবি</label><label class="adm-upload-box" data-upload-box><i data-lucide="upload-cloud" width="24" height="24"></i><div data-upload-label>ছবি আপলোড করতে ক্লিক করুন</div><input type="file" accept=".jpg,.jpeg,.png" hidden></label></div>`,
    gallery: (data = {}) => `
      <div class="adm-field"><label>ছবি (নতুন ছবি দিলে পুরনোটি বদলাবে)</label><label class="adm-upload-box" data-upload-box><i data-lucide="upload-cloud" width="24" height="24"></i><div data-upload-label>ছবি টেনে আনুন অথবা ক্লিক করে বেছে নিন</div><input type="file" accept=".jpg,.jpeg,.png,.webp" hidden></label></div>
      <div class="adm-field"><label>ক্যাপশন</label><input type="text" data-f="caption" value="${escAttr(data.caption)}" placeholder="ছবির সংক্ষিপ্ত বিবরণ"></div>`,
    members: (data) => `
      <div class="adm-field"><label>পূর্ণ নাম</label><input type="text" value="${escAttr(data.name)}" disabled></div>
      <div class="adm-field"><label>ইমেইল</label><input type="email" value="${escAttr(data.email)}" disabled></div>
      <div class="adm-field"><label>ভূমিকা</label>
        <select data-f="role">
          <option value="member"${data.role !== 'editor' && data.role !== 'admin' ? ' selected' : ''}>সদস্য</option>
          <option value="editor"${data.role === 'editor' ? ' selected' : ''}>সম্পাদক</option>
          <option value="admin"${data.role === 'admin' ? ' selected' : ''}>এডমিন</option>
        </select></div>`,
    homepage: (data) => `
      <div class="adm-field"><label>ক্রম নম্বর</label><input type="number" min="0" data-f="num" value="${data.num ?? ''}" placeholder="১"></div>
      <div class="adm-field"><label>শিরোনাম</label><input type="text" data-f="title" value="${escAttr(data.title)}"></div>
      <div class="adm-field"><label>বিবরণ</label><textarea data-f="desc">${escAttr(data.desc)}</textarea></div>`,
    genres: (data) => `
      <div class="adm-field"><label>ধরনের নাম</label><input type="text" data-f="name" maxlength="24" value="${escAttr(data.name)}" placeholder="যেমন: ভ্রমণকাহিনি"></div>
      ${data.name ? '<p style="font-size:.82rem; color:var(--ink-soft); margin-top:8px; line-height:1.55;">নাম বদলালে এই ধরনের সব লেখা ও প্রাপ্ত লেখাও নতুন নামে চলে যাবে।</p>' : ''}`,
    default: () => `<div class="adm-field"><label>শিরোনাম</label><input type="text" placeholder="তথ্য লিখুন"></div>`
  };

  function currentView(){
    return document.querySelector('.adm-nav-item.adm-active')?.dataset.view || 'dashboard';
  }

  // ---------- Event time helpers ----------
  const BN_DIGITS = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
  const toBnNum = v => String(v).replace(/\d/g, d => BN_DIGITS[d]);
  const BN_MONTHS = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
  // '17:30' -> 'বিকাল ৫:৩০'
  function fmtBnTime(t){
    if (!t || !/^\d{1,2}:\d{2}$/.test(t)) return '';
    const [h, m] = t.split(':').map(Number);
    const period = h < 4 ? 'রাত' : h < 6 ? 'ভোর' : h < 12 ? 'সকাল' : h < 15 ? 'দুপুর' : h < 18 ? 'বিকাল' : h < 20 ? 'সন্ধ্যা' : 'রাত';
    return period + ' ' + toBnNum(h % 12 || 12) + ':' + toBnNum(String(m).padStart(2,'0'));
  }
  // '2026-07-15' -> '১৫ জুলাই, ২০২৬'
  function fmtBnDate(iso){
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? toBnNum(Number(m[3])) + ' ' + BN_MONTHS[Number(m[2]) - 1] + ', ' + toBnNum(m[1]) : '';
  }
  const escAttr = v => String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  let editingRow = null;
  // ধরনের তালিকা এখন কেন্দ্রীয় GenreStore থেকে আসে (এডমিনের "ধরন" পেজে নিয়ন্ত্রিত)
  const genreOptions = cur => {
    cur = window.GenreStore.canon(cur || '');
    const all = window.GenreStore.names();
    return (cur && !all.includes(cur) ? all.concat(cur) : all)
      .map(g => '<option' + (g === cur ? ' selected' : '') + '>' + escAttr(g) + '</option>').join('');
  };

  function openEditModal(mode, rowData){
    const view = currentView();
    const label = (viewTitles[view] || ['তথ্য'])[0];
    editModalTitle.textContent = mode === 'edit' ? (label + ' সম্পাদনা করুন') : ('নতুন ' + label + ' যোগ করুন');
    const tpl = formTemplates[view] || formTemplates.default;
    editModalBody.innerHTML = tpl(rowData || {});
    renderIcons();
    wireUploadBoxes(editModalBody);
    editModal.classList.add('adm-open');
    document.documentElement.classList.add('has-modal');
    editModal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }
  function closeAllModals(){
    document.querySelectorAll('.adm-modal-backdrop.adm-open').forEach(m => {
      m.classList.remove('adm-open'); m.setAttribute('aria-hidden','true');
    });
    document.body.style.overflow = '';
    document.documentElement.classList.remove('has-modal');
  }
  document.querySelectorAll('[data-close-modal]').forEach(btn => btn.addEventListener('click', closeAllModals));
  document.querySelectorAll('.adm-modal-backdrop').forEach(bd => bd.addEventListener('click', e => { if (e.target === bd) closeAllModals(); }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAllModals(); });

  topAddBtn.addEventListener('click', () => { editingRow = null; openEditModal('add'); });

  // ---------- Supabase data layer: লেখা (articles) ও অনুষ্ঠান (events) ----------
  const admRows = { articles: new Map(), events: new Map(), magazine: new Map(), gallery: new Map(), values: new Map(), members: new Map(), submissions: new Map(), authorOrig: new Map() };
  const dbOk = () => !!window.sb;
  // ভিউ -> টেবিল ও লোড ফাংশন (ডিলিট ও রিফ্রেশে ব্যবহৃত)
  const admTables = {
    writings:  { table: 'articles',       load: () => loadWritings() },
    events:    { table: 'events',         load: () => loadEvents() },
    magazine:  { table: 'magazine_issues', load: () => loadMagazine() },
    gallery:   { table: 'gallery_items',  load: () => loadGallery() },
    genres:    { table: 'genres',         load: () => loadGenresAdmin() }
  };
  const formField = k => (editModalBody.querySelector('[data-f="' + k + '"]')?.value || '').trim();
  const DHAKA_OFFSET = '+06:00';

  // Supabase থেকে আসা ISO সময়কে ঢাকার তারিখ/সময়ে নেওয়া
  function dhakaDate(iso){ return iso ? new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }) : ''; }
  function dhakaTime(iso){
    if (!iso) return '';
    const t = new Date(iso).toLocaleTimeString('en-GB', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', hour12: false });
    return t === '00:00' ? '' : t;
  }

  function writingRowHtml(r){
    const published = r.status === 'published';
    return '<tr data-row data-id="' + escAttr(r.id) + '">' +
      '<td class="adm-cell-title">' + escAttr(r.title) + '</td>' +
      '<td>' + escAttr(r.author_name || '') + '</td>' +
      '<td><span class="adm-tag-pill">' + escAttr(r.genre || '') + '</span></td>' +
      '<td>' + escAttr(r.published_at ? fmtBnDate(r.published_at) : '—') + '</td>' +
      '<td><span class="adm-status-dot' + (published ? '' : ' adm-off') + '">' + (published ? 'প্রকাশিত' : 'খসড়া') + '</span></td>' +
      '<td class="adm-row-actions">' +
        '<button class="adm-btn-icon" data-action="edit" title="সম্পাদনা"><i data-lucide="pencil" width="16" height="16"></i></button>' +
        '<button class="adm-btn-icon adm-danger" data-action="delete" title="মুছুন"><i data-lucide="trash-2" width="16" height="16"></i></button>' +
      '</td></tr>';
  }

  function eventRowHtml(r){
    const d = dhakaDate(r.starts_at), t = dhakaTime(r.starts_at);
    const upcoming = r.starts_at && new Date(r.starts_at) >= new Date();
    return '<tr data-row data-id="' + escAttr(r.id) + '">' +
      '<td class="adm-cell-title">' + escAttr(r.title) + '</td>' +
      '<td>' + escAttr(fmtBnDate(d)) + '</td>' +
      '<td>' + escAttr(fmtBnTime(t) || 'নির্ধারিত নয়') + (r.ends_at ? ' থেকে ' + escAttr(fmtBnTime(dhakaTime(r.ends_at))) : '') + '</td>' +
      '<td>' + escAttr(r.location || 'নির্ধারিত নয়') + '</td>' +
      '<td><span class="adm-status-dot' + (upcoming ? ' adm-pending' : ' adm-off') + '">' + (upcoming ? 'আসন্ন' : 'সম্পন্ন') + '</span></td>' +
      '<td class="adm-row-actions">' +
        '<button class="adm-btn-icon" data-action="edit" title="সম্পাদনা"><i data-lucide="pencil" width="16" height="16"></i></button>' +
        '<button class="adm-btn-icon adm-danger" data-action="delete" title="মুছুন"><i data-lucide="trash-2" width="16" height="16"></i></button>' +
      '</td></tr>';
  }

  function admEmptyRow(cols, text){
    return '<tr><td colspan="' + cols + '" style="text-align:center; padding:24px; color:var(--ink-soft);">' + text + '</td></tr>';
  }

  async function loadWritings(){
    if (!dbOk()) return;
    const tbody = document.querySelector('#admWritingsTable tbody');
    const { data, error } = await window.sb.from('articles')
      .select('id,title,author_name,author_sub,author_bio,genre,body,published_at,status')
      .order('published_at', { ascending: false, nullsFirst: false });
    if (error){ showToast('লেখা লোড করা যায়নি: ' + error.message); return; }
    admRows.articles.clear();
    data.forEach(r => admRows.articles.set(r.id, r));
    renderWritings();
  }
  function renderWritings(){
    const tbody = document.querySelector('#admWritingsTable tbody');
    const f = document.getElementById('admWritingsFilter').value;
    const list = [...admRows.articles.values()].filter(r => !f || window.GenreStore.canon(r.genre) === f);
    tbody.innerHTML = list.length ? list.map(writingRowHtml).join('') : admEmptyRow(6, f ? 'এই ধরনের কোনো লেখা নেই।' : 'এখনো কোনো লেখা নেই।');
    labelTableCells(document.querySelector('[data-view-panel="writings"]'));
    renderIcons();
  }
  function fillWritingsFilter(){
    const sel = document.getElementById('admWritingsFilter');
    const cur = sel.value;
    sel.innerHTML = '<option value="">সব ধরন</option>' + window.GenreStore.names().map(g => '<option>' + escAttr(g) + '</option>').join('');
    sel.value = window.GenreStore.has(cur) ? cur : '';
  }
  (function(){ const sel = document.getElementById('admWritingsFilter');
    fillWritingsFilter();
    window.GenreStore.onChange(() => { fillWritingsFilter(); if (typeof renderWritings === 'function' && admRows.articles.size) renderWritings(); });
    sel.addEventListener('change', renderWritings); })();

  async function loadEvents(){
    if (!dbOk()) return;
    const tbody = document.querySelector('[data-view-panel="events"] tbody');
    const { data, error } = await window.sb.from('events')
      .select('id,title,description,starts_at,ends_at,location,published')
      .order('starts_at', { ascending: false, nullsFirst: false });
    if (error){ showToast('অনুষ্ঠান লোড করা যায়নি: ' + error.message); return; }
    admRows.events.clear();
    data.forEach(r => admRows.events.set(r.id, r));
    tbody.innerHTML = data.length ? data.map(eventRowHtml).join('') : admEmptyRow(6, 'এখনো কোনো অনুষ্ঠান নেই।');
    labelTableCells(document.querySelector('[data-view-panel="events"]'));
    renderIcons();
  }

  async function saveWriting(){
    const title = formField('title');
    if (!title){ showToast('লেখার শিরোনাম দিন'); return; }
    const paragraphs = formField('body').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    const published = formField('status') !== 'খসড়া';
    const date = formField('date');
    const payload = {
      title,
      genre: formField('genre'),
      author_name: formField('author'),
      body: paragraphs,
      status: published ? 'published' : 'draft',
      published_at: date || (published ? new Date().toISOString().slice(0, 10) : null)
    };
    const cols = 'id,title,author_name,author_sub,author_bio,genre,body,published_at,status';
    const editId = editingRow ? editingRow.dataset.id : null;
    modalSaveBtn.disabled = true;
    const res = editId
      ? await window.sb.from('articles').update(payload).eq('id', editId).select(cols).single()
      : await window.sb.from('articles').insert({ ...payload, slug: 'lekha-' + Date.now().toString(36) }).select(cols).single();
    modalSaveBtn.disabled = false;
    if (res.error){ showToast('সংরক্ষণ ব্যর্থ: ' + res.error.message); return; }
    editingRow = null;
    closeAllModals();
    showToast('লেখা সংরক্ষণ করা হয়েছে');
    await loadWritings();
  }

  async function saveEvent(){
    const title = formField('title'), date = formField('date'), place = formField('place');
    const time = formField('time'), end = formField('end'), desc = formField('desc');
    if (!title || !date){ showToast('অনুষ্ঠানের নাম ও তারিখ দিন'); return; }
    if (time && end && end <= time){ showToast('শেষের সময় শুরুর সময়ের পরে হতে হবে'); return; }
    const payload = {
      title,
      starts_at: date + 'T' + (time || '00:00') + ':00' + DHAKA_OFFSET,
      ends_at: end ? date + 'T' + end + ':00' + DHAKA_OFFSET : null,
      location: place || null,
      description: desc || null,
      published: true
    };
    const cols = 'id,title,description,starts_at,location,published';
    const editId = editingRow ? editingRow.dataset.id : null;
    modalSaveBtn.disabled = true;
    const res = editId
      ? await window.sb.from('events').update(payload).eq('id', editId).select(cols).single()
      : await window.sb.from('events').insert(payload).select(cols).single();
    modalSaveBtn.disabled = false;
    if (res.error){ showToast('সংরক্ষণ ব্যর্থ: ' + res.error.message); return; }
    editingRow = null;
    closeAllModals();
    showToast('অনুষ্ঠান সংরক্ষণ করা হয়েছে');
    await loadEvents();
  }

  // ---------- ধরন (genres): যোগ, এডিট, ডিলেট ----------
  admRows.genres = new Map();
  const gClean = v => String(v == null ? '' : v).replace(/\s+/g, ' ').trim();

  function genreRowHtml(r, idx, count, editable){
    return '<tr data-row data-id="' + escAttr(r.id || '') + '">' +
      '<td>' + escAttr(toBnNum(String(idx + 1).padStart(2, '0'))) + '</td>' +
      '<td class="adm-cell-title">' + escAttr(r.name) + '</td>' +
      '<td>' + escAttr(toBnNum(count || 0)) + 'টি</td>' +
      '<td class="adm-row-actions">' + (editable
        ? '<button class="adm-btn-icon" data-action="edit" title="সম্পাদনা"><i data-lucide="pencil" width="16" height="16"></i></button>' +
          '<button class="adm-btn-icon adm-danger" data-action="delete" title="মুছুন"><i data-lucide="trash-2" width="16" height="16"></i></button>'
        : '') + '</td></tr>';
  }

  async function loadGenresAdmin(){
    const tbody = document.querySelector('#admGenresTable tbody');
    const note = document.getElementById('admGenresNote');
    if (!dbOk()){ tbody.innerHTML = admEmptyRow(4, 'ডেটাবেস সংযুক্ত নেই'); return; }
    const [g, a] = await Promise.all([
      window.sb.from('genres').select('id,name,sort_order').order('sort_order').order('name'),
      window.sb.from('articles').select('genre')
    ]);
    const counts = {};
    (a.data || []).forEach(r => { const k = window.GenreStore.canon(r.genre || ''); if (k) counts[k] = (counts[k] || 0) + 1; });
    admRows.genres.clear();
    note.style.display = 'none'; note.innerHTML = '';
    let list, editable = false;
    if (g.error){
      note.style.display = 'block';
      note.innerHTML = 'ধরনের টেবিল (<b>genres</b>) এখনো তৈরি হয়নি। Supabase → SQL Editor-এ <b>genres.sql</b> ফাইলটি একবার চালান, তারপর পেজ রিফ্রেশ করুন। ততক্ষণ নিচের ডিফল্ট তালিকা ব্যবহার হচ্ছে।';
      list = window.GENRE_DEFAULTS.map((n, i) => ({ id: '', name: n, sort_order: i + 1 }));
    } else if (!g.data.length){
      note.style.display = 'block';
      note.innerHTML = 'ধরনের তালিকা এখনো ডেটাবেসে সংরক্ষিত নয় (নিচের ডিফল্ট ধরনগুলো চলছে)। এডিট বা নতুন যোগ করতে আগে সেগুলো সংরক্ষণ করুন। ' +
        '<button class="adm-btn adm-btn-primary adm-btn-sm" id="admSeedGenres" style="margin-top:8px;">ডিফল্ট ধরনগুলো সংরক্ষণ করুন</button>';
      list = window.GENRE_DEFAULTS.map((n, i) => ({ id: '', name: n, sort_order: i + 1 }));
    } else {
      editable = true;
      g.data.forEach(r => admRows.genres.set(r.id, r));
      list = g.data;
      const missing = Object.keys(counts).filter(k => !list.some(r => r.name === k));
      if (missing.length){
        note.style.display = 'block';
        note.textContent = 'এই ধরনগুলো লেখায় আছে কিন্তু তালিকায় নেই: ' + missing.map(k => k + ' (' + toBnNum(counts[k]) + ')').join(', ') + '। সব জায়গায় একই ধরন রাখতে এগুলো তালিকায় যোগ করুন।';
      }
    }
    tbody.innerHTML = list.map((r, i) => genreRowHtml(r, i, counts[r.name], editable)).join('');
    labelTableCells(document.querySelector('[data-view-panel="genres"]'));
    renderIcons();
    await window.GenreStore.load();
  }

  async function seedDefaultGenres(){
    const rows = window.GENRE_DEFAULTS.map((n, i) => ({ name: n, sort_order: i + 1 }));
    const { error } = await window.sb.from('genres').insert(rows);
    return error;
  }
  document.addEventListener('click', async e => {
    if (!e.target.closest('#admSeedGenres')) return;
    if (!dbOk()) return;
    const err = await seedDefaultGenres();
    if (err){ showToast('সংরক্ষণ ব্যর্থ: ' + err.message); return; }
    showToast('ডিফল্ট ধরনগুলো সংরক্ষণ করা হয়েছে');
    await loadGenresAdmin();
  });

  async function saveGenreAdm(){
    const name = gClean(formField('name'));
    if (!name){ showToast('ধরনের নাম দিন'); return; }
    if (name.length > 24){ showToast('নাম সর্বোচ্চ ২৪ অক্ষরের হতে পারে'); return; }
    const editId = editingRow ? editingRow.dataset.id : null;
    const dup = [...admRows.genres.values()].some(g => g.name.toLowerCase() === name.toLowerCase() && g.id !== editId);
    if (dup){ showToast('এই ধরন আগে থেকেই আছে'); return; }
    modalSaveBtn.disabled = true;
    let error = null, partial = false;
    if (editId){
      const oldName = (admRows.genres.get(editId) || {}).name;
      const res = await window.sb.from('genres').update({ name }).eq('id', editId);
      error = res.error;
      if (!error && oldName && oldName !== name){
        const oldNames = oldName === 'ছোটগল্প' ? ['ছোটগল্প', 'গল্প'] : [oldName];
        const a = await window.sb.from('articles').update({ genre: name }).in('genre', oldNames);
        const sb2 = await window.sb.from('submissions').update({ genre: name }).in('genre', oldNames);
        partial = !!(a.error || sb2.error);
      }
    } else {
      if (admRows.genres.size === 0){ const se = await seedDefaultGenres(); if (se){ modalSaveBtn.disabled = false; showToast('সংরক্ষণ ব্যর্থ: ' + se.message); return; } }
      const max = Math.max(0, ...[...admRows.genres.values()].map(g => g.sort_order || 0), admRows.genres.size === 0 ? window.GENRE_DEFAULTS.length : 0);
      const res = await window.sb.from('genres').insert({ name, sort_order: max + 1 });
      error = res.error;
    }
    modalSaveBtn.disabled = false;
    if (error){ showToast('সংরক্ষণ ব্যর্থ: ' + error.message); return; }
    editingRow = null;
    closeAllModals();
    showToast(partial ? 'ধরন সংরক্ষিত, তবে কিছু লেখার ধরন হালনাগাদ হয়নি' : 'ধরন সংরক্ষণ করা হয়েছে');
    await loadGenresAdmin();
  }

  // লেখা অনুমোদনের আগে: লেখকের নতুন ধরন মূল তালিকায় না থাকলে যোগ করা
  window.admEnsureGenre = async function(raw){
    const name = window.GenreStore.canon(gClean(raw));
    if (!name || !dbOk() || window.GenreStore.has(name)) return;
    const cur = await window.sb.from('genres').select('id,sort_order');
    if (cur.error) return;
    let max = Math.max(0, ...(cur.data || []).map(g => g.sort_order || 0));
    if (!cur.data.length){ const se = await seedDefaultGenres(); if (se) return; max = window.GENRE_DEFAULTS.length; }
    await window.sb.from('genres').insert({ name: name.slice(0, 24), sort_order: max + 1 });
    await window.GenreStore.load();
  };

  modalSaveBtn.addEventListener('click', () => {
    if (!dbOk()){ showToast('ডেটাবেস সংযুক্ত নেই। Supabase সেটিংস চেক করুন'); return; }
    const v = currentView();
    if (v === 'writings') { saveWriting(); return; }
    if (v === 'genres') { saveGenreAdm(); return; }
    if (v === 'events') { saveEvent(); return; }
    if (v === 'magazine') { saveMagazine(); return; }
    if (v === 'gallery') { saveGallery(); return; }
    if (v === 'homepage') { saveValue(); return; }
    if (v === 'members') { saveMemberRole(); return; }
    closeAllModals();
  });

  // ---------- Row edit / delete (event delegation, works for dynamically-added rows too) ----------
  const confirmModal = document.getElementById('admConfirmModal');
  const confirmDeleteBtn = document.getElementById('admConfirmDeleteBtn');
  let rowPendingDelete = null;

  document.addEventListener('click', e => {
    const editBtn = e.target.closest('[data-action="edit"]');
    if (editBtn){
      const row = editBtn.closest('[data-row]');
      const view = currentView();
      // database-এর সারি: পূর্ণ ডেটা নিয়ে ফর্ম খোলে
      if (row && row.dataset.id && view === 'members'){
        editingRow = row;
        const r = admRows.members.get(row.dataset.id);
        if (r) openEditModal('edit', { name: r.name, email: r.email, role: r.role });
        return;
      }
      if (row && row.dataset.id && view === 'homepage'){
        editingRow = row;
        const r = admRows.values.get(String(row.dataset.id));
        if (r) openEditModal('edit', { num: r.sort_order, title: r.title, desc: r.description || '' });
        else showToast('মূল্যবোধটি খুঁজে পাওয়া যায়নি, পেজ রিফ্রেশ করে আবার চেষ্টা করুন');
        return;
      }
      if (row && row.dataset.id && admTables[view]){
        editingRow = row;
        const id = row.dataset.id;
        if (view === 'writings'){
          const r = admRows.articles.get(id);
          if (r) openEditModal('edit', {
            title: r.title, author: r.author_name, genre: r.genre,
            date: r.published_at || '', status: r.status,
            body: (r.body || []).join('\n\n')
          });
        } else if (view === 'events'){
          const r = admRows.events.get(id);
          if (r) openEditModal('edit', {
            title: r.title, date: dhakaDate(r.starts_at), time: dhakaTime(r.starts_at),
            end: dhakaTime(r.ends_at), place: r.location || '', desc: r.description || ''
          });
        } else if (view === 'magazine'){
          const r = admRows.magazine.get(id);
          if (r) openEditModal('edit', { title: r.title, issue_no: r.issue_no, date: r.published_on || '' });
        } else if (view === 'gallery'){
          const r = admRows.gallery.get(id);
          if (r) openEditModal('edit', { caption: r.caption || '' });
        } else if (view === 'genres'){
          const r = admRows.genres.get(id);
          if (r) openEditModal('edit', { name: r.name });
        }
        return;
      }
      const cells = row ? row.querySelectorAll('td') : [];
      let data = { title: cells[0]?.textContent.trim(), author: cells[1]?.textContent.trim() };
      editingRow = null;
      if (currentView() === 'events' && row){
        editingRow = row;
        data = {
          title: cells[0]?.textContent.trim(),
          date: row.dataset.date || '',
          time: row.dataset.time || '',
          end: row.dataset.end || '',
          place: cells[3]?.textContent.trim().replace('নির্ধারিত নয়', ''),
          desc: row.dataset.desc || ''
        };
      }
      openEditModal('edit', data);
      return;
    }
    const delBtn = e.target.closest('[data-action="delete"]');
    if (delBtn){
      rowPendingDelete = delBtn.closest('[data-row]');
      confirmModal.classList.add('adm-open');
      confirmModal.setAttribute('aria-hidden','false');
      document.body.style.overflow = 'hidden';
    }
  });

  confirmDeleteBtn.addEventListener('click', async () => {
    const view = currentView();
    if (rowPendingDelete && rowPendingDelete.dataset.id && view === 'genres'){
      const g = admRows.genres.get(rowPendingDelete.dataset.id);
      rowPendingDelete = null;
      if (!dbOk() || !g){ closeAllModals(); return; }
      const names = g.name === 'ছোটগল্প' ? ['ছোটগল্প', 'গল্প'] : [g.name];
      const used = await window.sb.from('articles').select('id', { count: 'exact', head: true }).in('genre', names);
      closeAllModals();
      if (!used.error && (used.count || 0) > 0){
        showToast('“' + g.name + '” ধরনে ' + toBnNum(used.count) + 'টি লেখা আছে — আগে সেগুলোর ধরন বদলান');
        return;
      }
      const { error } = await window.sb.from('genres').delete().eq('id', g.id);
      if (error){ showToast('মুছতে ব্যর্থ: ' + error.message); return; }
      showToast('ধরন মুছে ফেলা হয়েছে');
      await loadGenresAdmin();
      return;
    }
    if (rowPendingDelete && rowPendingDelete.dataset.id && view === 'members'){
      if (rowPendingDelete.dataset.id === window.admMeId){ closeAllModals(); showToast('নিজের অ্যাকাউন্ট মুছে ফেলা যাবে না'); return; }
      if (!dbOk()){ showToast('ডেটাবেস সংযুক্ত নেই'); return; }
      const { error } = await window.sb.rpc('admin_delete_user', { uid: rowPendingDelete.dataset.id });
      rowPendingDelete = null;
      closeAllModals();
      if (error){ showToast('মুছতে ব্যর্থ: ' + error.message); return; }
      showToast('সদস্য মুছে ফেলা হয়েছে');
      await loadMembers();
      return;
    }
    if (rowPendingDelete && rowPendingDelete.dataset.id && admTables[view]){
      if (!dbOk()){ showToast('ডেটাবেস সংযুক্ত নেই'); return; }
      const cfg = admTables[view];
      const delId = rowPendingDelete.dataset.id;
      const old = view === 'magazine' ? admRows.magazine.get(delId) : view === 'gallery' ? admRows.gallery.get(delId) : null;
      const { error } = await window.sb.from(cfg.table).delete().eq('id', delId);
      rowPendingDelete = null;
      closeAllModals();
      if (error){ showToast('মুছতে ব্যর্থ: ' + error.message); return; }
      // ডেটাবেসের সারি মোছার পর ফাইলও Storage থেকে মুছে ফেলা
      if (old){
        const files = view === 'magazine'
          ? [['covers', old.cover_path], ['magazine-pdfs', old.pdf_path]]
          : [['gallery', old.image_path]];
        for (const [bucket, path] of files){
          if (path) await window.sb.storage.from(bucket).remove([path]);
        }
      }
      showToast('মুছে ফেলা হয়েছে');
      await cfg.load();
      return;
    }
    if (rowPendingDelete){
      rowPendingDelete.style.transition = 'opacity .2s ease';
      rowPendingDelete.style.opacity = '0';
      setTimeout(() => rowPendingDelete && rowPendingDelete.remove(), 200);
    }
    closeAllModals();
    showToast('আইটেমটি মুছে ফেলা হয়েছে');
  });

  // ---------- Gallery admin grid (thumb cards with edit/delete) ----------
  // ---------- ম্যাগাজিন ও গ্যালারি: Supabase ----------
  const storageUrl = (bucket, path) => path ? window.sb.storage.from(bucket).getPublicUrl(path).data.publicUrl : '';
  const cssUrlSafe = u => String(u).replace(/['"()\s\\]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0'));
  const admActions = '<div class="adm-row-actions">' +
    '<button class="adm-btn-icon" data-action="edit" title="সম্পাদনা"><i data-lucide="pencil" width="16" height="16"></i></button>' +
    '<button class="adm-btn-icon adm-danger" data-action="delete" title="মুছুন"><i data-lucide="trash-2" width="16" height="16"></i></button></div>';

  // ফর্মের n-তম ফাইল ইনপুট থেকে ফাইল (না থাকলে null)
  function admFileAt(n){
    const inputs = editModalBody.querySelectorAll('[data-upload-box] input[type=file]');
    const f = inputs[n] && inputs[n].files && inputs[n].files[0];
    return f || null;
  }
  // ফাইল Storage বাকেটে তোলে এবং বাকেটের ভেতরের path ফেরত দেয়
  async function admUpload(bucket, file){
    const ext = ((file.name.match(/\.([A-Za-z0-9]+)$/) || [])[1] || 'bin').toLowerCase();
    const path = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
    const { error } = await window.sb.storage.from(bucket).upload(path, file, { contentType: file.type || undefined, upsert: false });
    if (error) throw new Error(error.message);
    return path;
  }

  function magazineRowHtml(r){
    const cover = storageUrl('covers', r.cover_path);
    const thumb = '<div class="adm-thumb" style="' + (cover ? "background:url('" + cssUrlSafe(cover) + "') center/cover no-repeat;" : '') + '"></div>';
    return '<tr data-row data-id="' + escAttr(r.id) + '">' +
      '<td><div class="adm-row-flex">' + thumb + '</div></td>' +
      '<td class="adm-cell-title">' + (r.issue_no != null ? 'সংখ্যা ' + toBnNum(r.issue_no) + ': ' : '') + escAttr(r.title) + '</td>' +
      '<td>' + escAttr(r.published_on ? fmtBnDate(r.published_on) : '—') + '</td>' +
      '<td><span class="adm-status-dot">প্রকাশিত</span></td>' +
      '<td class="adm-row-actions">' +
        '<button class="adm-btn-icon" data-action="edit" title="সম্পাদনা"><i data-lucide="pencil" width="16" height="16"></i></button>' +
        '<button class="adm-btn-icon adm-danger" data-action="delete" title="মুছুন"><i data-lucide="trash-2" width="16" height="16"></i></button>' +
      '</td></tr>';
  }

  async function loadMagazine(){
    if (!dbOk()) return;
    const tbody = document.querySelector('[data-view-panel="magazine"] tbody');
    const { data, error } = await window.sb.from('magazine_issues')
      .select('id,issue_no,title,cover_path,pdf_path,published_on,published')
      .order('published_on', { ascending: false, nullsFirst: false });
    if (error){ showToast('ম্যাগাজিন লোড করা যায়নি: ' + error.message); return; }
    admRows.magazine.clear();
    data.forEach(r => admRows.magazine.set(r.id, r));
    tbody.innerHTML = data.length ? data.map(magazineRowHtml).join('') : admEmptyRow(5, 'এখনো কোনো সংখ্যা নেই।');
    labelTableCells(document.querySelector('[data-view-panel="magazine"]'));
    renderIcons();
  }

  async function saveMagazine(){
    const title = formField('title');
    if (!title){ showToast('সংখ্যার শিরোনাম দিন'); return; }
    const issueNo = parseInt(formField('issue_no'), 10);
    const payload = {
      title,
      issue_no: Number.isFinite(issueNo) ? issueNo : null,
      published_on: formField('date') || null,
      published: true
    };
    const coverFile = admFileAt(0), pdfFile = admFileAt(1);
    const editId = editingRow ? editingRow.dataset.id : null;
    const oldIssue = editId ? admRows.magazine.get(editId) : null;
    modalSaveBtn.disabled = true;
    try {
      if (coverFile) payload.cover_path = await admUpload('covers', coverFile);
      if (pdfFile) payload.pdf_path = await admUpload('magazine-pdfs', pdfFile);
      const res = editId
        ? await window.sb.from('magazine_issues').update(payload).eq('id', editId)
        : await window.sb.from('magazine_issues').insert(payload);
      if (res.error) throw new Error(res.error.message);
    } catch (err) {
      modalSaveBtn.disabled = false;
      showToast('সংরক্ষণ ব্যর্থ: ' + err.message);
      return;
    }
    modalSaveBtn.disabled = false;
    // নতুন ফাইল দিয়ে বদলালে পুরনোটি Storage থেকে মুছে ফেলা
    if (oldIssue){
      if (payload.cover_path && oldIssue.cover_path) await window.sb.storage.from('covers').remove([oldIssue.cover_path]);
      if (payload.pdf_path && oldIssue.pdf_path) await window.sb.storage.from('magazine-pdfs').remove([oldIssue.pdf_path]);
    }
    editingRow = null;
    closeAllModals();
    showToast('ম্যাগাজিন সংরক্ষণ করা হয়েছে');
    await loadMagazine();
  }

  function galleryCardHtml(r){
    const url = storageUrl('gallery', r.image_path);
    return '<div data-row data-id="' + escAttr(r.id) + '" style="background:var(--paper); border:1px solid var(--line); border-radius:8px; overflow:hidden;">' +
      '<div style="aspect-ratio:4/3; background:url(\'' + cssUrlSafe(url) + '\') center/cover no-repeat;"></div>' +
      '<div style="padding:10px 12px; display:flex; align-items:center; justify-content:space-between; gap:8px;">' +
      '<span style="font-size:0.82rem; color:var(--ink-soft); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' + escAttr(r.caption || 'ক্যাপশন নেই') + '</span>' +
      admActions + '</div></div>';
  }

  async function loadGallery(){
    if (!dbOk()) return;
    const grid = document.getElementById('admGalleryAdminGrid');
    const { data, error } = await window.sb.from('gallery_items')
      .select('id,caption,image_path,published,sort_order,created_at')
      .order('sort_order').order('created_at', { ascending: false });
    if (error){ showToast('গ্যালারি লোড করা যায়নি: ' + error.message); return; }
    admRows.gallery.clear();
    data.forEach(r => admRows.gallery.set(r.id, r));
    grid.innerHTML = data.length ? data.map(galleryCardHtml).join('') : '<div style="grid-column:1/-1; text-align:center; padding:24px; color:var(--ink-soft);">এখনো কোনো ছবি নেই।</div>';
    renderIcons();
  }

  async function saveGallery(){
    const caption = formField('caption');
    const file = admFileAt(0);
    const editId = editingRow ? editingRow.dataset.id : null;
    const oldPhoto = editId ? admRows.gallery.get(editId) : null;
    if (!editId && !file){ showToast('একটি ছবি নির্বাচন করুন'); return; }
    modalSaveBtn.disabled = true;
    const payload = { caption: caption || null, published: true };
    try {
      if (file) payload.image_path = await admUpload('gallery', file);
      const res = editId
        ? await window.sb.from('gallery_items').update(payload).eq('id', editId)
        : await window.sb.from('gallery_items').insert(payload);
      if (res.error) throw new Error(res.error.message);
    } catch (err) {
      modalSaveBtn.disabled = false;
      showToast('সংরক্ষণ ব্যর্থ: ' + err.message);
      return;
    }
    modalSaveBtn.disabled = false;
    if (oldPhoto && payload.image_path && oldPhoto.image_path){
      await window.sb.storage.from('gallery').remove([oldPhoto.image_path]);
    }
    editingRow = null;
    closeAllModals();
    showToast('ছবি সংরক্ষণ করা হয়েছে');
    await loadGallery();
  }
  // ---------- লগইন করা এডমিনের নাম (সাইডবারে) ----------
  async function loadAdminMe(){
    if (!dbOk()) return;
    const { data: u } = await window.sb.auth.getUser();
    if (!u || !u.user) return;
    window.admMeId = u.user.id;
    const { data } = await window.sb.from('profiles').select('name,role').eq('id', u.user.id).maybeSingle();
    const name = (data && data.name) || u.user.email || 'এডমিন';
    const foot = document.querySelector('.adm-sidebar-foot');
    if (!foot) return;
    const b = foot.querySelector('b'); if (b) b.textContent = name;
    const av = foot.querySelector('.adm-avatar'); if (av) av.textContent = name.charAt(0);
    const role = foot.querySelector('span'); if (role) role.textContent = data && data.role === 'admin' ? 'সুপার এডমিন' : 'এডমিন';
  }

  // ---------- ড্যাশবোর্ড ও সাইডবারের সংখ্যা (admin_counts ফাংশন) ----------
  async function loadDashboardCounts(){
    if (!dbOk()) return;
    const { data, error } = await window.sb.rpc('admin_counts');
    if (error || !data) return;   // এডমিন না হলে নীরবে বাদ, নকল সংখ্যাও থাকবে না
    const cards = document.querySelectorAll('.adm-stat-card b');
    if (cards.length >= 4){
      cards[0].textContent = toBnNum(data.articles);
      cards[1].textContent = toBnNum(data.members);
      cards[2].textContent = toBnNum(data.issues);
      cards[3].textContent = toBnNum(data.pending_submissions);
    }
    const setNav = (view, n) => {
      const el = document.querySelector('.adm-nav-item[data-view="' + view + '"] .adm-count');
      if (el) el.textContent = toBnNum(n);
      const tb = document.querySelector('.adm-tab[data-view="' + view + '"] .adm-badge'); if (tb) tb.textContent = n > 0 ? toBnNum(n) : '';
    };
    setNav('writings', data.articles);
    setNav('magazine', data.issues);
    setNav('members', data.members);
    setNav('submissions', data.pending_submissions);
    const [ev, ga] = await Promise.all([
      window.sb.from('events').select('id', { count: 'exact', head: true }),
      window.sb.from('gallery_items').select('id', { count: 'exact', head: true })
    ]);
    if (!ev.error) setNav('events', ev.count || 0);
    if (!ga.error) setNav('gallery', ga.count || 0);
  }

  // ---------- সদস্য ও প্রাপ্ত লেখা (Supabase, পড়া ও অনুমোদন) ----------
  async function loadMembers(){
    if (!dbOk()) return;
    const tbody = document.querySelector('[data-view-panel="members"] tbody');
    const [p, em] = await Promise.all([
      window.sb.from('profiles').select('id,name,faculty,batch,role').order('name'),
      window.sb.rpc('admin_member_emails')
    ]);
    if (p.error){ tbody.innerHTML = admEmptyRow(6, 'সদস্য তালিকা লোড করা যায়নি: ' + escAttr(p.error.message)); return; }
    const emails = {};
    if (!em.error) (em.data || []).forEach(x => { emails[x.id] = x.email; });
    admRows.members.clear();
    p.data.forEach(r => admRows.members.set(r.id, Object.assign({}, r, { email: emails[r.id] || '' })));
    tbody.innerHTML = p.data.length ? p.data.map(r => {
      const label = r.role === 'admin' ? 'এডমিন' : (r.role === 'editor' ? 'সম্পাদক' : 'সদস্য');
      return '<tr data-row data-id="' + escAttr(r.id) + '">' +
        '<td class="adm-cell-title">' + escAttr(r.name || '—') + '</td>' +
        '<td>' + escAttr(emails[r.id] || '—') + '</td>' +
        '<td>' + escAttr(r.faculty || '—') + '</td>' +
        '<td>' + escAttr(r.batch || '—') + '</td>' +
        '<td><span class="adm-tag-pill' + (r.role === 'admin' ? ' adm-maroon' : '') + '">' + label + '</span></td>' +
        '<td class="adm-row-actions">' +
          '<button class="adm-btn-icon" data-action="edit" title="ভূমিকা বদলান"><i data-lucide="pencil" width="16" height="16"></i></button>' +
          '<button class="adm-btn-icon adm-danger" data-action="delete" title="মুছুন"><i data-lucide="trash-2" width="16" height="16"></i></button>' +
        '</td></tr>';
    }).join('') : admEmptyRow(6, 'এখনো কোনো সদস্য নেই।');
    labelTableCells(document.querySelector('[data-view-panel="members"]'));
    renderIcons();
  }

  async function saveMemberRole(){
    const id = editingRow && editingRow.dataset.id;
    if (!id) return;
    if (id === window.admMeId && formField('role') !== 'admin'){ showToast('নিজের এডমিন ভূমিকা সরানো যাবে না'); return; }
    modalSaveBtn.disabled = true;
    const { error } = await window.sb.rpc('admin_set_role', { uid: id, new_role: formField('role') });
    modalSaveBtn.disabled = false;
    if (error){ showToast('ভূমিকা বদলানো যায়নি: ' + error.message); return; }
    editingRow = null;
    closeAllModals();
    showToast('ভূমিকা হালনাগাদ হয়েছে');
    await loadMembers();
  }

  async function loadSubmissions(){
    if (!dbOk()) return;
    const tbody = document.querySelector('[data-view-panel="submissions"] tbody');
    const { data, error } = await window.sb.from('submissions')
      .select('id,user_id,title,genre,body_text,file_path,status,created_at')
      .eq('status', 'pending').order('created_at', { ascending: false });
    if (error){ tbody.innerHTML = admEmptyRow(5, 'লেখা লোড করা যায়নি: ' + escAttr(error.message)); return; }
    const ids = [...new Set(data.map(r => r.user_id))];
    const profs = {};
    if (ids.length){
      const p = await window.sb.from('profiles').select('id,name,faculty,batch,bio,avatar_url').in('id', ids);
      (p.data || []).forEach(x => { profs[x.id] = x; });
    }
    admRows.submissions.clear();
    admRows.authorOrig.clear();
    const store = window.admSubStore;
    data.forEach(r => {
      const pr = profs[r.user_id] || {};
      admRows.submissions.set(r.id, r);
      admRows.authorOrig.set(r.id, { name: pr.name || '', faculty: pr.faculty || '', batch: pr.batch || '', bio: pr.bio || '', avatar_url: pr.avatar_url || '' });
      // পর্যালোচনা পেজ এই তথ্য থেকে ভরবে
      if (store) store[r.id] = {
        name: pr.name || '', faculty: pr.faculty || '', batch: pr.batch || '', bio: pr.bio || '',
        genre: r.genre || '', title: r.title || '', pic: pr.avatar_url || '',
        body: (r.body_text || '').split(/\n\s*\n/).filter(t => t.trim()).map(t => '<p>' + escAttr(t.trim()).replace(/\n/g, '<br>') + '</p>').join(''),
        files: r.file_path ? [{ name: r.file_path.split('/').pop(), size: 0 }] : []
      };
    });
    tbody.innerHTML = data.length ? data.map(r => {
      const hasFile = !!r.file_path;
      return '<tr data-row data-sub="' + escAttr(r.id) + '" data-sub-id="' + escAttr(r.id) + '">' +
        '<td class="adm-cell-title">' + escAttr(r.title) + '</td>' +
        '<td>' + escAttr((profs[r.user_id] && profs[r.user_id].name) || '—') + '</td>' +
        '<td><span class="adm-tag-pill">' + escAttr(r.genre || '—') + '</span></td>' +
        '<td>' + (hasFile ? 'ফাইল' : 'লিখিত টেক্সট') + '</td>' +
        '<td class="adm-row-actions">' +
          '<button class="adm-btn-icon" data-action="review" title="দেখুন"><i data-lucide="eye" width="16" height="16"></i></button>' +
          (hasFile ? '<button class="adm-btn-icon" data-sub-file="1" title="ফাইল ডাউনলোড"><i data-lucide="download" width="16" height="16"></i></button>' : '') +
          '<button class="adm-btn-icon" data-sub-act="approve" title="অনুমোদন" style="color:var(--forest);"><i data-lucide="check" width="16" height="16"></i></button>' +
          '<button class="adm-btn-icon adm-danger" data-sub-act="reject" title="প্রত্যাখ্যান"><i data-lucide="x" width="16" height="16"></i></button>' +
        '</td></tr>';
    }).join('') : admEmptyRow(5, 'পর্যালোচনার অপেক্ষায় কোনো লেখা নেই।');
    labelTableCells(document.querySelector('[data-view-panel="submissions"]'));
    const dash = document.querySelector('#admDashRecent tbody');
    dash.innerHTML = data.length ? data.slice(0, 5).map(r =>
      '<tr data-sub="' + escAttr(r.id) + '"><td class="adm-cell-title">' + escAttr(r.title) + '</td>' +
      '<td>' + escAttr((profs[r.user_id] && profs[r.user_id].name) || '—') + '</td>' +
      '<td><span class="adm-tag-pill">' + escAttr(r.genre || '—') + '</span></td>' +
      '<td><span class="adm-status-dot adm-pending">পর্যালোচনাধীন</span></td>' +
      '<td class="adm-row-actions"><button class="adm-btn-icon" data-action="review" title="দেখুন"><i data-lucide="eye" width="16" height="16"></i></button></td></tr>'
    ).join('') : admEmptyRow(5, 'পর্যালোচনার অপেক্ষায় কোনো লেখা নেই।');
    labelTableCells(document.getElementById('admDashRecent').parentNode);
    renderIcons();
  }

  // পর্যালোচনা পেজের সংরক্ষণ: লেখা, লেখকের তথ্য ও ছবি
  window.admSaveSubmission = async function(id, rec){
    const row = admRows.submissions.get(id);
    if (!row){ showToast('লেখাটি খুঁজে পাওয়া যায়নি'); return; }
    const html = (rec.body || '').replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, '\n\n').replace(/<br\s*\/?>/gi, '\n');
    const box = document.createElement('div');
    box.innerHTML = html;
    const text = box.textContent.replace(/\n{3,}/g, '\n\n').trim();
    const payload = { title: rec.title, genre: rec.genre };
    if (text) payload.body_text = text;   // লেখা খালি হলে আগের মূল অংশ থাকবে
    const { error } = await window.sb.from('submissions').update(payload).eq('id', id);
    if (error){ showToast('লেখা সংরক্ষণ ব্যর্থ: ' + error.message); return; }

    // লেখকের তথ্য বা ছবি বদলালে প্রোফাইল হালনাগাদ (এডমিন ফাংশনের মাধ্যমে)
    const orig = admRows.authorOrig.get(id) || {};
    const changed = ['name', 'faculty', 'batch', 'bio'].some(k => (rec[k] || '') !== (orig[k] || ''));
    const newPic = !!rec.pic && rec.pic.indexOf('data:') === 0;
    if (changed || newPic){
      let avatar = null;
      if (newPic){
        const blob = await (await fetch(rec.pic)).blob();
        const path = row.user_id + '/profile.webp';
        const up = await window.sb.storage.from('avatars').upload(path, blob, { upsert: true, contentType: blob.type || 'image/webp' });
        if (up.error){ showToast('ছবি আপলোড ব্যর্থ: ' + up.error.message); return; }
        avatar = window.sb.storage.from('avatars').getPublicUrl(path).data.publicUrl + '?v=' + Date.now();
      }
      const res = await window.sb.rpc('admin_update_author', {
        uid: row.user_id, p_name: rec.name, p_faculty: rec.faculty, p_batch: rec.batch, p_bio: rec.bio, p_avatar: avatar
      });
      if (res.error){ showToast('লেখকের তথ্য সংরক্ষণ ব্যর্থ: ' + res.error.message); return; }
    }
    showToast('লেখা সংরক্ষণ করা হয়েছে');
    loadSubmissions();
  };

  // প্রাপ্ত লেখার ফাইল: ব্যক্তিগত বাকেট, তাই সাময়িক লিংক বানিয়ে খোলা হয়
  document.addEventListener('click', async e => {
    const btn = e.target.closest('[data-sub-file]');
    if (!btn || !dbOk()) return;
    const row = btn.closest('[data-sub-id]');
    const r = row && admRows.submissions.get(row.dataset.subId);
    if (!r || !r.file_path) return;
    const { data, error } = await window.sb.storage.from('submissions').createSignedUrl(r.file_path, 300);
    if (error){ showToast('ফাইল খোলা যায়নি: ' + error.message); return; }
    window.open(data.signedUrl, '_blank', 'noopener');
  });

  // অনুমোদন / প্রত্যাখ্যান: review_submission ফাংশন (শুধু এডমিন চালাতে পারেন)
  document.addEventListener('click', async e => {
    const btn = e.target.closest('[data-sub-act]');
    if (!btn || !dbOk()) return;
    const row = btn.closest('[data-sub-id]');
    if (!row) return;
    const approve = btn.dataset.subAct === 'approve';
    btn.disabled = true;
    if (approve){ const sr = admRows.submissions.get(row.dataset.subId); if (sr && sr.genre) await window.admEnsureGenre(sr.genre); }
    const { error } = await window.sb.rpc('review_submission', { sid: row.dataset.subId, approve: approve, note: null });
    btn.disabled = false;
    if (error){ showToast('ব্যর্থ হয়েছে: ' + error.message); return; }
    showToast(approve ? 'লেখাটি অনুমোদন করা হয়েছে' : 'লেখাটি প্রত্যাখ্যান করা হয়েছে');
    loadSubmissions();
  });

  // ---------- হোমপেজ টেক্সট ও মূল্যবোধ (site_content, site_values) ----------
  async function loadHomepage(){
    if (!dbOk()) return;
    const [c, v] = await Promise.all([
      window.sb.from('site_content').select('key,value').in('key', ['hero_stats', 'hero', 'about']),
      window.sb.from('site_values').select('id,title,description,sort_order').order('sort_order').order('id')
    ]);
    if (c.error || v.error){ showToast('হোমপেজ লোড করা যায়নি'); return; }
    const content = {};
    (c.data || []).forEach(r => { content[r.key] = r.value; });
    const hs = content.hero_stats || {};
    document.getElementById('heroMembers').value = hs.members || '';
    document.getElementById('heroIssues').value = hs.issues || '';
    document.getElementById('heroYears').value = hs.years || '';
    const hero = content.hero || {};
    document.getElementById('heroTitle').value = hero.title || '';
    document.getElementById('heroDesc').value = hero.desc || '';
    const about = content.about || {};
    document.getElementById('aboutSubtitle').value = about.title || '';
    document.getElementById('aboutText').value = (about.paragraphs || []).join('\n\n');

    admRows.values.clear();
    (v.data || []).forEach(r => admRows.values.set(String(r.id), r));
    const tbody = document.querySelector('[data-view-panel="homepage"] table tbody');
    tbody.innerHTML = v.data.length ? v.data.map(r =>
      '<tr data-row data-id="' + escAttr(r.id) + '">' +
      '<td>' + escAttr(toBnNum(String(r.sort_order).padStart(2, '0'))) + '</td>' +
      '<td class="adm-cell-title">' + escAttr(r.title) + '</td>' +
      '<td>' + escAttr(r.description || '') + '</td>' +
      '<td class="adm-row-actions"><button class="adm-btn-icon" data-action="edit" title="সম্পাদনা"><i data-lucide="pencil" width="16" height="16"></i></button></td></tr>'
    ).join('') : admEmptyRow(4, 'এখনো কোনো মূল্যবোধ যোগ করা হয়নি।');
    labelTableCells(document.querySelector('[data-view-panel="homepage"]'));
    renderIcons();
  }

  async function saveHero(btn){
    const stats = {
      members: document.getElementById('heroMembers').value.trim(),
      issues: document.getElementById('heroIssues').value.trim(),
      years: document.getElementById('heroYears').value.trim()
    };
    const hero = {
      title: document.getElementById('heroTitle').value.trim(),
      desc: document.getElementById('heroDesc').value.trim()
    };
    btn.disabled = true;
    const [a, b] = await Promise.all([
      window.sb.from('site_content').upsert({ key: 'hero_stats', value: stats }, { onConflict: 'key' }),
      window.sb.from('site_content').upsert({ key: 'hero', value: hero }, { onConflict: 'key' })
    ]);
    btn.disabled = false;
    const err = a.error || b.error;
    showToast(err ? 'সংরক্ষণ ব্যর্থ: ' + err.message : 'হিরো তথ্য সংরক্ষণ করা হয়েছে');
  }

  async function saveAbout(btn){
    const paragraphs = document.getElementById('aboutText').value.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    btn.disabled = true;
    const { error } = await window.sb.from('site_content')
      .upsert({ key: 'about', value: { title: document.getElementById('aboutSubtitle').value.trim(), paragraphs: paragraphs } }, { onConflict: 'key' });
    btn.disabled = false;
    showToast(error ? 'সংরক্ষণ ব্যর্থ: ' + error.message : 'পরিচিতি সংরক্ষণ করা হয়েছে');
  }

  async function saveValue(){
    const title = formField('title');
    if (!title){ showToast('শিরোনাম দিন'); return; }
    const order = parseInt(formField('num'), 10);
    const payload = { title: title, description: formField('desc') || null, sort_order: Number.isFinite(order) ? order : 0 };
    const editId = editingRow ? editingRow.dataset.id : null;
    modalSaveBtn.disabled = true;
    const res = editId
      ? await window.sb.from('site_values').update(payload).eq('id', editId)
      : await window.sb.from('site_values').insert(payload);
    modalSaveBtn.disabled = false;
    if (res.error){ showToast('সংরক্ষণ ব্যর্থ: ' + res.error.message); return; }
    editingRow = null;
    closeAllModals();
    showToast('মূল্যবোধ সংরক্ষণ করা হয়েছে');
    await loadHomepage();
  }

  // ---------- সাইট সেটিংস (site_settings) ----------
  async function loadSettings(){
    if (!dbOk()) return;
    const { data, error } = await window.sb.from('site_settings').select('key,value');
    if (error){ showToast('সেটিংস লোড করা যায়নি: ' + error.message); return; }
    const s = {};
    (data || []).forEach(r => { s[r.key] = r.value; });
    const put = (id, key) => { document.getElementById(id).value = typeof s[key] === 'string' ? s[key] : ''; };
    put('setEmail', 'contact_email');
    put('setPhone', 'contact_phone');
    put('setAddress', 'address');
    put('setFacebook', 'facebook_url');
    put('setFooter', 'footer_slogan');
    document.getElementById('setSiteName').value = typeof s.site_name === 'string' && s.site_name ? s.site_name : 'পরিবর্তন, বাংলা সাহিত্য ক্লাব';
  }

  async function saveSettings(btn){
    const pairs = [['site_name', 'setSiteName'], ['contact_email', 'setEmail'], ['contact_phone', 'setPhone'],
                   ['address', 'setAddress'], ['facebook_url', 'setFacebook'], ['footer_slogan', 'setFooter']];
    const rows = pairs.map(([key, id]) => ({ key: key, value: document.getElementById(id).value.trim() }));
    btn.disabled = true;
    try {
      const logoInput = document.querySelector('[data-view-panel="settings"] input[type=file]');
      const logoFile = logoInput && logoInput.files && logoInput.files[0];
      if (logoFile) rows.push({ key: 'logo_path', value: await admUpload('covers', logoFile) });
      const { error } = await window.sb.from('site_settings').upsert(rows, { onConflict: 'key' });
      if (error) throw new Error(error.message);
      if (logoFile) logoInput.value = '';
      showToast('সেটিংস সংরক্ষণ করা হয়েছে (লোগো পরিবর্তন হলে সাইট রিফ্রেশ করুন)');
    } catch (err) {
      showToast('সংরক্ষণ ব্যর্থ: ' + err.message);
    }
    btn.disabled = false;
  }

  // সংরক্ষণ বাটনগুলো যুক্ত করা (পেজে আগে থেকেই আছে)
  const heroPanel = document.querySelector('[data-view-panel="homepage"] .adm-panel');
  const aboutPanel = document.querySelectorAll('[data-view-panel="homepage"] .adm-panel')[1];
  heroPanel.querySelector('button.adm-btn-primary').addEventListener('click', e => saveHero(e.currentTarget));
  aboutPanel.querySelector('button.adm-btn-primary').addEventListener('click', e => saveAbout(e.currentTarget));
  document.querySelector('[data-view-panel="settings"] button.adm-btn-primary')
    .addEventListener('click', e => saveSettings(e.currentTarget));

  // ---------- প্রাপ্ত লেখা: প্রিভিউ ও সম্পাদনা পেজ ----------
  // "দেখুন" (চোখ) আইকনে ক্লিক করলে লেখা পাঠানোর পেজের মতো একই লেআউটে লেখকের জমা দেওয়া লেখা খোলে।
  // এডমিন সেখানে সবকিছু দেখতে ও প্রয়োজনে এডিট করতে পারেন। (ডেমো ডেটা, ব্যাকএন্ড যুক্ত করলে আসল ডেটা বসবে)
  (function(){
    const panel = document.getElementById('admSubReview');
    if (!panel) return;

    const form = document.getElementById('rvForm');
    const nameI = document.getElementById('rvName');
    const facultyI = document.getElementById('rvFaculty');
    const batchI = document.getElementById('rvBatch');
    const bioI = document.getElementById('rvBio');
    const picInfoRv = document.getElementById('rvPicInfo');
    const titleI = document.getElementById('rvTitle');
    const editor = document.getElementById('rvEditor');
    const toolbar = document.getElementById('rvRteToolbar');
    const genreGrid = document.getElementById('rvGenreGrid');
    const picPreview = document.getElementById('rvPicPreview');
    const picImg = document.getElementById('rvPicImg');
    const picInput = document.getElementById('rvPicInput');
    const picBtn = document.getElementById('rvPicBtn');
    const dropZone = document.getElementById('rvDropZone');
    const fileInput = document.getElementById('rvFileInput');
    const uploadList = document.getElementById('rvUploadList');

    const genreList = () => window.GenreStore.names();   // এডমিনের "ধরন" তালিকা
    const GENRE_ALIAS = { 'গল্প': 'ছোটগল্প' };                       // তালিকার পুরোনো লেবেল → ফর্মের লেবেল
    const PILL_CLASS = { 'কবিতা': '', 'ছোটগল্প': 'adm-maroon', 'উপন্যাস': 'adm-maroon', 'সিরিজ': 'adm-maroon' };
    const DEFAULT_PLACEHOLDER = 'এখানে লেখা লিখুন...';
    const FILE_ONLY_PLACEHOLDER = 'এই লেখাটি ফাইল হিসেবে জমা দেওয়া হয়েছে। চাইলে এখানে টেক্সট যোগ করতে পারেন...';
    const ALLOWED_EXT = /\.(jpe?g|pdf|docx?|txt)$/i;
    const MAX_FILE_BYTES = 10 * 1024 * 1024;

    // ডেমো ডেটা: প্রতিটি সারির data-sub এর সাথে মেলে
    const SUBMISSIONS = window.admSubStore = {};

    let currentId = null;
    let state = { genre: '', files: [], pic: '', dirty: false };

    function fmtSize(bytes){
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    // ---- লেখার ধরন (চিপ) ----
    function renderGenres(){
      const G = genreList();
      const list = G.includes(state.genre) || !state.genre ? G : G.concat(state.genre); // তালিকায় নেই এমন ধরন (লেখকের নিজের যোগ করা) হারাবে না
      genreGrid.innerHTML = list.map(g =>
        '<button type="button" data-genre="' + escAttr(g) + '"' + (g === state.genre ? ' class="active"' : '') + '>' + escAttr(g) + '</button>'
      ).join('');
    }
    genreGrid.addEventListener('click', e => {
      const btn = e.target.closest('button[data-genre]');
      if (!btn) return;
      state.genre = btn.dataset.genre;
      state.dirty = true;
      genreGrid.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === btn));
    });

    window.GenreStore.onChange(() => { if (currentId) renderGenres(); });

    // ---- প্রোফাইল পিকচার ----
    function setPic(src){
      state.pic = src || '';
      if (src){ picImg.src = src; picPreview.classList.add('has-img'); }
      else { picImg.removeAttribute('src'); picPreview.classList.remove('has-img'); }
    }
    const openPicPicker = () => picInput.click();
    picPreview.addEventListener('click', openPicPicker);
    picPreview.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openPicPicker(); } });
    picBtn.addEventListener('click', openPicPicker);
    picInput.addEventListener('change', async () => {
      const f = picInput.files[0];
      picInput.value = '';
      if (!f) return;
      if (!/^image\/(png|jpe?g)$/i.test(f.type)){ showToast('শুধু JPG / PNG ছবি দেওয়া যাবে'); return; }
      if (f.size > 10 * 1024 * 1024){ showToast('ছবি সর্বোচ্চ ১০MB হতে পারবে'); return; }
      try {
        const r = await window.compressProfilePic(f);
        setPic(r.dataUrl); state.dirty = true;
        picInfoRv.textContent = 'WebP · ' + window.fmtPicSize(r.bytes) + ' (আগে ' + window.fmtPicSize(f.size) + ')';
      } catch (err) { showToast('ছবিটি প্রসেস করা যায়নি'); }
    });

    // ---- Rich Text Editor টুলবার ----
    toolbar.querySelectorAll('button[data-cmd]').forEach(btn => btn.addEventListener('click', () => {
      editor.focus();
      document.execCommand(btn.dataset.cmd, false, btn.dataset.value || null);
      state.dirty = true;
    }));

    // ---- সংযুক্ত ফাইল ----
    function renderFiles(){
      uploadList.innerHTML = state.files.map((f, i) =>
        '<div class="u-row">' +
          '<i data-lucide="file-text" width="16" height="16"></i>' +
          '<span class="u-name">' + escAttr(f.name) + '</span>' +
          '<span class="u-size">' + fmtSize(f.size) + '</span>' +
          '<button type="button" class="u-remove" data-remove="' + i + '" aria-label="সরিয়ে ফেলুন"><i data-lucide="x" width="14" height="14"></i></button>' +
        '</div>'
      ).join('');
      renderIcons();
    }
    uploadList.addEventListener('click', e => {
      const btn = e.target.closest('[data-remove]');
      if (!btn) return;
      state.files.splice(Number(btn.dataset.remove), 1);
      state.dirty = true;
      renderFiles();
    });
    function acceptFiles(fileListLike){
      const rejected = [];
      Array.from(fileListLike).forEach(f => {
        if (!ALLOWED_EXT.test(f.name)){ rejected.push(f.name + ' (ফরম্যাট সমর্থিত নয়)'); return; }
        if (f.size > MAX_FILE_BYTES){ rejected.push(f.name + ' (সর্বোচ্চ ১০MB এর বেশি)'); return; }
        state.files.push({ name: f.name, size: f.size });
        state.dirty = true;
      });
      if (rejected.length) alert('নিচের ফাইলগুলো গ্রহণ করা হয়নি:\n' + rejected.join('\n'));
      renderFiles();
    }
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); fileInput.click(); } });
    fileInput.addEventListener('change', () => { acceptFiles(fileInput.files); fileInput.value = ''; });
    ['dragover', 'dragenter'].forEach(ev => dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.add('drag'); }));
    ['dragleave', 'drop'].forEach(ev => dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.remove('drag'); }));
    dropZone.addEventListener('drop', e => acceptFiles(e.dataTransfer.files));

    // কোনো ফিল্ডে লিখলে "সংরক্ষণ হয়নি" চিহ্ন
    form.addEventListener('input', () => { state.dirty = true; });
    form.addEventListener('change', () => { state.dirty = true; });

    // ---- পেজ খোলা ----
    function openReview(row){
      const id = row.dataset.sub;
      const rec = SUBMISSIONS[id];
      if (!rec) return;
      currentId = id;
      const genre = GENRE_ALIAS[rec.genre] || rec.genre;
      state = { genre: genre, files: rec.files.map(f => ({ name: f.name, size: f.size })), pic: rec.pic || '', dirty: false };

      nameI.value = rec.name;
      facultyI.value = rec.faculty;
      batchI.value = rec.batch;
      bioI.value = rec.bio || '';
      picInfoRv.textContent = '';
      titleI.value = rec.title;
      editor.innerHTML = rec.body || '';
      editor.dataset.placeholder = (!rec.body && rec.files.length) ? FILE_ONLY_PLACEHOLDER : DEFAULT_PLACEHOLDER;
      setPic(state.pic);
      renderGenres();
      renderFiles();
      goToView('submission-review');
    }

    function leave(){
      if (state.dirty && !confirm('সংরক্ষণ না করা পরিবর্তন বাতিল হয়ে যাবে। ফিরে যেতে চান?')) return;
      state.dirty = false;
      currentId = null;
      goToView('submissions');
    }
    document.getElementById('rvBackBtn').addEventListener('click', leave);
    document.getElementById('rvCancelBtn').addEventListener('click', leave);

    async function decide(approve){
      if (!currentId || !window.sb) return;
      if (approve && state.dirty){ showToast('আগে পরিবর্তন সংরক্ষণ করুন'); return; }
      if (!confirm(approve ? 'লেখাটি অনুমোদন করে প্রকাশ করবেন?' : 'লেখাটি প্রত্যাখ্যান করবেন?')) return;
      if (approve && window.admEnsureGenre) await window.admEnsureGenre(state.genre);   // নতুন ধরন হলে মূল তালিকায় যুক্ত হবে
      const { error } = await window.sb.rpc('review_submission', { sid: currentId, approve: approve, note: null });
      if (error){ showToast('ব্যর্থ হয়েছে: ' + error.message); return; }
      showToast(approve ? 'লেখাটি অনুমোদন করা হয়েছে' : 'লেখাটি প্রত্যাখ্যান করা হয়েছে');
      state.dirty = false; currentId = null;
      goToView('submissions');
    }
    document.getElementById('rvApproveBtn').addEventListener('click', () => decide(true));
    document.getElementById('rvRejectBtn').addEventListener('click', () => decide(false));

    // তালিকা ও ড্যাশবোর্ডের "দেখুন" আইকন
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-action="review"]');
      if (!btn) return;
      const row = btn.closest('tr[data-sub]');
      if (row) openReview(row);
    });

    // ---- সংরক্ষণ ----
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!currentId) return;
      const name = nameI.value.trim();
      const faculty = facultyI.value;
      const batch = batchI.value.trim();
      const title = titleI.value.trim();
      if (!name){ nameI.focus(); showToast('লেখকের নাম দিন'); return; }
      if (!faculty){ facultyI.focus(); showToast('ফ্যাকাল্টি নির্বাচন করুন'); return; }
      if (!batch){ batchI.focus(); showToast('ব্যাচ দিন'); return; }
      if (!title){ titleI.focus(); showToast('লেখার শিরোনাম দিন'); return; }

      const hasText = editor.textContent.trim() !== '' || editor.querySelector('img');
      const rec = SUBMISSIONS[currentId];
      Object.assign(rec, {
        name: name, faculty: faculty, batch: batch, bio: bioI.value.trim(), title: title, genre: state.genre,
        body: hasText ? editor.innerHTML : '', pic: state.pic,
        files: state.files.map(f => ({ name: f.name, size: f.size }))
      });

      // তালিকা ও ড্যাশবোর্ডের সারি হালনাগাদ
      document.querySelectorAll('tr[data-sub="' + currentId + '"]').forEach(row => {
        const cells = row.querySelectorAll('td');
        cells[0].textContent = title;
        cells[1].textContent = name;
        const pillCls = PILL_CLASS[state.genre] !== undefined ? PILL_CLASS[state.genre] : 'adm-brass';
        cells[2].innerHTML = '<span class="adm-tag-pill' + (pillCls ? ' ' + pillCls : '') + '"></span>';
        cells[2].firstChild.textContent = state.genre;
      });

      editor.dataset.placeholder = (!rec.body && rec.files.length) ? FILE_ONLY_PLACEHOLDER : DEFAULT_PLACEHOLDER;
      state.dirty = false;
      if (window.admSaveSubmission) window.admSaveSubmission(currentId, rec);
    });
  })();

  renderIcons();
