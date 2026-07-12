-- 0009_lost_found.sql, objets perdus / trouves + contact covoiturage.
--
-- Covoiturage : une annonce sans moyen de contact est inutilisable,
-- on ajoute un champ contact LIBRE et OPTIONNEL (insta, telephone...),
-- rempli en connaissance de cause par l'auteur (donnee publique aux
-- utilisateurs connectes, rappele dans l'UI).
--
-- Objets perdus / trouves : le sac, les papiers, le telephone qui
-- disparaissent dans la cohue. Tableau par feria, resoluble par
-- l'auteur quand l'objet est retrouve.

alter table public.rides
  add column if not exists contact text check (char_length(contact) <= 60);

create table if not exists public.lost_found (
  id uuid primary key default gen_random_uuid(),
  feria_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('perdu', 'trouve')),
  item text not null check (char_length(item) between 3 and 120),
  place text check (char_length(place) <= 120),
  contact text check (char_length(contact) <= 60),
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists lost_found_feria_created
  on public.lost_found (feria_id, created_at desc);

alter table public.lost_found enable row level security;

create policy "lost_found_select_authenticated"
  on public.lost_found for select
  to authenticated
  using (true);

create policy "lost_found_insert_own"
  on public.lost_found for insert
  with check (auth.uid() = user_id);

-- L'auteur marque resolu ou corrige son annonce.
create policy "lost_found_update_own"
  on public.lost_found for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "lost_found_delete_own"
  on public.lost_found for delete
  using (auth.uid() = user_id);
