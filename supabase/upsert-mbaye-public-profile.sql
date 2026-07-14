-- DIGIY BUILD — Mbaye Diouf
-- À exécuter dans Supabase > SQL Editor
-- Cette requête crée Mbaye s'il n'existe pas et met à jour sa fiche sinon.

insert into public.digiy_build_public_profiles (
  slug,
  display_name,
  trade,
  sector,
  region,
  city,
  whatsapp,
  phone,
  photo_url,
  bio,
  profile_url,
  is_published,
  is_active,
  is_verified,
  priority,
  badge,
  price_label
)
values (
  'partenaires-mbaye',
  'Mbaye Diouf',
  'Bâtisseur · villas modernes · piscines · finitions haut de gamme',
  'construction',
  'Petite Côte',
  'Saly / Mbour / Thiès',
  '221776427113',
  '221776427113',
  'https://mbaye-macon.digiylyfe.com/carte-visite.png',
  'Construction de villas, piscines béton, finitions haut de gamme, rénovation et extensions. Devis après visite selon plans, surfaces, matériaux et délais.',
  'https://mbaye-macon.digiylyfe.com/',
  true,
  true,
  true,
  100,
  'Partenaire validé DIGIYLYFE',
  'Sur devis'
)
on conflict (slug) do update set
  display_name = excluded.display_name,
  trade = excluded.trade,
  sector = excluded.sector,
  region = excluded.region,
  city = excluded.city,
  whatsapp = excluded.whatsapp,
  phone = excluded.phone,
  photo_url = excluded.photo_url,
  bio = excluded.bio,
  profile_url = excluded.profile_url,
  is_published = excluded.is_published,
  is_active = excluded.is_active,
  is_verified = excluded.is_verified,
  priority = excluded.priority,
  badge = excluded.badge,
  price_label = excluded.price_label;

-- Contrôle final : cette requête doit retourner une ligne Mbaye publiée et active.
select
  slug,
  display_name,
  trade,
  city,
  region,
  phone,
  whatsapp,
  profile_url,
  photo_url,
  is_published,
  is_active,
  is_verified,
  priority
from public.digiy_build_public_profiles
where slug = 'partenaires-mbaye';
