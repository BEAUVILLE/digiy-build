-- DIGIY BUILD — correction définitive du moteur de recherche
-- À exécuter dans Supabase > SQL Editor.
-- Fixe la fiche officielle et force le rechargement de la carte récente.

begin;

alter table public.digiy_build_public_profiles
  add column if not exists profile_url text;

update public.digiy_build_public_profiles
set
  profile_url = 'https://mbaye-macon.digiylyfe.com/',
  photo_url = 'https://mbaye-macon.digiylyfe.com/carte-visite.png?v=20260714-v2',
  display_name = 'Mbaye Diouf'
where slug = 'partenaires-mbaye';

update public.digiy_build_public_profiles
set
  profile_url = 'https://kourant.digiylyfe.com/',
  photo_url = 'https://kourant.digiylyfe.com/carte-visite.png?v=20260714-v2',
  display_name = 'Kourant Électricien'
where slug = 'partenaires-kourant';

commit;

select
  slug,
  display_name,
  profile_url,
  photo_url,
  whatsapp
from public.digiy_build_public_profiles
where slug in ('partenaires-mbaye', 'partenaires-kourant')
order by slug;
