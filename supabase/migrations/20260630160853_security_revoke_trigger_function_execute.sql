-- Las funciones-trigger no deben ser invocables desde la REST API (/rest/v1/rpc/...).
revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.enforce_itba_domain() from anon, authenticated, public;
