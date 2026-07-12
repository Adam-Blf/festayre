-- 0007_plus_sync.sql, synchronisation multi-appareils Festayre+.
--
-- La promesse du pack Festayre+ : passeport (tampons, defis) et
-- checklist suivent l'utilisateur d'un appareil a l'autre.
--
-- Gating verifie EN BASE : l'ecriture exige une ligne d'achat
-- festayre_plus dans purchases (ecrite uniquement par le webhook
-- Stripe). Un client modifie sans achat ne peut pas ecrire, meme en
-- forgeant les requetes. La lecture reste ouverte au proprietaire
-- (un ex-abonne conserve l'acces a ses donnees : droit RGPD).

create table if not exists public.user_sync (
  user_id uuid primary key references auth.users (id) on delete cascade,
  -- Blobs JSON : le schema interne appartient au client (versionne
  -- par les cles localStorage), la base ne fait que transporter.
  passport jsonb not null default '{}'::jsonb,
  checklist jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_sync enable row level security;

create policy "sync_select_own"
  on public.user_sync for select
  using (auth.uid() = user_id);

-- Ecriture reservee aux acheteurs Festayre+.
create policy "sync_insert_plus"
  on public.user_sync for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.purchases pu
      where pu.user_id = auth.uid() and pu.product = 'festayre_plus'
    )
  );

create policy "sync_update_plus"
  on public.user_sync for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.purchases pu
      where pu.user_id = auth.uid() and pu.product = 'festayre_plus'
    )
  );

create policy "sync_delete_own"
  on public.user_sync for delete
  using (auth.uid() = user_id);

-- updated_at automatique (last-write-wins cote client).
create or replace function public.user_sync_touch()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists user_sync_touch on public.user_sync;
create trigger user_sync_touch
  before update on public.user_sync
  for each row execute function public.user_sync_touch();
