-- MASTER MAÎTRE DIGIY BUILD — V2
-- Autonomie propriétaire légère : prestations, zone, disponibilité uniquement.

alter table public.digiy_build_public_profiles enable row level security;

-- Exposition Data API explicite (Supabase 2026).
grant select on table public.digiy_build_public_profiles to anon, authenticated;

-- Retire l'UPDATE large historique.
revoke update on table public.digiy_build_public_profiles from anon, authenticated;

-- Le propriétaire authentifié ne peut modifier que ces trois colonnes.
grant update (services_text, zone, hub_badge)
on table public.digiy_build_public_profiles
to authenticated;

drop policy if exists "BUILD owner reads own profile v2"
on public.digiy_build_public_profiles;

create policy "BUILD owner reads own profile v2"
on public.digiy_build_public_profiles
for select
to authenticated
using ((select auth.uid()) = owner_id);

drop policy if exists "BUILD owner updates own profile v2"
on public.digiy_build_public_profiles;

create policy "BUILD owner updates own profile v2"
on public.digiy_build_public_profiles
for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);
