-- Sidequest schema (optional Supabase backend)
-- Local MVP persists to AsyncStorage; apply this when enabling synced accounts.

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  display_name text,
  created_at timestamptz not null default now(),
  onboarding_completed boolean not null default false
);

create table if not exists public.user_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  interests text[] not null default '{}',
  avoided_categories text[] not null default '{}',
  detour_minutes int not null default 10 check (detour_minutes in (5, 10, 15, 20)),
  budget text not null default 'any',
  spontaneity text not null default 'adventurous',
  notification_frequency text not null default 'medium',
  accessibility_notes text,
  exploration_enabled boolean not null default false,
  background_location_enabled boolean not null default false,
  quiet_hours_start int not null default 22,
  quiet_hours_end int not null default 8,
  max_notifications_per_day int not null default 2,
  cooldown_minutes int not null default 180,
  duplicate_suppression_days int not null default 7,
  walking_radius_min_meters int not null default 200,
  walking_radius_max_meters int not null default 1200,
  prefer_walking_only boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  enabled boolean not null default true,
  frequency text not null default 'medium',
  quiet_hours_start int not null default 22,
  quiet_hours_end int not null default 8,
  max_per_day int not null default 2,
  cooldown_minutes int not null default 180,
  updated_at timestamptz not null default now()
);

-- Canonical place record (provider-normalized)
create table if not exists public.places (
  id text primary key,
  provider_place_id text,
  name text not null,
  category text not null,
  description text not null default '',
  latitude double precision not null,
  longitude double precision not null,
  address text not null default '',
  opening_hours jsonb,
  price_level int,
  source text not null check (source in ('mock', 'google', 'curated', 'user')),
  story_hooks text[],
  suggested_activity text,
  tags text[],
  event_start timestamptz,
  event_end timestamptz,
  verification_status text,
  attribution text,
  accessibility_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists places_geo_idx on public.places (latitude, longitude);
create index if not exists places_category_idx on public.places (category);

-- Per-user sidequest instances (separate from canonical places)
create table if not exists public.sidequests (
  id uuid primary key default gen_random_uuid(),
  -- optional denormalized snapshot for offline clients
  place_id text not null references public.places(id),
  place_name text not null,
  category text not null,
  description text not null default '',
  latitude double precision not null,
  longitude double precision not null,
  address text not null default '',
  distance_meters int,
  estimated_walking_minutes int,
  opening_hours jsonb,
  cost_info text,
  personalization_score double precision,
  score_breakdown jsonb,
  story_hook text not null,
  suggested_activity text,
  why_recommended text,
  is_simulated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_sidequests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  sidequest_id uuid not null references public.sidequests(id) on delete cascade,
  status text not null,
  suggested_at timestamptz,
  accepted_at timestamptz,
  arrived_at timestamptz,
  completed_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, sidequest_id)
);

create index if not exists user_sidequests_user_status_idx
  on public.user_sidequests (user_id, status);

create table if not exists public.story_chapters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  sidequest_id uuid not null references public.sidequests(id),
  place_id text not null references public.places(id),
  place_name text not null,
  category text not null,
  reflection text not null default '',
  photo_uri text,
  rating int check (rating is null or (rating between 1 and 5)),
  mood text,
  original_prompt text not null,
  chapter_number int not null,
  visited_at timestamptz not null default now(),
  is_private boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists story_chapters_user_visited_idx
  on public.story_chapters (user_id, visited_at desc);

create table if not exists public.recommendation_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  sidequest_id uuid,
  place_id text,
  category text not null,
  action text not null,
  rating int,
  created_at timestamptz not null default now()
);

create index if not exists recommendation_feedback_user_idx
  on public.recommendation_feedback (user_id, created_at desc);

-- RLS: enable when auth is wired. MVP uses device-local storage.
alter table public.users enable row level security;
alter table public.user_preferences enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.user_sidequests enable row level security;
alter table public.story_chapters enable row level security;
alter table public.recommendation_feedback enable row level security;

-- Example policies (auth.uid() must match users.id when using Supabase Auth)
-- create policy "users own row" on public.users for all using (auth.uid() = id);
-- create policy "prefs own row" on public.user_preferences for all using (auth.uid() = user_id);
