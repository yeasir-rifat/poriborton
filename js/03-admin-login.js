
  // ---------- Login gate (Supabase Auth, admin role checked on the server) ----------
  (function(){
    const gate = document.getElementById('admLoginGate');
    const app = document.getElementById('admAdminApp');
    const form = document.getElementById('admLoginForm');
    const card = document.getElementById('admLoginCard');
    const errorBox = document.getElementById('admLoginError');
    const errorText = document.getElementById('admLoginErrorText');
    const submitBtn = document.getElementById('admLoginSubmit');
    const submitLabel = document.getElementById('admLoginSubmitLabel');
    const emailInput = document.getElementById('admLoginEmail');
    const pwInput = document.getElementById('admLoginPassword');
    const pwToggle = document.getElementById('admPwToggle');
    const SUBMIT_TEXT = 'প্রবেশ করুন';
    const BUSY_TEXT = 'প্রবেশ করছি…';

    function showApp(){ gate.style.display = 'none'; app.style.display = 'flex'; renderIcons(); if (typeof loadDashboardCounts === 'function') loadDashboardCounts(); if (typeof loadAdminMe === 'function') loadAdminMe(); if (typeof loadSubmissions === 'function') loadSubmissions(); }
    function showGate(){ app.style.display = 'none'; gate.style.display = 'flex'; }
    function clearError(){ errorBox.hidden = true; }
    function fail(msg){
      errorText.textContent = msg;
      errorBox.hidden = false;
      card.classList.remove('is-shake'); void card.offsetWidth; card.classList.add('is-shake');
    }
    function setBusy(on){
      submitBtn.disabled = on;
      submitLabel.textContent = on ? BUSY_TEXT : SUBMIT_TEXT;
    }

    // Show / hide password
    pwToggle.addEventListener('click', function(){
      const show = pwInput.type === 'password';
      pwInput.type = show ? 'text' : 'password';
      pwToggle.setAttribute('aria-pressed', String(show));
      pwToggle.setAttribute('aria-label', show ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন');
      pwToggle.innerHTML = '<i data-lucide="' + (show ? 'eye-off' : 'eye') + '" width="18" height="18"></i>';
      renderIcons();
      pwInput.focus();
    });
    [emailInput, pwInput].forEach(function(el){ el.addEventListener('input', clearError); });

    // Restore an existing session on page load
    (async function(){
      if (!window.sb) return;
      const { data } = await sb.auth.getSession();
      if (data.session && await sbIsAdmin(data.session.user.id)) showApp();
    })();

    form.addEventListener('submit', async function(e){
      e.preventDefault();
      clearError();
      if (!window.sb){ fail('ডেটাবেস সংযুক্ত নেই। সাইট কনফিগারেশন চেক করুন।'); return; }
      const email = emailInput.value.trim();
      const pass = pwInput.value;
      setBusy(true);
      const { data, error } = await sb.auth.signInWithPassword({ email: email, password: pass });
      if (error){ setBusy(false); fail('ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।'); return; }
      if (!(await sbIsAdmin(data.user.id))){
        await sb.auth.signOut();
        setBusy(false);
        fail('এই অ্যাকাউন্টের অ্যাডমিন অনুমতি নেই।');
        return;
      }
      setBusy(false);
      form.reset();
      showApp();
    });

    if (window.sb) sb.auth.onAuthStateChange(function(ev){ if (ev === 'SIGNED_OUT') showGate(); });

    // Logout ends the real session, then returns the visitor to the homepage
    const logoutBtn = document.querySelector('#admin-page .adm-logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', async function(){
      if (window.sb){ try { await sb.auth.signOut(); } catch (err) {} }
      form.reset();
      clearError();
      showGate();
      location.hash = '#top';
    });
  })();
