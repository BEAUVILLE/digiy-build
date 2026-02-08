/* guard.js — DIGIY UNIVERSAL SUBSCRIPTION GUARD (SaaS multi-modules)
   - Supporte session "slug+PIN" (DIGIY_SESSION / DIGIY_GUARD) ✅
   - Supporte fallback Supabase Auth phone (si présent) ✅
   - Vérifie abonnement module via table digiy_subscriptions (RLS doit autoriser SELECT)
   - Cache 60s par module/phone ✅
*/
(function(){
  "use strict";

  // =============================
  // CONFIG
  // =============================
  const SUPABASE_URL = "https://wesqmwjjtsefyjnluosj.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indlc3Ftd2pqdHNlZnlqbmx1b3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNzg4ODIsImV4cCI6MjA4MDc1NDg4Mn0.dZfYOc2iL2_wRYL3zExZFsFSBK6AbMeOid2LrIjcTdA";

  // Page paiement (porte d’entrée abo)
  const PAY_URL = "https://beauville.github.io/commencer-a-payer/";

  // Clés session (compat)
  const SESSION_KEYS = [
    "DIGIY_SESSION",   // ta session universelle
    "DIGIY_ACCESS"     // parfois tu stockes ici
  ];

  // =============================
  // HELPERS
  // =============================
  function nowMs(){ return Date.now(); }

  // phone -> digits only (important)
  function phoneDigits(p){
    return String(p || "").replace(/\D/g, "");
  }

  // base path GH pages safe
  function basePath(){
    const parts = (location.pathname || "/").split("/").filter(Boolean);
    const isGh = /\.github\.io$/i.test(location.hostname);
    if(isGh && parts.length > 0) return "/" + parts[0];
    return ""; // domaine custom ou racine
  }
  const BASE = basePath();

  function localUrl(path){
    const p = String(path || "").trim();
    if(!p) return BASE + "/";
    if(/^https?:\/\//i.test(p)) return p;
    if(p.startsWith("/")) return BASE + p;
    return BASE + "/" + p;
  }

  function cacheKey(phone, module){
    return `digiy_sub_ok:${phone}:${module}`;
  }
  function cacheGet(phone, module){
    try{
      const raw = sessionStorage.getItem(cacheKey(phone,module));
      if(!raw) return null;
      const o = JSON.parse(raw);
      if(o?.ok && o?.exp && o.exp > nowMs()) return true;
      return null;
    }catch(_){ return null; }
  }
  function cacheSet(phone, module, seconds){
    try{
      sessionStorage.setItem(cacheKey(phone,module), JSON.stringify({
        ok:true,
        exp: nowMs() + (seconds * 1000)
      }));
    }catch(_){}
  }

  function say(msg){
    const el = document.getElementById("guard_status");
    if(el) el.textContent = msg;
    console.log("🔐 DIGIY GUARD:", msg);
  }

  function getStoredSession(){
    // 1) DIGIY_GUARD.getSession()
    try{
      const gs = window.DIGIY_GUARD?.getSession?.();
      if(gs && typeof gs === "object") return gs;
    }catch(_){}

    // 2) window.DIGIY_ACCESS déjà posé par un cockpit
    if(window.DIGIY_ACCESS && typeof window.DIGIY_ACCESS === "object") return window.DIGIY_ACCESS;

    // 3) localStorage keys (compat)
    for(const k of SESSION_KEYS){
      try{
        const raw = localStorage.getItem(k);
        if(!raw) continue;
        const o = JSON.parse(raw);
        if(o && typeof o === "object") return o;
      }catch(_){}
    }
    return null;
  }

  // =============================
  // SUPABASE CLIENT
  // =============================
  function getSb(){
    if(!window.supabase?.createClient){
      console.error("❌ Supabase JS non chargé (ajoute le script CDN avant guard.js)");
      return null;
    }
    if(!window.__sb__) window.__sb__ = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false }
    });
    return window.__sb__;
  }

  // =============================
  // PHONE RESOLUTION (priorité terrain DIGIY)
  // =============================
  async function resolvePhone(){
    // A) depuis session slug+PIN (si tu y mets phone)
    const s = getStoredSession();
    const p1 = phoneDigits(s?.phone);
    if(p1) return p1;

    // B) depuis Supabase Auth (si tu utilises SMS login)
    const sb = getSb();
    if(sb){
      try{
        const { data } = await sb.auth.getSession();
        const sess = data?.session;
        const p =
          sess?.user?.phone ||
          sess?.user?.user_metadata?.phone ||
          sess?.user?.user_metadata?.phone_number ||
          sess?.user?.identities?.[0]?.identity_data?.phone ||
          "";
        const p2 = phoneDigits(p);
        if(p2) return p2;
      }catch(e){
        console.warn("⚠️ supabase.auth.getSession error:", e);
      }
    }

    // C) fallback anciennes clés
    const p3 = phoneDigits(sessionStorage.getItem("digiy_driver_phone"));
    if(p3) return p3;

    try{
      const a = JSON.parse(localStorage.getItem("digiy_driver_access_pin") || "null");
      const p4 = phoneDigits(a?.phone);
      if(p4) return p4;
    }catch(_){}

    return null;
  }

  // =============================
  // SUB CHECK (table) — RLS doit autoriser SELECT
  // =============================
  async function isActive(phone, module){
    const cached = cacheGet(phone, module);
    if(cached){ console.log("✅ Cache hit:", module); return true; }

    const sb = getSb();
    if(!sb) throw new Error("Supabase non initialisé");

    const nowIso = new Date().toISOString();

    const { data, error } = await sb
      .from("digiy_subscriptions")
      .select("id, plan, current_period_end")
      .eq("phone", phone)
      .eq("module", module)
      .eq("status", "active")
      .gt("current_period_end", nowIso)
      .limit(1)
      .maybeSingle();

    if(error) throw error;

    const ok = !!data?.id;
    if(ok) cacheSet(phone, module, 60);
    return ok;
  }

  // =============================
  // PUBLIC API
  // =============================
  async function guardOrPay(opts){
    // opts: { module, loginPath, payUrl, from }
    const module = String(opts?.module || "").trim();
    const loginPath = opts?.loginPath || "/pin.html";
    const payUrl = String(opts?.payUrl || PAY_URL);
    const from = opts?.from || location.href;

    if(!module) throw new Error("guardOrPay: module requis");

    say("Vérification…");

    const phone = await resolvePhone();
    if(!phone){
      say("❌ Connexion requise");
      const target = localUrl(loginPath);
      setTimeout(()=> {
        location.replace(target + (target.includes("?") ? "&" : "?") + "redirect=" + encodeURIComponent(from));
      }, 450);
      return false;
    }

    // expose context
    window.DIGIY_ACCESS = window.DIGIY_ACCESS || {};
    window.DIGIY_ACCESS.phone = phone;
    window.DIGIY_ACCESS.module = module;

    say("Abonnement…");

    try{
      const ok = await isActive(phone, module);
      if(!ok){
        say("❌ Abonnement requis");
        setTimeout(()=> {
          location.replace(
            payUrl
              + "?phone=" + encodeURIComponent(phone)
              + "&module=" + encodeURIComponent(module)
              + "&from=" + encodeURIComponent(from)
          );
        }, 650);
        return false;
      }

      say("✅ Accès OK");
      document.documentElement.classList.add("access-ok");
      window.DIGIY_ACCESS.ok = true;

      // hide status UI if exists
      setTimeout(()=>{
        const el = document.getElementById("guard_status");
        if(el) el.style.display = "none";
      }, 900);

      return true;

    }catch(e){
      console.error("❌ Guard error:", e);
      say("❌ Erreur vérification");
      setTimeout(()=> {
        location.replace(payUrl + "?err=verify&from=" + encodeURIComponent(from));
      }, 650);
      return false;
    }
  }

  // =============================
  // EXPORT
  // =============================
  window.DIGIY = {
    BASE,
    PAY_URL,
    phoneDigits,
    resolvePhone,
    guardOrPay
  };

})();

