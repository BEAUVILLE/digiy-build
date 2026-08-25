/* =========================================================
   DIGIY BUILD PRO — GUARD (repo-safe)
   - Supabase init
   - Session validate
   - slug-safe helpers
   ========================================================= */

(() => {
  const CFG = {
    module: "build_pro",
    sessionKey: "DIGIY_BUILD_PRO_SESSION_V1",
    // ⚠️ Mets tes clés (identiques à pin.html)
    supabaseUrl: "https://YOURPROJECT.supabase.co",
    supabaseAnonKey: "YOUR_ANON_KEY",
    sessionHours: 8,
  };

  const log = (...a) => console.log("🧱 DIGIY BUILD PRO", ...a);
  const warn = (...a) => console.warn("🧱 DIGIY BUILD PRO", ...a);

  function cleanSlug(v){
    v = (v || "").trim().toLowerCase();
    v = v.replace(/[^a-z0-9\-]/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"");
    return v;
  }

  function urlSlug(){
    try { return cleanSlug(new URL(location.href).searchParams.get("slug") || ""); }
    catch(_){ return ""; }
  }

  function withSlug(path){
    const s = urlSlug();
    if(!s) return path;
    try{
      const u = new URL(path, location.origin + location.pathname.replace(/\/[^\/]*$/, "/"));
      u.searchParams.set("slug", s);
      return u.pathname + "?" + u.searchParams.toString();
    }catch(_){
      const hasQ = String(path).includes("?");
      return path + (hasQ ? "&" : "?") + "slug=" + encodeURIComponent(s);
    }
  }

  function go(path){
    if(path && typeof path === "object"){
      path = path.currentTarget?.getAttribute?.("data-go") || "";
    }
    if(typeof path !== "string" || !path.trim()) return;
    location.href = withSlug(path);
  }

  function readSession(){
    try{
      const raw = localStorage.getItem(CFG.sessionKey);
      if(!raw) return null;
      return JSON.parse(raw);
    }catch(_){ return null; }
  }

  function writeSession(s){
    try{
      localStorage.setItem(CFG.sessionKey, JSON.stringify(s));
      return true;
    }catch(_){ return false; }
  }

  function clearSession(){
    try{ localStorage.removeItem(CFG.sessionKey); }catch(_){}
    try{ localStorage.removeItem("DIGIY_PRO_ID"); }catch(_){}
  }

  function isSessionValid(s){
    if(!s || !s.ok) return false;
    if(s.module !== CFG.module) return false;
    if(!s.expires_at) return false;
    const t = new Date(s.expires_at).getTime();
    if(!isFinite(t)) return false;
    if(Date.now() >= t) return false;
    // BUILD: on veut owner_id obligatoire
    if(!s.owner_id) return false;
    return true;
  }

  function requireSession({ redirectTo = "./pin.html" } = {}){
    const s = readSession();
    if(!isSessionValid(s)){
      clearSession();
      location.replace(withSlug(redirectTo));
      throw new Error("No valid session");
    }
    // shortcut
    try{ localStorage.setItem("DIGIY_PRO_ID", s.owner_id); }catch(_){}
    return s;
  }

  function logout(redirectTo="./pin.html"){
    clearSession();
    location.replace(withSlug(redirectTo));
  }

  function initSupabase(){
    const supa = window.supabase;
    if(!supa?.createClient){
      throw new Error("Supabase CDN manquant: window.supabase.createClient indisponible.");
    }
    return supa.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey);
  }

  try{
    const sb = initSupabase();
    window.__digiy_build_cfg__ = CFG;
    window.__digiy_sb__ = sb;

    window.DIGIY = window.DIGIY || {};
    window.DIGIY.BUILD = {
      cfg: CFG,
      sb,
      cleanSlug,
      urlSlug,
      withSlug,
      go,
      readSession,
      writeSession,
      requireSession,
      logout,
    };

    log("Guard loaded ✅");
  }catch(e){
    console.error(e);
    window.__digiy_build_cfg__ = CFG;
    window.DIGIY = window.DIGIY || {};
    window.DIGIY.BUILD = window.DIGIY.BUILD || {};
    window.DIGIY.BUILD.cfg = CFG;
    window.DIGIY.BUILD.guardError = String(e?.message || e);
    warn("Guard error ❌", e?.message || e);
  }
})();
