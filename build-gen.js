(async function(){
  const loading = document.getElementById("loading");
  const app = document.getElementById("app");
  const form = document.getElementById("formArtisan");
  const successMsg = document.getElementById("successMsg");
  const btnBack = document.getElementById("btnBack");
  const btnRetour = document.getElementById("btnRetour");

  const TXT = {
    guardMissing: '❌ Accès indisponible. <a href="pin.html" style="color:#facc15">Se connecter</a>',
    denied: '❌ Accès refusé. <a href="pin.html" style="color:#facc15">Se connecter</a>',
    invalidSession: '❌ Session invalide. <a href="pin.html" style="color:#facc15">Se reconnecter</a>',
    booting: "🔒 Vérification accès...",
    saving: "⏳ Enregistrement...",
    createCta: "🚀 CRÉER MA FICHE ARTISAN",
    updateCta: "💾 METTRE À JOUR MA FICHE",
    created: "✅ Ta fiche a bien été créée.",
    updated: "✅ Ta fiche a bien été mise à jour."
  };

  function setLoading(html){
    if(loading) loading.innerHTML = html;
  }

  function showApp(){
    if(loading) loading.style.display = "none";
    if(app) app.style.display = "block";
  }

  function hideApp(){
    if(app) app.style.display = "none";
  }

  function onlyDigits(v){
    return String(v || "").replace(/\D/g, "");
  }

  function esc(s){
    return String(s ?? "")
      .replace(/[&<>"']/g, (m) => ({
        "&":"&amp;",
        "<":"&lt;",
        ">":"&gt;",
        '"':"&quot;",
        "'":"&#39;"
      }[m]));
  }

  function cleanText(v){
    return String(v || "").trim();
  }

  function parseIntOrNull(v){
    const n = parseInt(String(v ?? "").trim(), 10);
    return Number.isFinite(n) ? n : null;
  }

  function slugify(v){
    return String(v || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-");
  }

  function safeUrl(path){
    try{
      return new URL(path, location.href).href;
    }catch{
      return path;
    }
  }

  function goBack(){
    const url = window.DIGIY_GUARD?.withSlug
      ? window.DIGIY_GUARD.withSlug("./index.html")
      : "./index.html";
    location.href = url;
  }

  function getGuardSession(){
    return window.DIGIY_GUARD?.getSession?.() || null;
  }

  function getGuardState(){
    return window.DIGIY_GUARD?.state || null;
  }

  function resolveIdentity(){
    const sess = getGuardSession();
    const state = getGuardState();

    const slug =
      sess?.slug ||
      state?.slug ||
      new URLSearchParams(location.search).get("slug") ||
      localStorage.getItem("digiy_build_last_slug") ||
      localStorage.getItem("DIGIY_LAST_SLUG") ||
      "";

    const phone =
      sess?.phone ||
      state?.phone ||
      localStorage.getItem("digiy_build_phone") ||
      localStorage.getItem("DIGIY_PHONE") ||
      "";

    const ownerId =
      sess?.owner_id ||
      sess?.user_id ||
      sess?.user?.id ||
      state?.owner_id ||
      state?.user_id ||
      null;

    return {
      sess,
      state,
      slug: cleanText(slug),
      phone: cleanText(phone),
      ownerId
    };
  }

  function buildAutoSlug(formData, identity){
    const nom = cleanText(formData.get("nom_complet"));
    const ville = cleanText(formData.get("ville"));
    const specialite = cleanText(formData.get("specialite")) || "artisan";

    const base = [nom, specialite, ville].filter(Boolean).join("-");
    const generated = slugify(base);

    if(generated) return generated;
    if(identity.slug) return identity.slug;
    if(identity.phone) return `build-${onlyDigits(identity.phone)}`;
    return `build-fiche-${Date.now()}`;
  }

  function makePayload(formData, identity){
    const nom = cleanText(formData.get("nom_complet"));
    const ville = cleanText(formData.get("ville"));
    const phoneInput = cleanText(formData.get("phone")) || cleanText(identity.phone);
    const whatsappDigits = onlyDigits(phoneInput);

    const payload = {
      owner_id: identity.ownerId || null,
      nom_complet: nom || null,
      entreprise: cleanText(formData.get("entreprise")) || null,
      phone: phoneInput || null,
      whatsapp: whatsappDigits || null,
      ville: ville || null,
      specialite: cleanText(formData.get("specialite")) || null,
      metiers: cleanText(formData.get("metiers")) || null,
      annees_experience: parseIntOrNull(formData.get("annees_experience")),
      certification: cleanText(formData.get("certification")) || null,
      zone_intervention: cleanText(formData.get("zone_intervention")) || null,
      photo_profil: cleanText(formData.get("photo_profil")) || null,
      photo_travaux: cleanText(formData.get("photo_travaux"))
        ? [cleanText(formData.get("photo_travaux"))]
        : null,
      tarif_horaire: parseIntOrNull(formData.get("tarif_horaire")),
      tarif_journee: parseIntOrNull(formData.get("tarif_journee")),
      description: cleanText(formData.get("description")) || null,
      nb_projets_realises: parseIntOrNull(formData.get("nb_projets_realises")) ?? 0,
      slug: buildAutoSlug(formData, identity),
      status: "actif",
      is_public: true
    };

    return payload;
  }

  async function findExistingArtisan(sb, identity, payload){
    const candidates = [];

    if(payload.slug){
      candidates.push(
        sb.from("digiy_build_artisans")
          .select("*")
          .eq("slug", payload.slug)
          .limit(1)
      );
    }

    if(identity.ownerId){
      candidates.push(
        sb.from("digiy_build_artisans")
          .select("*")
          .eq("owner_id", identity.ownerId)
          .order("created_at", { ascending: false })
          .limit(1)
      );
    }

    if(payload.phone){
      candidates.push(
        sb.from("digiy_build_artisans")
          .select("*")
          .eq("phone", payload.phone)
          .order("created_at", { ascending: false })
          .limit(1)
      );
    }

    if(payload.whatsapp){
      candidates.push(
        sb.from("digiy_build_artisans")
          .select("*")
          .eq("whatsapp", payload.whatsapp)
          .order("created_at", { ascending: false })
          .limit(1)
      );
    }

    for(const query of candidates){
      const { data, error } = await query;
      if(error) continue;
      if(Array.isArray(data) && data.length) return data[0];
    }

    return null;
  }

  function setPrimaryButtonLabel(existing){
    if(!form) return;
    const btn = form.querySelector(".btn-generate");
    if(!btn) return;
    btn.textContent = existing ? TXT.updateCta : TXT.createCta;
  }

  async function prefillExistingIfAny(sb, identity){
    const probe = {
      slug: identity.slug || null,
      phone: identity.phone || null,
      whatsapp: onlyDigits(identity.phone) || null
    };

    const existing = await findExistingArtisan(sb, identity, probe);
    if(!existing) return null;

    const map = {
      nom_complet: existing.nom_complet,
      entreprise: existing.entreprise,
      phone: existing.phone,
      ville: existing.ville,
      specialite: existing.specialite,
      metiers: existing.metiers,
      annees_experience: existing.annees_experience,
      certification: existing.certification,
      zone_intervention: existing.zone_intervention,
      tarif_horaire: existing.tarif_horaire,
      tarif_journee: existing.tarif_journee,
      description: existing.description,
      nb_projets_realises: existing.nb_projets_realises,
      photo_profil: existing.photo_profil,
      photo_travaux: Array.isArray(existing.photo_travaux) ? existing.photo_travaux[0] : ""
    };

    Object.entries(map).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if(!el) return;
      el.value = value ?? "";
    });

    setPrimaryButtonLabel(true);
    return existing;
  }

  if(!loading || !app || !form){
    console.error("[DIGIY BUILD] DOM incomplet.");
    return;
  }

  setLoading(TXT.booting);
  hideApp();

  if(!window.DIGIY_GUARD || typeof window.DIGIY_GUARD.boot !== "function"){
    setLoading(TXT.guardMissing);
    return;
  }

  let boot;
  try{
    boot = await window.DIGIY_GUARD.boot({ login: "pin.html" });
  }catch(err){
    console.error("[DIGIY BUILD] Erreur boot guard:", err);
    setLoading(TXT.guardMissing);
    return;
  }

  if(!boot?.ok){
    setLoading(TXT.denied);
    return;
  }

  const identity = resolveIdentity();

  if(!identity.ownerId && !identity.phone && !identity.slug){
    setLoading(TXT.invalidSession);
    return;
  }

  const sb = window.DIGIY_GUARD?.getSb?.();
  if(!sb){
    setLoading('❌ Supabase non initialisé. <a href="pin.html" style="color:#facc15">Se reconnecter</a>');
    return;
  }

  const businessName =
    localStorage.getItem("DIGIY_BUSINESS_NAME") ||
    localStorage.getItem("digiy_build_business_name") ||
    "";

  const nomEl = document.getElementById("nom_complet");
  const phoneEl = document.getElementById("phone");

  if(nomEl && !nomEl.value) nomEl.value = businessName || "";
  if(phoneEl && !phoneEl.value) phoneEl.value = identity.phone || "";

  showApp();

  if(btnBack) btnBack.addEventListener("click", goBack);
  if(btnRetour) btnRetour.addEventListener("click", goBack);

  let existingArtisan = null;

  try{
    existingArtisan = await prefillExistingIfAny(sb, identity);
  }catch(err){
    console.warn("[DIGIY BUILD] Préchargement fiche KO:", err);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const btn = form.querySelector(".btn-generate");
    const oldLabel = btn ? btn.textContent : TXT.createCta;

    if(btn){
      btn.disabled = true;
      btn.textContent = TXT.saving;
    }

    try{
      const formData = new FormData(form);
      const payload = makePayload(formData, identity);

      if(!payload.nom_complet){
        throw new Error("Le nom est obligatoire.");
      }

      if(!payload.ville){
        throw new Error("La ville est obligatoire.");
      }

      if(!payload.phone && !payload.whatsapp){
        throw new Error("Le téléphone est obligatoire.");
      }

      if(!payload.specialite){
        throw new Error("Le métier principal est obligatoire.");
      }

      const existing = existingArtisan || await findExistingArtisan(sb, identity, payload);

      let result = null;
      let action = "created";

      if(existing?.id){
        const updatePayload = {
          ...payload,
          updated_at: new Date().toISOString()
        };

        if(!updatePayload.owner_id && existing.owner_id){
          updatePayload.owner_id = existing.owner_id;
        }

        const { data, error } = await sb
          .from("digiy_build_artisans")
          .update(updatePayload)
          .eq("id", existing.id)
          .select()
          .single();

        if(error) throw error;

        result = data;
        action = "updated";
      } else {
        const insertPayload = {
          ...payload,
          created_at: new Date().toISOString()
        };

        const { data, error } = await sb
          .from("digiy_build_artisans")
          .insert(insertPayload)
          .select()
          .single();

        if(error) throw error;

        result = data;
        action = "created";
      }

      existingArtisan = result || existingArtisan;

      form.style.display = "none";
      if(successMsg){
        const p = successMsg.querySelector("p");
        if(p){
          p.textContent = action === "updated"
            ? "Ta fiche a bien été mise à jour. Elle est prête pour la vitrine."
            : "Ta fiche est maintenant visible sur la vitrine publique.";
        }
        successMsg.classList.add("show");
      }

      console.log("[DIGIY BUILD] fiche enregistrée:", result);
    } catch(err) {
      console.error("[DIGIY BUILD] Erreur:", err);
      alert("❌ Erreur : " + (err?.message || err));
      if(btn){
        btn.disabled = false;
        btn.textContent = oldLabel || TXT.createCta;
      }
    }
  });
})();
