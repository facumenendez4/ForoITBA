-- Fija search_path en funciones (las SECURITY DEFINER son el vector crítico de
-- escalación de privilegios; el resto por prolijidad/hardening).
alter function public.enforce_itba_domain() set search_path = public;
alter function public.handle_new_user() set search_path = public;
alter function public.search_subjects(p_query text) set search_path = public;
alter function public.handle_updated_at() set search_path = public;
alter function public.get_subject_careers_with_reviews(p_subject_code text) set search_path = public;
