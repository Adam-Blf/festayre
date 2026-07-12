-- 0010_groups.sql, position live du groupe.
--
-- Modele : un groupe ephemere identifie par un CODE secret de 6
-- caracteres (le partage du code vaut invitation). Chaque membre
-- pousse sa position, tous les membres la voient. C'est la reponse au
-- besoin terrain n.1 : "on s'est perdus dans la foule".
--
-- Vie privee :
--  * la position ne sort du telephone QUE si l'utilisateur rejoint un
--    groupe (opt-in explicite),
--  * seuls les membres du MEME groupe la voient (RLS),
--  * quitter le groupe supprime la position (cascade du delete membre
--    gere cote client + on delete cascade).
--
-- Anti-recursion RLS : les policies de group_members ne peuvent pas
-- s'auto-referencer, on passe par une fonction security definer.

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) = 6),
  name text not null check (char_length(name) between 1 and 40),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.group_positions (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  updated_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- Appartenance, evaluee hors RLS (security definer, proprietaire).
create or replace function public.is_group_member(gid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = auth.uid()
  );
$$;

alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_positions enable row level security;

-- groups : lisible par les connectes (id + code + nom, le code EST le
-- secret d'invitation : celui qui le connait est invite). Creation par
-- son auteur, suppression par son auteur.
create policy "groups_select_authenticated"
  on public.groups for select to authenticated using (true);
create policy "groups_insert_own"
  on public.groups for insert with check (auth.uid() = created_by);
create policy "groups_delete_owner"
  on public.groups for delete using (auth.uid() = created_by);

-- group_members : les membres se voient entre eux, chacun se joint et
-- se retire lui-meme.
create policy "members_select_same_group"
  on public.group_members for select
  using (public.is_group_member(group_id));
create policy "members_insert_self"
  on public.group_members for insert
  with check (auth.uid() = user_id);
create policy "members_delete_self"
  on public.group_members for delete
  using (auth.uid() = user_id);

-- group_positions : visibles des membres du groupe, chacun n'ecrit que
-- SA position et seulement s'il est membre.
create policy "positions_select_members"
  on public.group_positions for select
  using (public.is_group_member(group_id));
create policy "positions_upsert_self_insert"
  on public.group_positions for insert
  with check (auth.uid() = user_id and public.is_group_member(group_id));
create policy "positions_upsert_self_update"
  on public.group_positions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and public.is_group_member(group_id));
create policy "positions_delete_self"
  on public.group_positions for delete
  using (auth.uid() = user_id);
