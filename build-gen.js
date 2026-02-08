(async function(){
  const loading = document.getElementById('loading');
  const app = document.getElementById('app');
  const form = document.getElementById('formArtisan');
  const successMsg = document.getElementById('successMsg');
  const btnBack = document.getElementById('btnBack');
  const btnRetour = document.getElementById('btnRetour');
  
  // ✅ 1. BOOT GUARD
  if(!window.DIGIY_GUARD || typeof window.DIGIY_GUARD.boot !== "function"){
    loading.innerHTML = '❌ Guard non chargé. <a href="pin.html" style="color:#facc15">Se connecter</a>';
    return;
  }

  const g = await window.DIGIY_GUARD.boot({ login: "pin.html" });
  
  if(!g?.ok){
    loading.innerHTML = '❌ Accès refusé. <a href="pin.html" style="color:#facc15">Se connecter</a>';
    return;
  }

  // ✅ 2. SESSION
  const sess = window.DIGIY_GUARD.getSession?.() || null;
  const ownerId = sess?.owner_id || null;
  const phone = sess?.phone || localStorage.getItem('DIGIY_PHONE') || '';
  const businessName = localStorage.getItem('DIGIY_BUSINESS_NAME') || '';

  if(!ownerId){
    loading.innerHTML = '❌ Session invalide. <a href="pin.html" style="color:#facc15">Se reconnecter</a>';
    return;
  }

  // ✅ 3. AUTO-FILL
  document.getElementById('nom_complet').value = businessName || '';
  document.getElementById('phone').value = phone || '';

  // ✅ 4. AFFICHE
  loading.style.display = 'none';
  app.style.display = 'block';

  // ✅ 5. NAVIGATION
  function goBack(){
    const url = window.DIGIY_GUARD?.withSlug ? window.DIGIY_GUARD.withSlug('./index.html') : './index.html';
    location.href = url;
  }

  btnBack.addEventListener('click', goBack);
  btnRetour.addEventListener('click', goBack);

  // ✅ 6. SUBMIT → DB
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = form.querySelector('.btn-generate');
    btn.disabled = true;
    btn.textContent = '⏳ Création en cours...';

    try {
      const sb = window.DIGIY_GUARD?.getSb?.();
      if(!sb) throw new Error("Supabase non initialisé");

      const formData = new FormData(form);
      
      // Slug auto
      const nom = formData.get('nom_complet').trim();
      const ville = formData.get('ville').trim();
      const specialite = formData.get('specialite') || 'artisan';
      const autoSlug = (nom + '-' + specialite + '-' + ville)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const payload = {
        owner_id: ownerId,
        nom_complet: nom,
        entreprise: formData.get('entreprise')?.trim() || null,
        phone: formData.get('phone').trim(),
        whatsapp: formData.get('phone').trim(),
        ville: ville,
        specialite: formData.get('specialite') || null,
        metiers: formData.get('metiers')?.trim() || null,
        annees_experience: formData.get('annees_experience') ? parseInt(formData.get('annees_experience')) : null,
        certification: formData.get('certification')?.trim() || null,
        zone_intervention: formData.get('zone_intervention')?.trim() || null,
        photo_profil: formData.get('photo_profil')?.trim() || null,
        photo_travaux: formData.get('photo_travaux')?.trim() ? [formData.get('photo_travaux').trim()] : null,
        tarif_horaire: formData.get('tarif_horaire') ? parseInt(formData.get('tarif_horaire')) : null,
        tarif_journee: formData.get('tarif_journee') ? parseInt(formData.get('tarif_journee')) : null,
        description: formData.get('description')?.trim() || null,
        nb_projets_realises: formData.get('nb_projets_realises') ? parseInt(formData.get('nb_projets_realises')) : 0,
        slug: autoSlug,
        status: 'actif',
        is_public: true,
        created_at: new Date().toISOString()
      };

      console.log('📤 Payload:', payload);

      const { data, error } = await sb
        .from('digiy_build_artisans')
        .insert(payload)
        .select()
        .single();

      if(error) throw error;

      console.log('✅ Fiche créée:', data);

      form.style.display = 'none';
      successMsg.classList.add('show');

    } catch(err) {
      console.error('❌ Erreur:', err);
      alert('❌ Erreur: ' + (err?.message || err));
      btn.disabled = false;
      btn.textContent = '🚀 CRÉER MA FICHE ARTISAN';
    }
  });

})();
