(() => {
  "use strict";

  /* =============================
     SUPABASE
  ============================= */
  const SUPABASE_URL = "https://wesqmwjjtsefyjnluosj.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indlc3Ftd2pqdHNlZnlqbmx1b3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNzg4ODIsImV4cCI6MjA4MDc1NDg4Mn0.dZfYOc2iL2_wRYL3zExZFsFSBK6AbMeOid2LrIjcTdA";

  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  /* =============================
     HELPERS
  ============================= */
  const $ = (id) => document.getElementById(id);

  function norm(v){ return (v ?? "").toString().toLowerCase().trim(); }

  function escapeHtml(str){
    return String(str||"")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function cleanPhone(p){
    return String(p||"").replace(/\s+/g,"").replace(/^\+/,"");
  }

  function waLink(phone, msg){
    const ph = cleanPhone(phone);
    const txt = encodeURIComponent(msg || "");
    return "https://wa.me/" + ph + (txt ? ("?text=" + txt) : "");
  }

  function sectorLabel(s){
    const x = norm(s);
    if(x==="construction") return "🏗️ Construction";
    if(x==="plomberie") return "💧 Plomberie";
    if(x==="electricite") return "⚡ Électricité";
    return "🧰 Multi";
  }

  function regionLabel(r){
    const x = norm(r);
    if(x==="dakar") return "🏙️ Dakar";
    if(x==="petite-cote") return "🏖️ Petite Côte";
    if(x==="thies") return "🌿 Thiès";
    return "🇸🇳 National";
  }

  // 🔥 IMPORTANT: si p.sector est souvent NULL, on le déduit du texte/tags
  function inferSector(p){
    const s = norm(p.sector);
    if(s) return s;

    const bag = [
      p.trade, p.bio, p.display_name,
      ...(Array.isArray(p.tags) ? p.tags : [])
    ].map(x => norm(x)).join(" ");

    // plomberie
    if(
      bag.includes("plomb") || bag.includes("fuite") || bag.includes("wc") ||
      bag.includes("douche") || bag.includes("robinet") || bag.includes("chauffe")
    ) return "plomberie";

    // electricite
    if(
      bag.includes("elect") || bag.includes("élect") || bag.includes("tableau") ||
      bag.includes("cabl") || bag.includes("câbl") || bag.includes("disjonct")
    ) return "electricite";

    // construction
    if(
      bag.includes("maçon") || bag.includes("macon") || bag.includes("beton") ||
      bag.includes("béton") || bag.includes("carrel") || bag.includes("peint") ||
      bag.includes("toit") || bag.includes("charpent") || bag.includes("chantier")
    ) return "construction";

    return "multi";
  }

  function safeText(p){
    return [
      p.display_name, p.trade, p.sector, p.region, p.city, p.bio,
      ...(Array.isArray(p.tags) ? p.tags : [])
    ].filter(Boolean).join(" ");
  }

  /* =============================
     FILTER STATE
  ============================= */
  let proSector = "all";
  let proRegion = "all";
  let qPro = "";

  /* =============================
     RENDER
  ============================= */
  function buildCard(p){
    const name = escapeHtml(p.display_name || "Partenaire");
    const city = escapeHtml(p.city || "");
    const trade = escapeHtml(p.trade || "");
    const bio = escapeHtml(p.bio || "");

    const sector = inferSector(p);
    const region = norm(p.region || "national");

    const badge = escapeHtml(p.badge || "");
    const photo = p.photo_url || "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80";
    const whatsapp = p.whatsapp || p.phone || "";
    const profileUrl = p.profile_url || "";

    const fallbackPay = "https://beauville.github.io/commencer-a-payer/?module=BUILD&offre=BUILD";
    const viewHref = profileUrl ? profileUrl : fallbackPay;

    const tags = Array.isArray(p.tags) ? p.tags.slice(0,6) : [];
    const kw = norm(safeText(p));

    const waMsg = `Salam ${p.display_name || "frérot"}, je viens de DIGIY BUILD. Je veux parler d’un chantier.`;
    const canCall = !!(p.phone || p.whatsapp);

    return `
    <article class="p-card"
      data-cat="${escapeHtml(sector)}"
      data-region="${escapeHtml(region)}"
      data-keywords="${escapeHtml(kw)}">
      <div class="p-thumb">
        ${badge ? `<div class="p-badge">${badge}</div>` : `<div class="p-badge">✅ Partenaire BUILD</div>`}
        <img src="${escapeHtml(photo)}" alt="${name}" loading="lazy" decoding="async"/>
      </div>
      <div class="p-body">
        <div class="p-title">👷 ${name}</div>
        <div class="p-meta">${city ? `📍 ${city}` : `📍 ${regionLabel(region)}`}</div>
        <div class="p-desc">${trade || bio || "Artisan partenaire DIGIY BUILD — contact direct."}</div>

        <div class="p-tags">
          <span class="tag trade">${sectorLabel(sector)}</span>
          <span class="tag zone">${regionLabel(region)}</span>
          ${tags.map(t => `<span class="tag">${escapeHtml(String(t))}</span>`).join("")}
        </div>
      </div>
      <div class="p-foot">
        ${
          whatsapp
            ? `<a class="btn whatsapp" href="${waLink(whatsapp, waMsg)}" target="_blank" rel="noopener">💬 WhatsApp</a>`
            : `<a class="btn whatsapp" href="${fallbackPay}" target="_blank" rel="noopener">💬 WhatsApp</a>`
        }
        <a class="btn view" href="${escapeHtml(viewHref)}" target="_blank" rel="noopener">🔎 Voir la fiche</a>
        ${canCall ? `<a class="btn call" href="tel:+${escapeHtml(cleanPhone(p.phone || p.whatsapp))}">📞 Appeler</a>` : ``}
      </div>
    </article>`;
  }

  function filterPros(){
    const cards = Array.from(document.querySelectorAll(".p-card"));
    const qq = norm(qPro);
    let visible = 0;

    cards.forEach(card => {
      const cat = norm(card.dataset.cat);
      const reg = norm(card.dataset.region);
      const txt = norm(card.dataset.keywords || "") + " " + norm(card.innerText || "");

      const okS = (proSector === "all" || cat === proSector);
      const okR = (proRegion === "all" || reg === proRegion);
      const okQ = (!qq || txt.includes(qq));

      const show = (okS && okR && okQ);
      card.style.display = show ? "block" : "none";
      if(show) visible++;
    });

    if($("statPros")) $("statPros").textContent = String(visible);
  }

  /* =============================
     EVENTS
  ============================= */
  function bindEvents(){
    document.querySelectorAll("[data-pro-sector]").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-pro-sector]").forEach(x => x.classList.remove("active"));
        btn.classList.add("active");
        proSector = btn.dataset.proSector;
        filterPros();
      });
    });

    document.querySelectorAll("[data-pro-region]").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-pro-region]").forEach(x => x.classList.remove("active"));
        btn.classList.add("active");
        proRegion = btn.dataset.proRegion;
        filterPros();
      });
    });

    const q = $("qPro");
    if(q){
      q.addEventListener("input", (e) => {
        qPro = e.target.value || "";
        filterPros();
      });
    }
  }

  /* =============================
     LOAD PROS (SUPABASE)
  ============================= */
  async function loadPros(){
    const grid = $("prosGrid");
    if(!grid) return;

    try{
      grid.innerHTML = `<div class="empty">Chargement des partenaires…</div>`;

      const { data, error } = await sb
        .from("digiy_build_public_profiles")
        .select("*")
        .eq("is_active", true)
        .eq("is_published", true)
        .order("priority", { ascending: true });

      if(error) throw error;

      const rows = Array.isArray(data) ? data : [];
      if(!rows.length){
        grid.innerHTML = `<div class="empty">Aucun partenaire pour le moment. Reviens bientôt ✨</div>`;
        if($("statPros")) $("statPros").textContent = "0";
        return;
      }

      grid.innerHTML = rows.map(buildCard).join("");
      if($("statPros")) $("statPros").textContent = String(rows.length);
      filterPros();

    }catch(e){
      console.warn("Erreur pros:", e?.message || e);
      grid.innerHTML = `<div class="empty">⚠️ Impossible de charger les partenaires pour l’instant.</div>`;
      if($("statPros")) $("statPros").textContent = "—";
    }
  }

  /* =============================
     STATS DEMANDES (optionnel)
  ============================= */
  async function loadStatsSafe(){
    try{
      const { data, error } = await sb.rpc("digiy_build_public_list_v1", { p_limit: 500 });
      if(error) throw error;
      if(Array.isArray(data) && $("statTotal")){
        $("statTotal").textContent = String(data.length);
      }
    }catch(e){
      console.warn("Stats demandes indisponibles:", e?.message || e);
      // on laisse —
    }
  }

  /* INIT */
  bindEvents();
  loadPros();
  loadStatsSafe();

})();
