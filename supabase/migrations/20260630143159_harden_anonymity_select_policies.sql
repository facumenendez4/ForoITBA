-- Cierra el agujero de anonimato (brief §77): las tablas crudas exponían user_id a
-- cualquiera (qual=true). Las lecturas públicas siguen funcionando vía las vistas
-- public_reviews / public_contributions, que corren como owner (security_invoker no
-- seteado) y por lo tanto bypassean RLS.

drop policy if exists reviews_select on public.reviews;
create policy reviews_select on public.reviews
  for select to public
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists contributions_select on public.contributions;
create policy contributions_select on public.contributions
  for select to public
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists votes_select on public.votes;
create policy votes_select on public.votes
  for select to public
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- get_subject_metrics lee reviews directo y es SECURITY INVOKER: tras restringir el SELECT
-- de reviews devolvería datos parciales a anónimos. Es 100% agregada (no expone user_id),
-- así que pasa a SECURITY DEFINER con search_path fijo.
alter function public.get_subject_metrics(text, uuid) security definer;
alter function public.get_subject_metrics(text, uuid) set search_path = public;
