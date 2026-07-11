-- 0002_community.sql, pack communautaire : rencontres par feria,
-- fil de discussion, covoiturage.
--
-- Choix de design securite / moderation :
--  * PAS de messagerie interne : quand deux personnes se likent
--    mutuellement, on revele leur Instagram. La conversation part sur
--    Instagram, qui a deja la moderation, le blocage et le signalement.
--  * L'Instagram vit dans une table separee (profile_contacts) dont la
--    lecture n'est autorisee par RLS QUE si le like est mutuel.
--  * Tout le pack exige un compte (auth.uid()), et la creation de
--    profil impose une declaration 18+ (is_adult).

-- =====================================================================
-- community_profiles : le profil public (SANS contact).
-- =====================================================================
create table if not exists public.community_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  bio text check (char_length(bio) <= 200),
  -- Declaration majeur obligatoire pour apparaitre dans les rencontres.
  is_adult boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.community_profiles enable row level security;

-- Lisible par tout utilisateur connecte (c'est le principe d'un profil).
create policy "profiles_select_authenticated"
  on public.community_profiles for select
  to authenticated
  using (true);

create policy "profiles_insert_own"
  on public.community_profiles for insert
  with check (auth.uid() = user_id);

create policy "profiles_update_own"
  on public.community_profiles for update
  using (auth.uid() = user_id);

create policy "profiles_delete_own"
  on public.community_profiles for delete
  using (auth.uid() = user_id);

-- =====================================================================
-- profile_contacts : l'Instagram, revele UNIQUEMENT en cas de match.
-- =====================================================================
create table if not exists public.profile_contacts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  instagram text not null check (char_length(instagram) between 1 and 40)
);

alter table public.profile_contacts enable row level security;

-- Lecture : soi-meme, OU like mutuel (le match revele le contact).
create policy "contacts_select_match"
  on public.profile_contacts for select
  using (
    auth.uid() = user_id
    or (
      exists (
        select 1 from public.likes l1
        where l1.liker_id = auth.uid() and l1.liked_id = user_id
      )
      and exists (
        select 1 from public.likes l2
        where l2.liker_id = user_id and l2.liked_id = auth.uid()
      )
    )
  );

create policy "contacts_insert_own"
  on public.profile_contacts for insert
  with check (auth.uid() = user_id);

create policy "contacts_update_own"
  on public.profile_contacts for update
  using (auth.uid() = user_id);

create policy "contacts_delete_own"
  on public.profile_contacts for delete
  using (auth.uid() = user_id);

-- =====================================================================
-- likes : un like par personne et par feria.
-- =====================================================================
create table if not exists public.likes (
  liker_id uuid not null references auth.users (id) on delete cascade,
  liked_id uuid not null references auth.users (id) on delete cascade,
  feria_id text not null,
  created_at timestamptz not null default now(),
  primary key (liker_id, liked_id, feria_id),
  check (liker_id <> liked_id)
);

alter table public.likes enable row level security;

-- On ne voit que les likes qui NOUS concernent (donnes ou recus) :
-- impossible d'espionner qui like qui.
create policy "likes_select_involved"
  on public.likes for select
  using (auth.uid() = liker_id or auth.uid() = liked_id);

create policy "likes_insert_own"
  on public.likes for insert
  with check (auth.uid() = liker_id);

create policy "likes_delete_own"
  on public.likes for delete
  using (auth.uid() = liker_id);

-- =====================================================================
-- posts : fil de discussion par feria (texte court, compte requis).
-- =====================================================================
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  feria_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 300),
  created_at timestamptz not null default now()
);

create index if not exists posts_feria_created on public.posts (feria_id, created_at desc);

alter table public.posts enable row level security;

create policy "posts_select_authenticated"
  on public.posts for select
  to authenticated
  using (true);

create policy "posts_insert_own"
  on public.posts for insert
  with check (auth.uid() = user_id);

create policy "posts_delete_own"
  on public.posts for delete
  using (auth.uid() = user_id);

-- =====================================================================
-- rides : covoiturage aller/retour par feria.
-- =====================================================================
create table if not exists public.rides (
  id uuid primary key default gen_random_uuid(),
  feria_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  direction text not null check (direction in ('aller', 'retour')),
  detail text not null check (char_length(detail) between 5 and 200),
  seats integer not null check (seats between 1 and 8),
  created_at timestamptz not null default now()
);

create index if not exists rides_feria_created on public.rides (feria_id, created_at desc);

alter table public.rides enable row level security;

create policy "rides_select_authenticated"
  on public.rides for select
  to authenticated
  using (true);

create policy "rides_insert_own"
  on public.rides for insert
  with check (auth.uid() = user_id);

create policy "rides_delete_own"
  on public.rides for delete
  using (auth.uid() = user_id);
