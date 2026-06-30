-- Evita el envenenamiento de métricas: una reseña/aporte solo puede atribuirse a
-- una carrera que efectivamente dicta esa materia. Se enforce a nivel DB porque un
-- insert directo a la REST API saltea la server action.
create or replace function public.validate_subject_career()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.career_subjects cs
    where cs.subject_code = new.subject_code
      and cs.career_id = new.career_id
  ) then
    raise exception 'La carrera seleccionada no dicta esta materia';
  end if;
  return new;
end;
$$;

drop trigger if exists reviews_validate_subject_career on public.reviews;
create trigger reviews_validate_subject_career
  before insert or update on public.reviews
  for each row execute function public.validate_subject_career();

drop trigger if exists contributions_validate_subject_career on public.contributions;
create trigger contributions_validate_subject_career
  before insert or update on public.contributions
  for each row execute function public.validate_subject_career();

-- la función trigger no debe exponerse por RPC
revoke execute on function public.validate_subject_career() from anon, authenticated, public;
