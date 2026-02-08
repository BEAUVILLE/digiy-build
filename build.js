// build.js
/* =============================================
   DIGIY BUILD — Clean Pack (CSS/JS séparés)
============================================= */

/* ✅ MODE */
const MODE = {
  debug: false,        // true => affiche le bloc debug
  showExamples: true,  // si DB vide, on garde les exemples visuels
  limit: 9999
};

/* ✅ CONFIG SUPABASE */
const SUPABASE_URL = "https://wesqmwjjtsefyjnluosj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indlc3Ftd2pqdHNlZnlqbmx1b3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNzg4ODIsImV4cCI6MjA4MDc1NDg4Mn0.dZfYOc2iL2_wRYL3zExZFsFSBK6AbMeOid2LrIjcTdA";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    .normalize("NFD").replace(/[\u0300-\u036f]/g,""); // retire accents
}

function moneyFCFA(n){
  try{
    return `${Number(n).toLocaleString("fr-FR")} FCFA/jour`;
  }catch{
    return "Sur devis";
  }
}

function uniqSorted(arr){
  return [...new Set(arr.filter(Boolean))].sort((a,b)=>a.localeCompare(b, "fr"));
}

function setDebug(html){
  if(!MODE.debug){
    debugEl.hidden = true;
    return;
  }
  debugEl.hidden = false;
  debugEl.innerHTML = html;
}

/* =============================================
   FETCH DATABASE
============================================= */
async function fetchArtisans(){
  try{
    setDebug("🔍 Fetching artisans from DB…");

    const { data, error } = await sb
      .from("digiy_build_artisans")
      .select("*")
      .limit(MODE.limit);

    if(error){
      setDebug(`❌ Erreur DB: ${escHtml(error.message)}`);
      return [];
    }

    const list = Array.isArray(data) ? data : [];
    setDebug(`
      ✅ Base de données connectée<br>
      📊 Artisans en DB: <strong>${list.length}</strong><br>
      ${list.length ? `📋 Noms: ${escHtml(list.map(a => a.nom_complet).join(", "))}` : "⚠️ Aucun artisan en DB"}
    `);

    return list;
  }catch(e){
    setDebug(`❌ Erreur connexion: ${escHtml(e.message)}`);
    return [];
  }
}

/* =============================================
   CARD TEMPLATE
============================================= */
function createCard(artisan){
  const isExample = artisan._isExample === true;

  const nom = artisan.nom_complet || "Artisan";
  const entreprise = artisan.entreprise || "";
  const ville = artisan.ville || "—";
  const spec = artisan.specialite || "Multi-services";
  const photo = artisan.photo_profil || "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800";
  const tarif = artisan.tarif_journee ? moneyFCFA(artisan.tarif_journee) : "Sur devis";
  const desc = artisan.description || "Artisan professionnel. Contact direct.";
  const wa = artisan.whatsapp || artisan.phone || TEAM_WA;

  const exp = artisan.annees_experience ? `${artisan.annees_experience} ans` : "";
  const projets = artisan.nb_projets_realises ? `${artisan.nb_projets_realises} projets` : "";

  const cardClass = isExample ? "card example" : "card verified";

  const badges = isExample
    ? `
      <div class="badge badge-example">📸 EXEMPLE</div>
      <div class="badge badge-commission">0% commission</div>
    `
    : `
      <div class="badge badge-verified">✅ VÉRIFIÉ</div>
      <div class="badge badge-commission">0% commission</div>
      ${exp ? `<div class="badge badge-info">${escHtml(exp)}</div>` : ""}
      ${projets ? `<div class="badge badge-info">${escHtml(projets)}</div>` : ""}
    `;

  // ✅ BOUTON FICHE OU DEVIS
  const ficheUrl = FICHES_WORDPRESS[artisan.slug] || artisan.public_url || null;

  const safeNom = escHtml(nom);
  const safeEntreprise = escHtml(entreprise);
  const safeVille = escHtml(ville);
  const safeSpec = escHtml(spec);
  const safeDesc = escHtml(desc);

  const primaryButton = (ficheUrl && !isExample)
    ? `<a href="${ficheUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
         👁️ Voir la fiche complète
       </a>`
    : `<button class="btn btn-primary" data-action="devis" data-id="${escHtml(artisan.id)}" data-nom="${safeNom}">
         📋 Demander un devis
       </button>`;

  return `
    <article class="${cardClass}">
      <div class="photo">
        <img src="${photo}" alt="${safeNom}" loading="lazy"
             onerror="this.src='https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800'">
      </div>

      <div class="name">${safeNom}</div>
      ${entreprise ? `<div class="entreprise">${safeEntreprise}</div>` : ""}
      <div class="type">${safeSpec} • ${safeVille}</div>

      <div class="badges">${badges}</div>

      <div class="desc">${safeDesc}</div>
      <div class="tarif">Tarif: ${escHtml(tarif)}</div>

      <div class="actions">
        ${primaryButton}
        <button class="btn btn-wa" data-action="wa" data-phone="${escHtml(wa)}" data-nom="${safeNom}">
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
  const digits = onlyDigitsPhone(phone);
  const url = `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function demanderDevis(id, nom){
  if(String(id).startsWith("example-")){
    contacterWA(TEAM_WA, "l'équipe DIGIY");
    return;
  }
  location.href = `./request.html?artisan_id=${encodeURIComponent(id)}&nom=${encodeURIComponent(nom)}`;
}

/* Délégation d’événements (plus clean que onclick inline) */
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
let ALL = [];
let DB_COUNT = 0;
let EX_COUNT = 0;

function computeOptions(list){
  const villes = uniqSorted(list.map(a => a.ville).filter(v => v && !String(v).startsWith("—")));
  const specs  = uniqSorted(list.map(a => a.specialite));

  // Fill selects
  villeEl.innerHTML = `<option value="">Toutes</option>` + villes.map(v => `<option value="${escHtml(v)}">${escHtml(v)}</option>`).join("");
  specEl.innerHTML  = `<option value="">Toutes</option>` + specs.map(s => `<option value="${escHtml(s)}">${escHtml(s)}</option>`).join("");
}

function applyFilters(){
  const q = normalizeText(qEl.value);
  const v = villeEl.value;
  const s = specEl.value;

  const filtered = ALL.filter(a => {
    if(v && String(a.ville || "") !== v) return false;
    if(s && String(a.specialite || "") !== s) return false;

    if(!q) return true;
    const hay = normalizeText(
      `${a.nom_complet||""} ${a.entreprise||""} ${a.ville||""} ${a.specialite||""} ${a.description||""}`
    );
    return hay.includes(q);
  });

  renderGrid(filtered);
  renderStats(filtered.length);
}

function renderStats(currentCount){
  const txt = `${currentCount} affichés • ${DB_COUNT} vérifiés • ${EX_COUNT} exemples`;
  statsEl.textContent = txt;
}

/* =============================================
   RENDER
============================================= */
function renderGrid(list){
  if(!list.length){
    grid.innerHTML = `<div class="loading">❌ Aucun artisan ne correspond</div>`;
    return;
  }
  grid.innerHTML = list.map(a => createCard(a)).join("");
}

async function init(){
  grid.innerHTML = `<div class="loading">⏳ Chargement des artisans…</div>`;

  // Toggle debug
  toggleDebugEl.addEventListener("click", () => {
    MODE.debug = !MODE.debug;
    debugEl.hidden = !MODE.debug;
    if(!MODE.debug) debugEl.innerHTML = "";
  });

  // Reset
  resetEl.addEventListener("click", () => {
    qEl.value = "";
    villeEl.value = "";
    specEl.value = "";
    applyFilters();
  });

  // Listen filters
  qEl.addEventListener("input", applyFilters);
  villeEl.addEventListener("change", applyFilters);
  specEl.addEventListener("change", applyFilters);

  const dbArtisans = await fetchArtisans();
  DB_COUNT = dbArtisans.length;

  const examples = MODE.showExamples ? PLACEBOTS : [];
  EX_COUNT = examples.length;

  ALL = [...dbArtisans, ...examples];

  // Options calculées sur tout (DB + exemples) pour avoir Dakar/Thiès/Saly etc direct
  computeOptions(ALL);

  // First render
  renderGrid(ALL);
  renderStats(ALL.length);

  // Si debug, on complète une ligne utile
  if(MODE.debug){
    debugEl.hidden = false;
    debugEl.innerHTML += `<br>✅ Total affiché: <strong>${ALL.length}</strong> (${DB_COUNT} vérifiés + ${EX_COUNT} exemples)`;
  }
}

init();
