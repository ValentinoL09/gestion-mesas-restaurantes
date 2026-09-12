-- ============================================================
-- 0003_enable_realtime.sql
-- Habilita Realtime (postgres_changes) en las tablas que la app escucha:
--   - mesas            -> comensal (expulsión por estado 'libre') y dashboard
--   - peticiones       -> dashboard (cola en vivo + alerta sonora)
--   - sesiones_clientes -> (disponibilidad para futuros canales)
-- Es idempotente: solo agrega las tablas a la publicación si faltan.
-- ============================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'mesas'
  ) then
    alter publication supabase_realtime add table public.mesas;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'peticiones'
  ) then
    alter publication supabase_realtime add table public.peticiones;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'sesiones_clientes'
  ) then
    alter publication supabase_realtime add table public.sesiones_clientes;
  end if;
end $$;