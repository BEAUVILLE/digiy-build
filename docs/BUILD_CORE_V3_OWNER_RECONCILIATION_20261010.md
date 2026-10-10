# DIGIY BUILD × CORE V2 — état réel et contrôle d'identité (10 octobre 2026)

L'application propriétaire authentifiée reste `gestion-build-v2.html`, reliée à `public.digiy_build_public_profiles`.

## Inventaire réel SQL, sans noms ni coordonnées

- `digiy_build_public_profiles` : **12** lignes, dont **6** `is_active=true AND is_published=true` et **8** ayant un `owner_id` non nul.
- `digiy_build_artisans` (historique) : **3** lignes, marquées `actif` et visibles en lecture anonyme.
- `digiy_build_demandes` : **1** demande existante ; aucune copie ni suppression.
- `digiy_build_requests`, `digiy_build_quotes` et `digiy_build_jobs` : **0** lignes lors du contrôle.

Ces tableaux ne doivent pas être fusionnés automatiquement. Le champ `owner_id` de l'ancien registre artisans est `text` ; celui des fiches modernes est `uuid`. Aucun rapprochement n'est vérifié par une simple coïncidence de slug, nom ou téléphone.

## Correction propriétaire V3

Le profil moderne est protégé par une policy restrictive RLS `digiy_owner_mfa_gate()`. L'atelier déclenchait auparavant sa découverte par `owner_id` lorsque le slug manquait **avant** de présenter le contrôle téléphone. L'ordre devient : session Auth validée → **vérification téléphone** → découverte éventuelle d'une seule fiche appartenant réellement à `auth.uid()` → accès gestion/devis/demandes. Aucun accès ni mutation si le contrôle téléphone est manquant ou refusé.

La demande client affectée reste privée et présentée en échappant ses champs. Aucune réservation, attestation TRUST ni avis n'est inféré d'une demande ou d'une mission marquée terminée.

## Prochaine étape CORE

Examiner la provenance des 3 anciens artisans et vérifier individuellement les 8 identifiants propriétaires présents dans le registre public moderne, sans créer de liens CORE avant contrôle Auth/provenance. Vérifier le parcours propriétaire sur téléphone réel. Le schéma `digiy_core_private` reste inaccessible aux clients.
