-- DIGIY BUILD V5 — Lier UN vrai artisan à son compte Auth, après validation OPS.
-- Manuel, exclusivement Supabase SQL Editor avec un opérateur autorisé.
-- NE PAS lancer sur un utilisateur non vérifié. NE PAS remplacer les anciens UID au hasard.
-- PAR DÉFAUT : simulation avec ZERO INSERT/UPDATE/DDL (v_execute := false).
-- Toutes les données personnelles restent dans le SQL Editor, jamais dans GitHub.
-- Une seule fiche / transaction. Tester magic-link et RLS après opération.

BEGIN;
DO $digiy_build_owner_v5$
DECLARE
  v_slug text := '__CHOISIR_UN_DES_CINQ_SLUGS__';
  v_owner_email text := '__EMAIL_CONFIRME_PAR_ARTISAN__';
  v_approval_reference text := '__REFERENCE_CONTROLE_HUMAIN_PRIVE__';
  v_expected_previous_owner uuid := NULL; -- NULL pour 4 fiches sans propriétaire.
     -- POUR helage-plombier seulement : copier l'UID actuel exact après contrôle OPS.
  v_ownership_proved boolean := false; -- passer à true UNIQUEMENT après contrôle humain.
  v_execute boolean := false;          -- false = simulation ; true = modification + journal.
  v_uid uuid;
  v_user_count integer;
  v_prev_uid uuid;
  v_profile_active boolean;
  v_profile_published boolean;
  v_other_owner uuid;
  v_rows integer;
BEGIN
  IF current_user NOT IN ('postgres','supabase_admin') THEN
    RAISE EXCEPTION 'REFUS : seul un opérateur SQL administrateur peut rattacher un propriétaire';
  END IF;
  IF v_slug NOT IN (
    'babacar-plombier-pro',
    'mane-gning-nettoyage',
    'partenaires-kourant',
    'partenaires-mbaye',
    'helage-plombier'
  ) THEN
    RAISE EXCEPTION 'REFUS : slug non autorisé pour cette mission';
  END IF;
  IF left(v_owner_email,2)='__' OR btrim(v_owner_email) = ''
      OR position('@' in v_owner_email) < 2 THEN
    RAISE EXCEPTION 'REFUS : adresse email propriétaire non fournie/incorrecte';
  END IF;
  IF NOT v_ownership_proved THEN
    RAISE EXCEPTION 'REFUS : validation humaine identité et accord propriétaire manquants';
  END IF;
  IF left(v_approval_reference,2)='__' OR length(btrim(v_approval_reference)) < 15
      OR position('@' IN v_approval_reference) > 0 THEN
    RAISE EXCEPTION 'REFUS : preuve OPS insuffisante ou contenant une adresse email';
  END IF;

  SELECT count(*),min(id)
    INTO v_user_count,v_uid
  FROM auth.users
  WHERE lower(btrim(email))=lower(btrim(v_owner_email))
    AND email_confirmed_at IS NOT NULL
    AND deleted_at IS NULL
    AND coalesce(is_anonymous,false)=false
    AND (banned_until IS NULL OR banned_until < now());
  IF v_user_count <> 1 THEN
    RAISE EXCEPTION 'REFUS : aucun compte Auth unique, confirmé et actif pour cet email';
  END IF;

  SELECT owner_id,is_active,is_published
    INTO v_prev_uid,v_profile_active,v_profile_published
  FROM public.digiy_build_public_profiles
  WHERE slug=v_slug
  FOR UPDATE;
  IF NOT FOUND OR NOT coalesce(v_profile_active,false)
      OR NOT coalesce(v_profile_published,false) THEN
    RAISE EXCEPTION 'REFUS : fiche absente, inactive ou non publiée';
  END IF;
  IF v_prev_uid IS DISTINCT FROM v_expected_previous_owner THEN
    RAISE EXCEPTION 'REFUS : propriétaire changé depuis la préparation, nouvel audit requis';
  END IF;
  IF v_prev_uid IS NOT NULL AND v_prev_uid<>v_uid
      AND EXISTS(SELECT 1 FROM auth.users WHERE id=v_prev_uid) THEN
    RAISE EXCEPTION 'REFUS : fiche déjà reliée à un autre compte Auth existant';
  END IF;
  IF v_prev_uid IS NOT NULL AND v_prev_uid<>v_uid
      AND v_expected_previous_owner IS NULL THEN
    RAISE EXCEPTION 'REFUS : UID historique non contrôlé';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.digiy_build_public_profiles
    WHERE owner_id=v_uid AND slug<>v_slug AND is_active=true
  ) THEN
    RAISE EXCEPTION 'REFUS : cet utilisateur possède déjà une autre fiche BUILD active (multi-fiches non géré)';
  END IF;

  IF NOT v_execute THEN
    RAISE NOTICE 'PREVIEW OK : profil %, Auth unique vérifié, UID précédent conforme ; aucune modification', v_slug;
    RETURN;
  END IF;

  IF v_prev_uid IS NOT DISTINCT FROM v_uid THEN
    RAISE NOTICE 'DEJA RELIE : aucune modification pour %',v_slug;
    RETURN;
  END IF;

  -- Journal dans le schéma privé, non accessible à anon/authenticated.
  CREATE TABLE IF NOT EXISTS private.digiy_build_owner_link_audit_v1 (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_slug text NOT NULL,
    old_owner_uid uuid,
    new_owner_uid uuid NOT NULL,
    ops_reference text NOT NULL,
    db_operator text NOT NULL,
    linked_at timestamptz NOT NULL DEFAULT now()
  );
  ALTER TABLE private.digiy_build_owner_link_audit_v1 ENABLE ROW LEVEL SECURITY;
  REVOKE ALL ON private.digiy_build_owner_link_audit_v1 FROM PUBLIC, anon, authenticated;

  UPDATE public.digiy_build_public_profiles
  SET owner_id=v_uid,updated_at=now()
  WHERE slug=v_slug AND owner_id IS NOT DISTINCT FROM v_expected_previous_owner;
  GET DIAGNOSTICS v_rows=ROW_COUNT;
  IF v_rows<>1 THEN
    RAISE EXCEPTION 'REFUS : modification concurrente ou ligne introuvable';
  END IF;

  INSERT INTO private.digiy_build_owner_link_audit_v1
   (profile_slug,old_owner_uid,new_owner_uid,ops_reference,db_operator)
  VALUES (v_slug,v_prev_uid,v_uid,v_approval_reference,current_user);

  RAISE NOTICE 'LIAISON CONFIRMEE : profil %, journal privé écrit ; tester magic-link et accès tiers',v_slug;
END;
$digiy_build_owner_v5$;
COMMIT;

-- Contrôle READ ONLY après liaison : ne retourner que slug/statut, jamais email ou téléphone.
SELECT slug, is_active, is_published,
       CASE WHEN owner_id IS NULL THEN 'NON_ATTRIBUE'
            WHEN EXISTS(SELECT 1 FROM auth.users WHERE id=owner_id AND email_confirmed_at IS NOT NULL)
            THEN 'AUTH_VERIFIE'
            ELSE 'AUTH_INVALIDE' END AS etat_acces
FROM public.digiy_build_public_profiles
WHERE slug IN (
  'babacar-plombier-pro','mane-gning-nettoyage',
  'partenaires-kourant','partenaires-mbaye','helage-plombier'
)
ORDER BY slug;
