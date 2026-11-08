-- n8n Template Vault — database schema
-- Run this once in Supabase → SQL Editor.

create extension if not exists pg_trgm;

-- ───────────────────────── profiles ─────────────────────────
create table if not exists public.profiles (
  id                uuid primary key references auth.users on delete cascade,
  email             text,
  full_name         text,
  is_admin          boolean not null default false,
  has_access        boolean not null default false,   -- lifetime access flag
  access_granted_at timestamptz,
  created_at        timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.has_access()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select has_access or is_admin from public.profiles where id = auth.uid()), false)
$$;

-- ───────────────────────── templates ─────────────────────────
-- Public metadata (anyone can browse titles/descriptions).
create table if not exists public.templates (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  description  text,
  category     text not null default 'Other',
  services     text[] not null default '{}',
  node_count   int not null default 0,
  content_hash text not null unique,              -- prevents duplicate uploads
  created_at   timestamptz not null default now()
);
create index if not exists templates_title_trgm on public.templates using gin (title gin_trgm_ops);
create index if not exists templates_category on public.templates (category);
create index if not exists templates_services on public.templates using gin (services);

-- The actual workflow JSON lives in a separate table that NOBODY can select directly.
-- It is only returned through get_template_workflow(), which checks access.
create table if not exists public.template_contents (
  template_id uuid primary key references public.templates on delete cascade,
  workflow    jsonb not null
);

-- ───────────────────────── payments ─────────────────────────
create table if not exists public.payments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles on delete cascade,
  method        text not null check (method in ('bkash', 'nagad')),
  sender_number text not null,
  trx_id        text not null unique,
  amount        int not null,
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note    text,
  created_at    timestamptz not null default now(),
  reviewed_at   timestamptz
);
create index if not exists payments_status on public.payments (status, created_at desc);

-- ───────────────────────── copy log (anti-scraping) ─────────────────────────
create table if not exists public.copy_logs (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles on delete cascade,
  template_id uuid not null references public.templates on delete cascade,
  created_at  timestamptz not null default now()
);
create index if not exists copy_logs_user_day on public.copy_logs (user_id, created_at desc);

-- ───────────────────────── RLS ─────────────────────────
alter table public.profiles          enable row level security;
alter table public.templates         enable row level security;
alter table public.template_contents enable row level security;
alter table public.payments          enable row level security;
alter table public.copy_logs         enable row level security;

drop policy if exists "own or admin read" on public.profiles;
create policy "own or admin read" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
drop policy if exists "admin update" on public.profiles;
create policy "admin update" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read" on public.templates;
create policy "public read" on public.templates for select using (true);
drop policy if exists "admin delete" on public.templates;
create policy "admin delete" on public.templates for delete using (public.is_admin());

-- template_contents: intentionally no policies → no direct access.

drop policy if exists "own insert" on public.payments;
create policy "own insert" on public.payments
  for insert with check (user_id = auth.uid() and status = 'pending');
drop policy if exists "own or admin read" on public.payments;
create policy "own or admin read" on public.payments
  for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "admin update" on public.payments;
create policy "admin update" on public.payments
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin read" on public.copy_logs;
create policy "admin read" on public.copy_logs for select using (public.is_admin());

-- ───────────────────────── functions ─────────────────────────
-- Returns the workflow JSON only for users with access. Daily limit stops bulk scraping.
create or replace function public.get_template_workflow(tid uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  daily_limit constant int := 150;
  used int;
  wf jsonb;
begin
  if auth.uid() is null then raise exception 'NOT_LOGGED_IN'; end if;
  if not public.has_access() then raise exception 'NO_ACCESS'; end if;

  if not public.is_admin() then
    select count(*) into used from public.copy_logs
      where user_id = auth.uid() and created_at > now() - interval '24 hours';
    if used >= daily_limit then raise exception 'DAILY_LIMIT'; end if;
  end if;

  select workflow into wf from public.template_contents where template_id = tid;
  if wf is null then raise exception 'NOT_FOUND'; end if;

  insert into public.copy_logs (user_id, template_id) values (auth.uid(), tid);
  return wf;
end $$;

-- Bulk import used by the admin upload page and the CLI script.
-- items: [{slug,title,description,category,services,node_count,content_hash,workflow}, ...]
create or replace function public.admin_import_templates(items jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  it jsonb;
  new_id uuid;
  inserted int := 0;
  skipped int := 0;
begin
  if not (public.is_admin() or coalesce(auth.jwt()->>'role', '') = 'service_role') then
    raise exception 'NOT_ADMIN';
  end if;

  for it in select * from jsonb_array_elements(items) loop
    insert into public.templates (slug, title, description, category, services, node_count, content_hash)
    values (
      it->>'slug', it->>'title', it->>'description', coalesce(it->>'category', 'Other'),
      coalesce(array(select jsonb_array_elements_text(it->'services')), '{}'),
      coalesce((it->>'node_count')::int, 0), it->>'content_hash'
    )
    on conflict do nothing
    returning id into new_id;

    if new_id is null then
      skipped := skipped + 1;
    else
      insert into public.template_contents (template_id, workflow) values (new_id, it->'workflow');
      inserted := inserted + 1;
    end if;
    new_id := null;
  end loop;

  return jsonb_build_object('inserted', inserted, 'skipped', skipped);
end $$;

-- Distinct categories with counts (for the filter sidebar).
create or replace function public.template_categories()
returns table (category text, total bigint) language sql stable as $$
  select category, count(*) from public.templates group by category order by count(*) desc
$$;

revoke all on function public.admin_import_templates(jsonb) from anon;
revoke all on function public.get_template_workflow(uuid) from anon;

-- After you sign up on the site, make yourself admin (replace the email):
-- update public.profiles set is_admin = true, has_access = true where email = 'you@example.com';
