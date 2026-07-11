-- 0004_profiles_extended.sql, profil rencontre complet + photos.
--
-- Ajouts : identite (prenom, nom, ville), date de naissance avec
-- controle de majorite EN BASE (une app modifiee ne peut pas creer un
-- profil mineur), genre / recherche optionnels, photo de profil dans
-- Supabase Storage (bucket public en lecture, ecriture verrouillee au
-- dossier de l'utilisateur).

-- =====================================================================
-- Colonnes profil etendues.
-- =====================================================================
alter table public.community_profiles
  add column if not exists first_name text check (char_length(first_name) <= 40),
  add column if not exists last_name text check (char_length(last_name) <= 40),
  add column if not exists city text check (char_length(city) <= 60),
  add column if not exists birthdate date,
  add column if not exists gender text check (gender in ('femme', 'homme', 'autre')),
  add column if not exists looking_for text check (looking_for in ('femme', 'homme', 'peu importe')),
  add column if not exists photo_path text;

-- Majorite verifiee cote base : birthdate obligatoire <= aujourd'hui
-- moins 18 ans (quand renseignee ; l'app la rend obligatoire a la
-- creation, les anciens profils restent valides).
alter table public.community_profiles
  drop constraint if exists community_profiles_adult_birthdate;
alter table public.community_profiles
  add constraint community_profiles_adult_birthdate
  check (birthdate is null or birthdate <= (current_date - interval '18 years'));

-- =====================================================================
-- Bucket photos de profil.
-- Lecture publique (les photos de profil sont visibles dans l'app),
-- ecriture strictement limitee au dossier {user_id}/ de chacun.
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_read_public" on storage.objects;
create policy "avatars_read_public"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own_folder" on storage.objects;
create policy "avatars_insert_own_folder"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_update_own_folder" on storage.objects;
create policy "avatars_update_own_folder"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_delete_own_folder" on storage.objects;
create policy "avatars_delete_own_folder"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
