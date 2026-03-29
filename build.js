// build.js
/* =============================================
   DIGIY BUILD — Clean Pack recousu
   - anti-doublon
   - exemples seulement si DB vide
   - DOM safe
   - clé publishable alignée
============================================= */

/* ✅ MODE */
const MODE = {
  debug: false,          // true => affiche le bloc debug
  showExamples: true,    // si DB vide, on garde les exemples visuels
  limit: 9999
};

/* ✅ CONFIG SUPABASE */
const SUPABASE_URL = "https://wesqmwjjtsefyjnluosj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_tGHItRgeWDmGjnd0CK1DVQ_BIep4Ug3";

const sb = window.supabase?.createClient
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

/* ✅ DOM */
const grid = document.getElementById("grid");
const debugEl = document.getElementById("debug");
const statsEl = document.getElementById("stats");

const qEl = document.getElementById("q");
const villeEl = document.getElementById("ville");
const specEl = document.getElementById("spec");
const resetEl = document.getElementById("reset");
const toggleDebugEl = document.getElementById("toggleDebug");

const TEAM_WA = "+221771342889";
const DEFAULT_PHOTO = "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800";

/* =============================================
   PLACEBOTS (EXEMPLES VISUELS)
============================================= */
const PLACEBOTS = [
  {
    id: "example-1",
    nom_complet: "Exemple: Moussa DIOP",
    entreprise: "EXEMPLE MAÇONNERIE",
    ville: "Dakar",
    specialite: "Maçonnerie",
    annees_experience: 15,
    photo_profil: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800",
    tarif_journee: 18000,
    description: "Ceci est un exemple visuel. Les vrais artisans ont un badge vert.",
    nb_projets_realises: 120,
    whatsapp: TEAM_WA,
    slug: "exemple-moussa-diop",
    _isExample: true
  },
  {
    id: "example-2",
    nom_complet: "Exemple: Ibrahima FALL",
    entreprise: "EXEMPLE PLOMBERIE",
    ville: "Thiès",
    specialite: "Plomberie",
    annees_experience: 10,
    photo_profil: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800",
    tarif_journee: 15000,
    description: "Ceci est un exemple visuel. Les vrais artisans ont un badge vert.",
    nb_projets_realises: 85,
    whatsapp: TEAM_WA,
    slug: "exemple-ibrahima-fall",
    _isExample: true
  },
  {
    id: "example-3",
    nom_complet: "Exemple: Abdoulaye SARR",
    entreprise: "EXEMPLE ÉLECTRICITÉ",
    ville: "Saly",
    specialite: "Électricité",
    annees_experience: 12,
    photo_profil: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800",
    tarif_journee: 16000,
    description: "Ceci est un exemple visuel. Les vrais artisans ont un badge vert.",
    nb_projets_realises: 95,
    whatsapp: TEAM_WA,
    slug: "exemple-abdoulaye-sarr",
    _isExample: true
  }
];

/* =============================================
   LIENS WORDPRESS DES FICHES
============================================= */
const FICHES_WORDPRESS = {
  "elage-plombier-saly": "https://orange-pig-270004.hostingersite.com/partenaires-helage-plombier/",
  "zal-kourant-electricien-saly": "https://orange-pig-270004.hostingersite.com/partenaires-zal-kourant/",
  "mbaye-diouf-entrepreneur-saly": "https://orange-pig-270004.hostingersite.com/partenaires-mbaye/"
};

/* =============================================
   STATE
============================================= */
let ALL = [];
let DB_COUNT = 0;
let EX_COUNT = 0;

/* =============================================
   UTILS
============================================= */
function escHtml(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function onlyDigitsPhone(phone){
  return String(phone ?? "").replace(/\D/g,"");
}

function normalizeText(s){
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .trim();
}

function moneyFCFA(n){
  const num = Number(n);
  if(!Number.isFinite(num) || num <= 0) return "Sur devis";
  return `${num.toLocaleString("fr-FR")} FCFA/jour`;
}

function uniqSorted(arr){
  return [...new Set(arr.filter(Boolean))].sort((a,b)=> String(a).localeCompare(String(b), "fr"));
}

function setDebug(html){
  if(!debugEl) return;
  if(!MODE.debug){
    debugEl.hidden = true;
    return;
  }
  debugEl.hidden = false;
  debugEl.innerHTML = html;
}

function toMs(value){
  const ms = new Date(value || 0).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function isRealArtisan(row){
  return row && row._isExample !== true;
}

function rowScore(row){
  if(!row) return 0;

  let score = 0;
  if(row.slug) score += 100;
  if(row.id) score += 70;
  if(row.public_url) score += 35;
  if(row.photo_profil) score += 20;
  if(row.description) score += Math.min(String(row.description).trim().length, 180);
  if(row.entreprise) score += 20;
  if(row.ville) score += 10;
  if(row.specialite) score += 10;
  if(row.whatsapp || row.phone) score += 20;
  if(row.nb_projets_realises) score += 8;
  if(row.annees_experience) score += 8;
  if(isRealArtisan(row)) score += 1000;

  return score;
}

function artisanKey(row, idx = 0){
  const slug = normalizeText(row?.slug || "");
  if(slug) return `slug:${slug}`;

  const id = normalizeText(row?.id || "");
  if(id) return `id:${id}`;

  const phone = onlyDigitsPhone(row?.whatsapp || row?.phone || "");
  const nom = normalizeText(row?.nom_complet || "");
  const ville = normalizeText(row?.ville || "");
  const spec = normalizeText(row?.specialite || "");

  const composite = [phone, nom, ville, spec].filter(Boolean).join("|");
  if(composite) return `composite:${composite}`;

  return `fallback:${idx}`;
}

function chooseBetterArtisan(a, b){
  if(!a) return b;
  if(!b) return a;

  const aReal = isRealArtisan(a);
  const bReal = isRealArtisan(b);
  if(aReal !== bReal) return bReal ? b : a;

  const aDate = Math.max(toMs(a.updated_at), toMs(a.created_at));
  const bDate = Math.max(toMs(b.updated_at), toMs(b.created_at));
  if(aDate !== bDate) return bDate > aDate ? b : a;

  return rowScore(b) > rowScore(a) ? b : a;
}

function dedupeArtisans(list){
  const rows = Array.isArray(list) ? list.filter(Boolean) : [];
  const map = new Map();

  rows.forEach((row, idx) => {
    const key = artisanKey(row, idx);
    map.set(key, chooseBetterArtisan(map.get(key), row));
  });

  return [...map.values()].sort((a, b) => {
    const aReal = isRealArtisan(a) ? 1 : 0;
    const bReal = isRealArtisan(b) ? 1 : 0;
    if(aReal !== bReal) return bReal - aReal;

    const aDate = Math.max(toMs(a.updated_at), toMs(a.created_at));
    const bDate = Math.max(toMs(b.updated_at), toMs(b.created_at));
    if(aDate !== bDate) return bDate - aDate;

    return normalizeText(a.nom_complet || "").localeCompare(normalizeText(b.nom_complet || ""), "fr");
  });
}

function safeUrl(url){
  const raw = String(url || "").trim();
  if(!raw) return null;

  try{
    return new URL(raw, window.location.href).href;
  }catch{
    return null;
  }
}

/* =============================================
   FETCH DATABASE
============================================= */
async function fetchArtisans(){
  if(!sb){
    setDebug("❌ Supabase non chargé.");
    return [];
  }

  try{
    setDebug("🔍 Chargement des artisans depuis la base…");

    const { data, error } = await sb
      .from("digiy_build_artisans")
      .select("*")
      .limit(MODE.limit);

    if(error){
      setDebug(`❌ Erreur base: ${escHtml(error.message)}`);
      return [];
    }

    const rawList = Array.isArray(data) ? data : [];
    const list = dedupeArtisans(rawList);

    setDebug(`
      ✅ Base connectée<br>
      📊 Lignes brutes: <strong>${rawList.length}</strong><br>
      🧹 Après anti-doublon: <strong>${list.length}</strong><br>
      ${list.length ? `📋 Noms: ${escHtml(list.map(a => a.nom_complet || "Sans nom").join(", "))}` : "⚠️ Aucun artisan en base"}
    `);

    return list;
  }catch(e){
    setDebug(`❌ Erreur connexion: ${escHtml(e.message || e)}`);
    return [];
  }
}

/* =============================================
   CARD TEMPLATE
============================================= */
function createCard(artisan){
  const isExample = artisan?._isExample === true;

  const nom = artisan?.nom_complet || "Artisan";
  const entreprise = artisan?.entreprise || "";
  const ville = artisan?.ville || "—";
  const spec = artisan?.specialite || "Multi-services";
  const photo = artisan?.photo_profil || DEFAULT_PHOTO;
  const tarif = artisan?.tarif_journee ? moneyFCFA(artisan.tarif_journee) : "Sur devis";
  const desc = artisan?.description || "Artisan professionnel. Contact direct.";
  const wa = artisan?.whatsapp || artisan?.phone || TEAM_WA;

  const exp = artisan?.annees_experience ? `${artisan.annees_experience} ans` : "";
  const projets = artisan?.nb_projets_realises ? `${artisan.nb_projets_realises} projets` : "";

  const cardClass = isExample ? "card example" : "card verified";

  const badges = isExample
    ? `
      <div class="badge badge-example">📸 APERÇU</div>
      <div class="badge badge-commission">0% commission</div>
    `
    : `
      <div class="badge badge-verified">✅ PARTENAIRE BUILD</div>
      <div class="badge badge-commission">0% commission</div>
      ${exp ? `<div class="badge badge-info">${escHtml(exp)}</div>` : ""}
      ${projets ? `<div class="badge badge-info">${escHtml(projets)}</div>` : ""}
    `;

  const ficheUrl = safeUrl(FICHES_WORDPRESS[artisan?.slug] || artisan?.public_url || "");
  const safeNom = escHtml(nom);
  const safeEntreprise = escHtml(entreprise);
  const safeVille = escHtml(ville);
  const safeSpec = escHtml(spec);
  const safeDesc = escHtml(desc);
  const safeId = escHtml(artisan?.id || "");
  const safeWa = escHtml(wa);

  const primaryButton = (ficheUrl && !isExample)
    ? `<a href="${ficheUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">👁️ Voir la fiche complète</a>`
    : `<button class="btn btn-primary" data-action="devis" data-id="${safeId}" data-nom="${safeNom}">📋 Demander un devis</button>`;

  return `
    <article class="${cardClass}">
      <div class="photo">
        <img src="${escHtml(photo)}" alt="${safeNom}" loading="lazy"
             onerror="this.src='${DEFAULT_PHOTO}'">
      </div>

      <div class="name">${safeNom}</div>
      ${entreprise ? `<div class="entreprise">${safeEntreprise}</div>` : ""}
      <div class="type">${safeSpec} • ${safeVille}</div>

      <div class="badges">${badges}</div>

      <div class="desc">${safeDesc}</div>
      <div class="tarif">Tarif: ${escHtml(tarif)}</div>

      <div class="actions">
        ${primaryButton}
        <button class="btn btn-wa" data-action="wa" data-phone="${safeWa}" data-nom="${safeNom}">
          📲 WhatsApp direct
        </button>
      </div>
    </article>
  `;
}

/* =============================================
   ACTIONS
============================================= */
function contacterWA(phone, nom){
  const msg = `Bonjour ${nom}, je souhaite un devis pour des travaux via DIGIY BUILD.`;
  const digits = onlyDigitsPhone(phone) || onlyDigitsPhone(TEAM_WA);
  const url = `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function demanderDevis(id, nom){
  if(String(id || "").startsWith("example-") || !id){
    contacterWA(TEAM_WA, "l'équipe DIGIY");
    return;
  }

  location.href = `./request.html?artisan_id=${encodeURIComponent(id)}&nom=${encodeURIComponent(nom)}`;
}

/* Délégation d’événements */
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if(!btn) return;

  const action = btn.getAttribute("data-action");

  if(action === "wa"){
    const phone = btn.getAttribute("data-phone");
    const nom = btn.getAttribute("data-nom");
    contacterWA(phone, nom);
  }

  if(action === "devis"){
    const id = btn.getAttribute("data-id");
    const nom = btn.getAttribute("data-nom");
    demanderDevis(id, nom);
  }
});

/* =============================================
   FILTERS
============================================= */
function setSelectOptions(el, values, placeholder){
  if(!el) return;
  el.innerHTML =
    `<option value="">${placeholder}</option>` +
    values.map(v => `<option value="${escHtml(v)}">${escHtml(v)}</option>`).join("");
}

function computeOptions(list){
  const villes = uniqSorted(list.map(a => a?.ville).filter(v => v && String(v).trim() && !String(v).startsWith("—")));
  const specs = uniqSorted(list.map(a => a?.specialite).filter(Boolean));

  setSelectOptions(villeEl, villes, "Toutes");
  setSelectOptions(specEl, specs, "Toutes");
}

function applyFilters(){
  const q = normalizeText(qEl?.value || "");
  const v = villeEl?.value || "";
  const s = specEl?.value || "";

  const filtered = ALL.filter((a) => {
    if(v && String(a?.ville || "") !== v) return false;
    if(s && String(a?.specialite || "") !== s) return false;

    if(!q) return true;

    const hay = normalizeText([
      a?.nom_complet,
      a?.entreprise,
      a?.ville,
      a?.specialite,
      a?.description,
      a?.zone_intervention,
      a?.metiers
    ].filter(Boolean).join(" "));

    return hay.includes(q);
  });

  renderGrid(filtered);
  renderStats(filtered.length);
}

function renderStats(currentCount){
  if(!statsEl) return;
  const txt = `${currentCount} affichés • ${DB_COUNT} vérifiés • ${EX_COUNT} exemples`;
  statsEl.textContent = txt;
}

/* =============================================
   RENDER
============================================= */
function renderGrid(list){
  if(!grid) return;

  if(!list.length){
    grid.innerHTML = `<div class="loading">❌ Aucun artisan ne correspond</div>`;
    return;
  }

  grid.innerHTML = list.map(createCard).join("");
}

/* =============================================
   INIT
============================================= */
async function init(){
  if(!grid){
    console.warn("[DIGIY BUILD] Élément #grid introuvable.");
    return;
  }

  grid.innerHTML = `<div class="loading">⏳ Chargement des artisans…</div>`;

  if(toggleDebugEl){
    toggleDebugEl.addEventListener("click", () => {
      MODE.debug = !MODE.debug;
      if(debugEl){
        debugEl.hidden = !MODE.debug;
        if(!MODE.debug) debugEl.innerHTML = "";
      }
    });
  }

  if(resetEl){
    resetEl.addEventListener("click", () => {
      if(qEl) qEl.value = "";
      if(villeEl) villeEl.value = "";
      if(specEl) specEl.value = "";
      applyFilters();
    });
  }

  if(qEl) qEl.addEventListener("input", applyFilters);
  if(villeEl) villeEl.addEventListener("change", applyFilters);
  if(specEl) specEl.addEventListener("change", applyFilters);

  const dbArtisans = await fetchArtisans();
  DB_COUNT = dbArtisans.length;

  const examples = (MODE.showExamples && DB_COUNT === 0) ? PLACEBOTS : [];
  EX_COUNT = examples.length;

  ALL = dedupeArtisans([...dbArtisans, ...examples]);

  computeOptions(ALL);
  renderGrid(ALL);
  renderStats(ALL.length);

  if(MODE.debug && debugEl){
    debugEl.hidden = false;
    debugEl.innerHTML += `<br>✅ Total affiché: <strong>${ALL.length}</strong> (${DB_COUNT} vérifiés + ${EX_COUNT} exemples)`;
  }
}

init();
