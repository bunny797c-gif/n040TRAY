-- Admin flag on profiles
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- Helper to check admin from RLS policies
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Editable site content: one row per (section, key)
create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  section text not null,
  key text not null,
  value text,
  type text not null default 'text' check (type in ('text','image','number')),
  updated_at timestamptz not null default now(),
  unique (section, key)
);

alter table public.site_content enable row level security;

create policy "site_content_public_read" on public.site_content
  for select using (true);

create policy "site_content_admin_insert" on public.site_content
  for insert with check (public.is_admin());

create policy "site_content_admin_update" on public.site_content
  for update using (public.is_admin());

create policy "site_content_admin_delete" on public.site_content
  for delete using (public.is_admin());

-- Public bucket for admin-uploaded site images
insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do nothing;

create policy "site_images_public_read" on storage.objects
  for select using (bucket_id = 'site-images');

create policy "site_images_admin_write" on storage.objects
  for insert with check (bucket_id = 'site-images' and public.is_admin());

create policy "site_images_admin_update" on storage.objects
  for update using (bucket_id = 'site-images' and public.is_admin());

create policy "site_images_admin_delete" on storage.objects
  for delete using (bucket_id = 'site-images' and public.is_admin());

-- Allow admins to manage plans and serviceable pincodes from the dashboard
create policy "plans_admin_write" on public.plans
  for all using (public.is_admin()) with check (public.is_admin());

create policy "pincodes_admin_write" on public.serviceable_pincodes
  for all using (public.is_admin()) with check (public.is_admin());

-- Make the owner an admin (run after they have signed up)
-- update public.profiles set is_admin = true where id = (select id from auth.users where email = 'YOUR_EMAIL_HERE');
