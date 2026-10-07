-- Run this script in Supabase Dashboard > SQL Editor.
-- Replace the UUID below with the user id created in Authentication > Users.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.video_works (
  id text primary key,
  title text not null,
  category text not null default '口播',
  video_url text not null default '',
  cover_url text not null default '',
  aspect_ratio text not null default '9:16',
  card_aspect_ratio text not null default '3:4',
  role text not null default '',
  result text not null default '',
  description text not null default '',
  detail_keywords jsonb not null default '[]'::jsonb,
  platform text not null default '',
  tone text not null default 'card-blue',
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_portfolio_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where id = auth.uid()
  );
$$;

revoke all on function public.is_portfolio_admin() from public;
grant execute on function public.is_portfolio_admin() to anon, authenticated;

alter table public.admin_users enable row level security;
alter table public.video_works enable row level security;

grant select on public.admin_users to authenticated;
grant select, insert, update, delete on public.video_works to anon, authenticated;

drop policy if exists "Admins can read their own admin record" on public.admin_users;
create policy "Admins can read their own admin record"
  on public.admin_users for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "Anyone can read published video works" on public.video_works;
create policy "Anyone can read published video works"
  on public.video_works for select
  to anon, authenticated
  using (is_published = true or public.is_portfolio_admin());

drop policy if exists "Admins can insert video works" on public.video_works;
create policy "Admins can insert video works"
  on public.video_works for insert
  to authenticated
  with check (public.is_portfolio_admin());

drop policy if exists "Admins can update video works" on public.video_works;
create policy "Admins can update video works"
  on public.video_works for update
  to authenticated
  using (public.is_portfolio_admin())
  with check (public.is_portfolio_admin());

drop policy if exists "Admins can delete video works" on public.video_works;
create policy "Admins can delete video works"
  on public.video_works for delete
  to authenticated
  using (public.is_portfolio_admin());

insert into storage.buckets (id, name, public)
values ('portfolio-media', 'portfolio-media', true)
on conflict (id) do update set public = true;

grant select, insert, update, delete on storage.objects to anon, authenticated;

drop policy if exists "Public can read portfolio media" on storage.objects;
create policy "Public can read portfolio media"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'portfolio-media');

drop policy if exists "Admins can upload portfolio media" on storage.objects;
create policy "Admins can upload portfolio media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'portfolio-media' and public.is_portfolio_admin());

drop policy if exists "Admins can update portfolio media" on storage.objects;
create policy "Admins can update portfolio media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'portfolio-media' and public.is_portfolio_admin())
  with check (bucket_id = 'portfolio-media' and public.is_portfolio_admin());

drop policy if exists "Admins can delete portfolio media" on storage.objects;
create policy "Admins can delete portfolio media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'portfolio-media' and public.is_portfolio_admin());

create or replace function public.touch_video_work_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists video_works_updated_at on public.video_works;
create trigger video_works_updated_at
before update on public.video_works
for each row execute function public.touch_video_work_updated_at();

-- After creating your login user, run this once with that user's UUID:
-- insert into public.admin_users (id) values ('YOUR-AUTH-USER-UUID');
