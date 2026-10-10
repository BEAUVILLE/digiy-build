# DIGIY BUILD V5 — Ouvrir la porte des cinq propriétaires réels

## Décision du 10 octobre 2026

**N'attribuer aucune identité Auth sur la seule base du nom, du numéro WhatsApp, de la profession, d'un slug ou d'une ancienne valeur UUID.**

La fiche publique et le compte propriétaire sont des objets différents. Notre objectif est : **dossier validé → email accepté par le vrai professionnel → compte Supabase Auth actif → propriétaire relié en CORE → magic link testé → tiers refusé**.

### État réel des cinq fiches prioritaires

| Slug exact dans CORE | État vitrine | État d'accès propriétaire |
|---|---|---|
| `babacar-plombier-pro` | active / publiée | `owner_id` absent |
| `mane-gning-nettoyage` | active / publiée | `owner_id` absent |
| `partenaires-kourant` | active / publiée | `owner_id` absent |
| `partenaires-mbaye` | active / publiée | `owner_id` absent |
| `helage-plombier` | active / publiée | ancien `owner_id` non présent dans `auth.users` |

Le registre d'adhésion `digiy_adhesion_requests` contient un dossier validé sous le slug **différent** `babakar-plombier-saly`, mais **sans email renseigné**. Ne pas conclure qu'il correspond nécessairement au profil `babacar-plombier-pro` sans contrôle terrain.

## Vérification dossier par dossier

1. Le titulaire ou son mandataire fournit l'**email qu'il souhaite réellement utiliser**. L'atelier vérifie cette attribution dans le dossier privé approuvé, et note une référence de validation OPS sans email dans GitHub.
2. Dans [Supabase Authentication → Users](https://supabase.com/dashboard/project/wesqmwjjtsefyjnluosj/auth/users), vérifier qu'il existe un compte sous cet email. Si absent : inviter/créer le compte via les fonctions **Admin Auth** et le circuit de validation de l'atelier ; **jamais** générer soi-même un UUID ni rendre `shouldCreateUser:true` côté navigateur. Attendre que l'email Auth soit effectivement confirmé.
3. Récupérer le fichier [BUILD_OWNER_IDENTITY_BIND_V5_MANUAL.sql](../supabase/ops/BUILD_OWNER_IDENTITY_BIND_V5_MANUAL.sql) et l'ouvrir **uniquement dans Supabase SQL Editor avec le compte OPS autorisé**. Le fichier ne doit pas être exécuté en CI contre CORE.
4. Remplacer **dans l'éditeur privé uniquement** : `v_slug`, `v_owner_email`, `v_approval_reference` (référence interne, non personnelle), puis `v_ownership_proved := true`. Pour `helage-plombier`, renseigner exactement l'ancien `owner_id` comme `v_expected_previous_owner` après avoir constaté sa valeur dans le dossier. Garder `NULL` pour les autres.
5. Laisser d'abord **`v_execute := false`**. Exécuter. Le résultat attendu est le NOTICE `PREVIEW OK`. Si le compte Auth n'existe pas, n'est pas confirmé, appartient déjà à une autre fiche BUILD active ou si la fiche a été modifiée, la transaction est refusée.
6. Seulement avec la preuve de propriété et un `PREVIEW OK`, passer à **`v_execute := true`** et réexécuter. L'UPDATE est limité à un seul slug et au propriétaire précédent exact ; un journal privé est créé dans `private.digiy_build_owner_link_audit_v1` avec l'UID précédent/nouveau et la référence OPS. Aucun email dans le journal.
7. Contrôler `AUTH_VERIFIE` dans le SELECT final. Tester avec le véritable artisan en navigation privée sur l'accès correspondant :
   - `https://build.digiylyfe.com/acces-proprietaire-v3.html?site=babacar-plombier-pro&lang=fr`
   - `https://build.digiylyfe.com/acces-proprietaire-v3.html?site=mane-gning-nettoyage&lang=fr`
   - `https://build.digiylyfe.com/acces-proprietaire-v3.html?site=partenaires-kourant&lang=fr`
   - `https://build.digiylyfe.com/acces-proprietaire-v3.html?site=partenaires-mbaye&lang=fr`
   - `https://build.digiylyfe.com/acces-proprietaire-v3.html?site=helage-plombier&lang=fr`
8. Le titulaire vérifie que **son nom, ses prestations et ses demandes** correspondent et qu'il peut se déconnecter. Un **autre** compte doit rester refusé (RLS). Ne jamais utiliser ou divulguer le magic link privé ni son token pour les essais.
9. Répéter **un artisan à la fois**. Ne jamais attribuer les cinq à un même compte pour aller plus vite.

### Contrat de sécurité validé sur base PostgreSQL isolée

Les tests `tests/build-owner-identity-bind-v5.test.cjs` sur PostgreSQL testent :
- simulation par défaut sans UPDATE ni création d'une table d'audit ;
- refus d'email non confirmé, absent ou sans preuve humaine ;
- UPDATE unique quand les preuves et l'Auth existent, et log privé inaccessible aux rôles `anon`/`authenticated` ;
- refus de remplacer un UID historique de Hélage sans fournir sa valeur actuelle précise ;
- refus d'attribuer plusieurs fiches BUILD actives à un même compte tant que la gestion multi-fiches n'est pas traitée.

**Ce kit ne crée aucun compte et ne lie personne de lui-même.** Il prépare une liaison sûre lorsque les cinq adresses autorisées seront vérifiées par les vrais titulaires.

### Dossier à suivre

[Ticket BUILD #25](https://github.com/BEAUVILLE/digiy-build/issues/25). Ne pas publier dans le ticket les emails des artisans, les UUID internes, captures d'emails magiques, numéros privés ou pièces d'identité.

**Les fiches déjà publiées demeurent visibles.** Un propriétaire non relié ne peut pas obtenir ses données privées par simple ouverture de sa fiche.
