# Migraciones

Historial de cambios de schema de la base (Supabase / Postgres).

## Estado

El historial completo vive en el proyecto Supabase remoto (`schema_migrations`).
Las migraciones **base** (Etapa 1–3: schema, vistas, RLS inicial, RPC de métricas,
seed, búsqueda) se aplicaron al inicio del proyecto y están registradas en remoto
con versiones `20260629*`:

- `20260629141500_create_schema`
- `20260629141512_create_public_views`
- `20260629141534_enable_rls_and_policies`
- `20260629141556_create_metrics_rpc`
- `20260629141614_secure_anonymity`
- `20260629222856_enable_unaccent_and_search_function`

Estas migraciones base aún **no están volcadas a este repo** (se aplicaron antes de
versionar). Para traerlas: `supabase link --project-ref <ref>` con la cuenta dueña
del proyecto y `supabase migration fetch`.

## Migraciones de seguridad (Etapa 6, versionadas acá)

Aplicadas el 2026-06-30, cierran hallazgos de la revisión de seguridad:

| Versión | Qué hace |
|---|---|
| `20260630143159_harden_anonymity_select_policies` | Restringe SELECT crudo de reviews/contributions/votes a dueño/admin (anonimato) |
| `20260630145121_fix_profiles_rls_infinite_recursion` | `is_admin()` SECURITY DEFINER; corta la recursión en policies de profiles |
| `20260630145321_fix_insert_policies_use_jwt_email` | Valida dominio @itba.edu.ar vía `auth.jwt()` en vez de leer `auth.users` |
| `20260630160801_security_fix_function_search_path` | `search_path` fijo en funciones SECURITY DEFINER (anti escalación) |
| `20260630160820_security_validate_subject_career_pairing` | Trigger: la carrera debe dictar la materia (anti metric-poisoning) |
| `20260630160853_security_revoke_trigger_function_execute` | REVOKE EXECUTE de funciones-trigger expuestas por RPC |
| `20260630161057_security_revoke_unused_metrics_rpc` | REVOKE EXECUTE de `get_subject_metrics` (sin uso) |

> Nota: las migraciones se aplicaron vía el MCP de Supabase a la base remota; estos
> archivos son la copia versionada fiel del SQL ejecutado.
