# MASTER MAÎTRE DIGIY BUILD — V2

## Rôle
Moule universel DIGIYLYFE pour artisans et métiers terrain : plomberie, électricité, maçonnerie, entretien, dépannage, solaire, chantier et services pratiques.

BUILD reste une **présence professionnelle directe**.  
Ce MASTER ne devient ni un ERP, ni un logiciel de chantier, ni une caisse, ni un système de devis automatique, ni un système de paiement DIGIYLYFE.

## Doctrine
- contact direct avec l’artisan ;
- paiement direct à l’artisan ;
- 0 % commission DIGIYLYFE ;
- diagnostic, devis, matériaux, délais, tarifs, disponibilité et prestation restent sous la responsabilité de l’artisan ;
- aucun devis automatique ;
- aucune promesse automatique ;
- aucun paiement automatique ;
- DIGIYLYFE publie la présence numérique et relie le besoin à la bonne ressource.

## Autonomie propriétaire — magic link
Le propriétaire accède par email, sans mot de passe :
1. bouton public discret **🔐 Accès propriétaire** ;
2. `signInWithOtp` ;
3. `shouldCreateUser:false` ;
4. redirection vers `gestion-build-v2.html` ;
5. RLS propriétaire par `owner_id = auth.uid()`.

L’artisan peut modifier uniquement :
- ses prestations / savoir-faire ;
- sa zone d’intervention ;
- sa disponibilité affichée.

Le reste de la fiche reste sous contrôle atelier DIGIYLYFE afin d’éviter un logiciel lourd.

## Backend retenu
Réutilisation de `public.digiy_build_public_profiles`.

Champs utilisés par l’autonomie légère :
- `slug`
- `owner_id`
- `services_text`
- `specialties`
- `zone`
- `hub_badge`
- `display_name`
- `trade`
- `city`
- `whatsapp`
- `phone`
- `photo_url`
- `cover_url`
- `bio`
- `price_label`
- `is_published`
- `is_active`

Aucune nouvelle table n’est nécessaire pour V2.

## Sécurité
- clé publishable uniquement dans le navigateur ;
- aucun `service_role` ;
- RLS déjà active ;
- lecture publique limitée aux profils publiés/actifs par les politiques existantes ;
- ajout de lecture propriétaire sur sa propre ligne ;
- ajout d’UPDATE propriétaire avec `USING` + `WITH CHECK` ;
- UPDATE SQL limité aux colonnes éditables du MASTER ;
- aucun droit propriétaire sur `owner_id`, `slug`, statut, publication ou vérification.

## Langues
FR · EN · ES · PT · IT · DE · NL · AR.  
RTL automatique pour l’arabe.

## PWA
Le MASTER reste compatible avec la logique PWA DIGIYLYFE. La PWA de production sera raccordée au moment de la validation finale de l’instance.

## Règle atelier
1. Le site public BUILD actuel reste intact pendant la préparation.
2. Le MASTER V2 vit dans la branche `atelier-master-build-v2`.
3. Dans le coffre, `siteSlug="__MASTER__"` implique automatiquement le mode MASTER et `noindex,nofollow`.
4. Une instance ne configure que `siteSlug`.
5. Aucun prix, disponibilité, devis, matériau ou délai n’est inventé.
6. Tester magic link, retour fiche, RLS, modification prestations/zone/disponibilité, WhatsApp, mobile, 8 langues et RTL.
7. Publier seulement après validation humaine.

## Fichiers V2
- `master-v2.html`
- `gestion-build-v2.html`
- `supabase/master-build-v2-owner-rls.sql`
