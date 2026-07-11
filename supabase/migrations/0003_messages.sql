-- 0003_messages.sql, messagerie interne entre matchs.
--
-- Garde-fou principal : on ne peut ECRIRE qu'a une personne avec qui
-- le like est mutuel (meme condition que la revelation Instagram).
-- Pas de messages non sollicites possibles, par construction : la
-- policy d'insertion verifie le match cote base, pas cote client.

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users (id) on delete cascade,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);

create index if not exists messages_pair_created
  on public.messages (sender_id, recipient_id, created_at desc);
create index if not exists messages_recipient_created
  on public.messages (recipient_id, created_at desc);

alter table public.messages enable row level security;

-- Lecture : uniquement les conversations dont on fait partie.
create policy "messages_select_involved"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

-- Ecriture : expediteur = soi, ET match mutuel obligatoire.
create policy "messages_insert_matched"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.likes l1
      where l1.liker_id = auth.uid() and l1.liked_id = recipient_id
    )
    and exists (
      select 1 from public.likes l2
      where l2.liker_id = recipient_id and l2.liked_id = auth.uid()
    )
  );

-- Droit a l'oubli : on peut supprimer ses propres messages envoyes.
create policy "messages_delete_own"
  on public.messages for delete
  using (auth.uid() = sender_id);
