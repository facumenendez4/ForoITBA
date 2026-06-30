-- La verificación de admin se hacía con un subquery a profiles DENTRO de una policy de
-- profiles → recursión infinita. Se mueve a una función SECURITY DEFINER que bypassea RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles: causa raíz de la recursión
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to public
  using (id = auth.uid() or public.is_admin());

-- reviews / contributions / votes: usaban el mismo subquery a profiles
drop policy if exists reviews_select on public.reviews;
create policy reviews_select on public.reviews
  for select to public
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists contributions_select on public.contributions;
create policy contributions_select on public.contributions
  for select to public
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists votes_select on public.votes;
create policy votes_select on public.votes
  for select to public
  using (user_id = auth.uid() or public.is_admin());

-- reports: idem
drop policy if exists reports_select_admin on public.reports;
create policy reports_select_admin on public.reports
  for select to public
  using (public.is_admin());

drop policy if exists reports_update_admin on public.reports;
create policy reports_update_admin on public.reports
  for update to public
  using (public.is_admin());
