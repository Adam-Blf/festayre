-- 0006_message_read.sql, statut lu / non lu de la messagerie.
--
-- Le destinataire doit pouvoir marquer un message comme lu, mais RIEN
-- d'autre : la policy UPDATE ouvre la ligne au destinataire, et un
-- trigger verrouille toutes les colonnes sauf read_at (une policy ne
-- sait pas restreindre par colonne, le trigger si).

alter table public.messages
  add column if not exists read_at timestamptz;

-- Policy : seul le destinataire peut mettre a jour ses messages recus.
drop policy if exists "messages_update_recipient_read" on public.messages;
create policy "messages_update_recipient_read"
  on public.messages for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

-- Trigger : seules les transitions de read_at sont autorisees.
create or replace function public.messages_protect_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.sender_id is distinct from old.sender_id
     or new.recipient_id is distinct from old.recipient_id
     or new.content is distinct from old.content
     or new.created_at is distinct from old.created_at then
    raise exception 'seul read_at est modifiable';
  end if;
  return new;
end;
$$;

drop trigger if exists messages_protect_update on public.messages;
create trigger messages_protect_update
  before update on public.messages
  for each row execute function public.messages_protect_update();

-- Index pour le compteur de non-lus.
create index if not exists messages_unread
  on public.messages (recipient_id) where read_at is null;
