-- DIGIY BUILD
-- Ferme l'INSERT public direct sur digiy_build_demandes.
-- Les nouvelles demandes doivent passer par le RPC
-- public.digiy_build_submit_request_v1.

drop policy if exists "Anyone can create a demande"
on public.digiy_build_demandes;
