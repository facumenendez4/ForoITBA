-- Etapa 8.1: permitir publicar reseñas/aportes con nombre visible en vez de
-- anónimo. Anónimo sigue siendo el default (no rompe la garantía existente);
-- el usuario opta activamente por mostrarse, y necesita haber cargado un
-- nombre para mostrar en su perfil.

alter table public.profiles add column display_name text;
alter table public.profiles add constraint profiles_display_name_length
  check (display_name is null or char_length(trim(display_name)) between 1 and 60);

alter table public.reviews add column is_anonymous boolean not null default true;
alter table public.contributions add column is_anonymous boolean not null default true;

create or replace view public.public_reviews as
select
  r.id,
  r.subject_code,
  r.career_id,
  r.difficulty,
  r.workload,
  r.usefulness,
  r.comment,
  r.term_taken,
  r.created_at,
  r.updated_at,
  coalesce(sum(v.value) filter (where v.value = 1), 0::bigint)::integer as upvotes,
  coalesce(sum(v.value) filter (where v.value = '-1'::integer), 0::bigint)::integer as downvotes,
  coalesce(sum(v.value), 0::bigint)::integer as score,
  r.is_anonymous,
  max(case when r.is_anonymous then null else p.display_name end) as author_name
from reviews r
left join profiles p on p.id = r.user_id
left join votes v on v.target_type = 'review'::report_target_type and v.target_id = r.id
group by r.id;

create or replace view public.public_contributions as
select
  c.id,
  c.subject_code,
  c.career_id,
  c.type,
  c.body,
  c.created_at,
  coalesce(sum(v.value) filter (where v.value = 1), 0::bigint)::integer as upvotes,
  coalesce(sum(v.value) filter (where v.value = '-1'::integer), 0::bigint)::integer as downvotes,
  coalesce(sum(v.value), 0::bigint)::integer as score,
  c.is_anonymous,
  max(case when c.is_anonymous then null else p.display_name end) as author_name
from contributions c
left join profiles p on p.id = c.user_id
left join votes v on v.target_type = 'contribution'::report_target_type and v.target_id = c.id
group by c.id;
