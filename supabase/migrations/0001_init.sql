-- 0001_init.sql, schema Festayre : comptes, achats Festayre+, favoris.
--
-- Principe de securite : TOUT est verrouille par Row Level Security.
-- La cle publique "anon" ne peut lire/ecrire que ce que ces policies
-- autorisent, c'est la vraie barriere de securite du projet.

-- =====================================================================
-- purchases : trace des paiements Stripe (ecrite par le webhook via
-- service_role uniquement, lisible par son proprietaire).
-- =====================================================================
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product text not null,
  stripe_session_id text not null unique,
  amount_total integer,
  currency text,
  created_at timestamptz not null default now()
);

alter table public.purchases enable row level security;

-- Lecture : chacun voit uniquement ses propres achats.
create policy "purchases_select_own"
  on public.purchases for select
  using (auth.uid() = user_id);

-- Aucune policy insert/update/delete pour les clients :
-- seule la cle service_role (webhook Stripe, cote serveur) peut ecrire.

-- =====================================================================
-- favorites : ferias mises en favori, synchronisees entre appareils
-- (feature Festayre+). Cle composite = un favori max par feria.
-- =====================================================================
create table if not exists public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  feria_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, feria_id)
);

alter table public.favorites enable row level security;

-- CRUD complet mais strictement limite a ses propres lignes.
create policy "favorites_select_own"
  on public.favorites for select
  using (auth.uid() = user_id);

create policy "favorites_insert_own"
  on public.favorites for insert
  with check (auth.uid() = user_id);

create policy "favorites_delete_own"
  on public.favorites for delete
  using (auth.uid() = user_id);
