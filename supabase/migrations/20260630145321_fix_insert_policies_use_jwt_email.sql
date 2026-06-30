-- Las policies de insert validaban el dominio con SELECT email FROM auth.users, pero el rol
-- authenticated no tiene privilegios sobre auth.users → "permission denied for table users".
-- Se valida el dominio con el claim del JWT, que no requiere leer ninguna tabla.

drop policy if exists reviews_insert on public.reviews;
create policy reviews_insert on public.reviews
  for insert to public
  with check (
    user_id = auth.uid()
    and (auth.jwt() ->> 'email') ilike '%@itba.edu.ar'
  );

drop policy if exists contributions_insert on public.contributions;
create policy contributions_insert on public.contributions
  for insert to public
  with check (
    user_id = auth.uid()
    and (auth.jwt() ->> 'email') ilike '%@itba.edu.ar'
  );
