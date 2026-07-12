-- 0008_reports.sql, signalement et auto-moderation de la communaute.
--
-- Principes :
--  * tout utilisateur connecte peut signaler un profil ou un post,
--    UNE seule fois par cible (contrainte unique anti-spam),
--  * 3 signalements de 3 personnes DIFFERENTES sur un profil = profil
--    masque automatiquement (trigger en base : aucune intervention
--    manuelle requise pour couper une nuisance en pleine feria),
--  * la revue humaine (retablir / supprimer) se fait via le dashboard
--    Supabase avec service_role.

-- Drapeau de masquage sur les profils.
alter table public.community_profiles
  add column if not exists hidden boolean not null default false;

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  target_type text not null check (target_type in ('profile', 'post')),
  -- user_id (profil) ou id de post, en texte pour unifier.
  target_id text not null,
  reason text not null check (char_length(reason) between 3 and 300),
  created_at timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);

alter table public.reports enable row level security;

create policy "reports_insert_own"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

-- Chacun ne voit que ses propres signalements (la file de moderation
-- complete est reservee au service_role).
create policy "reports_select_own"
  on public.reports for select
  using (auth.uid() = reporter_id);

-- Auto-moderation : 3 signaleurs distincts sur un profil -> masque.
create or replace function public.reports_auto_hide()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  distinct_reporters integer;
begin
  if new.target_type = 'profile' then
    select count(distinct reporter_id) into distinct_reporters
    from public.reports
    where target_type = 'profile' and target_id = new.target_id;

    if distinct_reporters >= 3 then
      update public.community_profiles
      set hidden = true
      where user_id::text = new.target_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists reports_auto_hide on public.reports;
create trigger reports_auto_hide
  after insert on public.reports
  for each row execute function public.reports_auto_hide();
