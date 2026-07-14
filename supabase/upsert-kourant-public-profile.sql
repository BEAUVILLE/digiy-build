-- DIGIY BUILD — Kourant Électricien
-- À exécuter dans Supabase > SQL Editor
-- Migration propre depuis l'ancien slug partenaires-zal-kourant.

begin;

-- 1) Si l'ancien profil existe et que le nouveau n'existe pas encore,
--    on transforme directement l'ancienne ligne pour préserver l'historique.
update public.digiy_build_public_profiles
set
  slug = 'partenaires-kourant',
  display_name = 'Kourant Électricien',
  trade = 'Électricien · installation · rénovation · dépannage',
  city = 'Saly',
  region = 'Petite Côte',
  sector = 'électricité',
  bio = 'Installation électrique neuve, rénovation, mise aux normes, tableaux, disjoncteurs, prises, éclairage, recherche de panne et dépannage.',
  photo_url = 'https://kourant.digiylyfe.com/carte-visite.png',
  whatsapp = '221772084781',
  phone = '+221772084781'
where slug = 'partenaires-zal-kourant'
  and not exists (
    select 1
    from public.digiy_build_public_profiles
    where slug = 'partenaires-kourant'
  );

-- 2) Mise à jour du profil Kourant s'il existe déjà.
update public.digiy_build_public_profiles
set
  display_name = 'Kourant Électricien',
  trade = 'Électricien · installation · rénovation · dépannage',
  city = 'Saly',
  region = 'Petite Côte',
  sector = 'électricité',
  bio = 'Installation électrique neuve, rénovation, mise aux normes, tableaux, disjoncteurs, prises, éclairage, recherche de panne et dépannage.',
  photo_url = 'https://kourant.digiylyfe.com/carte-visite.png',
  whatsapp = '221772084781',
  phone = '+221772084781'
where slug = 'partenaires-kourant';

-- 3) Création seulement si aucune ligne Kourant n'existe.
insert into public.digiy_build_public_profiles (
  slug,
  display_name,
  trade,
  city,
  region,
  sector,
  bio,
  photo_url,
  whatsapp,
  phone
)
select
  'partenaires-kourant',
  'Kourant Électricien',
  'Électricien · installation · rénovation · dépannage',
  'Saly',
  'Petite Côte',
  'électricité',
  'Installation électrique neuve, rénovation, mise aux normes, tableaux, disjoncteurs, prises, éclairage, recherche de panne et dépannage.',
  'https://kourant.digiylyfe.com/carte-visite.png',
  '221772084781',
  '+221772084781'
where not exists (
  select 1
  from public.digiy_build_public_profiles
  where slug = 'partenaires-kourant'
);

-- 4) Suppression d'un éventuel ancien doublon devenu inutile.
delete from public.digiy_build_public_profiles
where slug = 'partenaires-zal-kourant';

commit;

-- Contrôle final : une seule ligne Kourant doit apparaître.
select
  slug,
  display_name,
  trade,
  city,
  region,
  whatsapp,
  photo_url
from public.digiy_build_public_profiles
where slug = 'partenaires-kourant';
