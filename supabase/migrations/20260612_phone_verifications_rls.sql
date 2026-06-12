-- Create phone_verifications if it doesn't exist
create table if not exists phone_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  phone text not null,
  otp_hash text not null,
  expires_at timestamptz not null,
  verified_at timestamptz,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table phone_verifications enable row level security;

-- Drop any old policies first
drop policy if exists "users_own_verifications" on phone_verifications;
drop policy if exists "users_insert_own" on phone_verifications;
drop policy if exists "users_update_own" on phone_verifications;

-- Authenticated users can read their own rows
create policy "users_own_verifications"
  on phone_verifications for select
  to authenticated
  using (user_id = auth.uid());

-- Authenticated users can insert their own rows
create policy "users_insert_own"
  on phone_verifications for insert
  to authenticated
  with check (user_id = auth.uid());

-- Authenticated users can update their own rows (attempts, verified_at)
create policy "users_update_own"
  on phone_verifications for update
  to authenticated
  using (user_id = auth.uid());
