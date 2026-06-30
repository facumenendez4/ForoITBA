-- get_subject_metrics ya no se usa (las métricas se calculan en el cliente).
-- Se revoca el execute público para reducir superficie de ataque.
revoke execute on function public.get_subject_metrics(text, uuid) from anon, authenticated, public;
