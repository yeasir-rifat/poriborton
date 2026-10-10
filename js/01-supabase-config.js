
  // ===== Supabase config: Dashboard > Project Settings > API থেকে নিন =====
  // শুধু anon key বসান। service_role key কখনো এখানে নয়।
  const SUPABASE_URL = "https://vqtapbuflfrcyegvylap.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_mnZx-l3cwEbthqjAzCuALQ_BRsBFFIl";
  const sbReady = !SUPABASE_URL.startsWith("YOUR_") && window.supabase;
  window.sb = sbReady ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
  async function sbIsAdmin(userId){
    if (!window.sb) return false;
    const { data, error } = await window.sb.from('profiles').select('role').eq('id', userId).single();
    return !error && data && data.role === 'admin';
  }

  // ===== লেখার ধরন: পুরো সাইটের একটাই তালিকা (এডমিন প্যানেলের "ধরন" পেজ থেকে নিয়ন্ত্রিত) =====
  // হোমপেজ, লেখা পেজ, লেখা জমা ফর্ম, পর্যালোচনা পেজ ও এডমিনের সব ড্রপডাউন এই GenreStore থেকেই ধরন নেয়।
  window.GENRE_DEFAULTS = ['কবিতা', 'ছোটগল্প', 'উপন্যাস', 'সিরিজ', 'ধাঁধা', 'কৌতুক', 'সায়েন্স ফিকশন', 'প্রবন্ধ', 'অনুবাদ'];
  window.GenreStore = (function(){
    const ALIAS = { 'গল্প': 'ছোটগল্প' };           // পুরোনো লেবেল → বর্তমান লেবেল
    const clean = v => String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
    let rows = window.GENRE_DEFAULTS.map((n, i) => ({ id: null, name: n, sort_order: i + 1 }));
    let fromDb = false, tableMissing = false, loaded = false;
    const subs = [];
    const notify = () => subs.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
    return {
      rows: () => rows.slice(),
      names: () => rows.map(r => r.name),
      has: n => rows.some(r => r.name === clean(n)),
      canon(n){
        n = clean(n);
        const a = ALIAS[n];
        return (a && !rows.some(r => r.name === n) && rows.some(r => r.name === a)) ? a : n;
      },
      isFromDb: () => fromDb,
      isTableMissing: () => tableMissing,
      isLoaded: () => loaded,
      onChange(fn){ subs.push(fn); },
      async load(){
        if (window.sb){
          try {
            const { data, error } = await window.sb.from('genres').select('id,name,sort_order')
              .order('sort_order', { ascending: true }).order('name', { ascending: true });
            if (error){ tableMissing = true; fromDb = false; }
            else if (data && data.length){ rows = data; fromDb = true; tableMissing = false; }
            else { fromDb = false; tableMissing = false; }   // টেবিল খালি: ডিফল্ট তালিকা চলবে
          } catch (e) { tableMissing = true; fromDb = false; }
        }
        loaded = true; notify(); return rows;
      }
    };
  })();
