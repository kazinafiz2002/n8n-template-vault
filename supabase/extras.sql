-- Skip email confirmation (accounts are verified by payment anyway).
create or replace function public.auto_confirm_email()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email_confirmed_at is null then new.email_confirmed_at := now(); end if;
  return new;
end $$;
drop trigger if exists auto_confirm_email on auth.users;
create trigger auto_confirm_email before insert on auth.users
  for each row execute function public.auto_confirm_email();

-- Site owner becomes admin automatically on sign-up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner boolean := lower(new.email) = 'kazinafiz2002@gmail.com';
begin
  insert into public.profiles (id, email, full_name, is_admin, has_access, access_granted_at)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', owner, owner, case when owner then now() end)
  on conflict (id) do nothing;
  return new;
end $$;
