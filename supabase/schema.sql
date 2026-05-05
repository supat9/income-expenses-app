-- ============================================================
-- Ledger — income-expenses-app
-- Run this in the Supabase SQL Editor
-- ============================================================

create table if not exists public.users (
  id              uuid        default gen_random_uuid() primary key,
  email           text        not null unique,
  name            text,
  image           text,
  last_login_at   timestamptz,
  created_at      timestamptz default now()
);

create table if not exists public.categories (
  id         uuid        default gen_random_uuid() primary key,
  user_id    uuid        not null references public.users(id) on delete cascade,
  kind       text        not null check (kind in ('income', 'expense')),
  name_th    text        not null,
  name_en    text        not null,
  color      text        not null,
  icon       text        not null,
  slug       text,
  created_at timestamptz default now()
);

create table if not exists public.transactions (
  id          uuid           default gen_random_uuid() primary key,
  user_id     uuid           not null references public.users(id) on delete cascade,
  date        timestamptz    not null,
  amount      numeric(12, 2) not null,
  category_id uuid           not null references public.categories(id),
  note        text,
  account     text           default 'Cash',
  created_at  timestamptz    default now(),
  updated_at  timestamptz    default now()
);

create table if not exists public.budgets (
  id          uuid           default gen_random_uuid() primary key,
  user_id     uuid           not null references public.users(id) on delete cascade,
  category_id uuid           not null references public.categories(id),
  "limit"     numeric(12, 2) not null,
  created_at  timestamptz    default now(),
  updated_at  timestamptz    default now()
);

create table if not exists public.savings_goals (
  id              uuid           default gen_random_uuid() primary key,
  user_id         uuid           not null references public.users(id) on delete cascade,
  name_th         text           not null,
  name_en         text           not null,
  icon            text           not null default '🎯',
  color           text           not null default 'oklch(0.55 0.18 270)',
  target_amount   numeric(12, 2) not null,
  saved_amount    numeric(12, 2) not null default 0,
  monthly_target  numeric(12, 2),
  target_date     date,
  status          text           not null default 'active' check (status in ('active', 'completed')),
  created_at      timestamptz    default now(),
  updated_at      timestamptz    default now()
);

create table if not exists public.debts (
  id               uuid           default gen_random_uuid() primary key,
  user_id          uuid           not null references public.users(id) on delete cascade,
  name_th          text           not null,
  name_en          text           not null,
  icon             text           not null default '💳',
  color            text           not null default 'oklch(0.6 0.19 25)',
  creditor         text,
  total_amount     numeric(12, 2) not null,
  paid_amount      numeric(12, 2) not null default 0,
  monthly_payment  numeric(12, 2),
  interest_rate    numeric(5, 2)  default 0,
  due_date         date,
  status           text           not null default 'active' check (status in ('active', 'paid')),
  created_at       timestamptz    default now(),
  updated_at       timestamptz    default now()
);

-- Enable RLS (all writes go through service role key which bypasses RLS)
alter table public.users          enable row level security;
alter table public.categories     enable row level security;
alter table public.transactions   enable row level security;
alter table public.budgets        enable row level security;
alter table public.savings_goals  enable row level security;
alter table public.debts          enable row level security;
