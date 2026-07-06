-- ============================================================
-- 6Pas: Draft Arena — Supabase kurulum betiği (tek seferlik)
-- Supabase Dashboard → SQL Editor → New query → yapıştır → Run
-- ============================================================

-- 1) Profiller: her hesabın kalıcı statları (canlı puan tabloları buradan okunur)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) between 2 and 24),
  total_points int not null default 0,
  best_streak int not null default 0,
  classic_points int not null default 0,
  classic_best_streak int not null default 0,
  classic_wins int not null default 0,
  classic_losses int not null default 0,
  tour_points int not null default 0,
  tour_best_stage int not null default 0,
  tour_wins int not null default 0,
  tour_losses int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profilleri herkes okur" on public.profiles;
create policy "profilleri herkes okur"
  on public.profiles for select using (true);

drop policy if exists "profili sahibi gunceller" on public.profiles;
create policy "profili sahibi gunceller"
  on public.profiles for update using (auth.uid() = id);

-- 2) Yeni hesap açılınca profil otomatik oluşur (username kayıt metadata'sından)
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', 'menajer-' || left(new.id::text, 6)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3) Maç sonucu: atomik stat güncellemesi (istemci toplama yapmaz — kayıp update olmaz)
create or replace function public.apply_match_outcome(
  p_mode text,
  p_points int,
  p_won boolean,
  p_streak int,
  p_stage int default 0
) returns void
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'giriş gerekli';
  end if;
  if p_mode not in ('classic', 'tournament') then
    raise exception 'geçersiz mod: %', p_mode;
  end if;

  update public.profiles set
    total_points       = total_points + greatest(coalesce(p_points, 0), 0),
    best_streak        = greatest(best_streak, coalesce(p_streak, 0)),
    classic_points     = classic_points + case when p_mode = 'classic' then greatest(coalesce(p_points, 0), 0) else 0 end,
    classic_best_streak= greatest(classic_best_streak, case when p_mode = 'classic' then coalesce(p_streak, 0) else 0 end),
    classic_wins       = classic_wins + case when p_mode = 'classic' and p_won then 1 else 0 end,
    classic_losses     = classic_losses + case when p_mode = 'classic' and not p_won then 1 else 0 end,
    tour_points        = tour_points + case when p_mode = 'tournament' then greatest(coalesce(p_points, 0), 0) else 0 end,
    tour_best_stage    = greatest(tour_best_stage, case when p_mode = 'tournament' then coalesce(p_stage, 0) else 0 end),
    tour_wins          = tour_wins + case when p_mode = 'tournament' and p_won then 1 else 0 end,
    tour_losses        = tour_losses + case when p_mode = 'tournament' and not p_won then 1 else 0 end
  where id = auth.uid();
end;
$$;

-- 4) Takım Defteri: biten run'ların geçmişi (her oyuncu yalnızca kendininkini görür)
create table if not exists public.run_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mode text not null,
  team_name text not null,
  captain_name text,
  wins int not null default 0,
  losses int not null default 0,
  result_label text not null,
  champion boolean not null default false,
  points int not null default 0,
  ended_at timestamptz not null default now()
);

alter table public.run_history enable row level security;

drop policy if exists "gecmisi sahibi okur" on public.run_history;
create policy "gecmisi sahibi okur"
  on public.run_history for select using (auth.uid() = user_id);

drop policy if exists "gecmisi sahibi ekler" on public.run_history;
create policy "gecmisi sahibi ekler"
  on public.run_history for insert with check (auth.uid() = user_id);

-- Bitti! Şimdi Authentication → Providers → Email altında
-- "Confirm email" seçeneğini KAPAT (oyun sentetik e-posta kullanır).
