-- ============================================================
-- 0002_liberar_mesa.sql
-- RPC transaccional para liberar una mesa de forma atomica:
-- 1) marca peticiones pendientes como atendidas
-- 2) cierra las sesiones activas de clientes
-- 3) pasa la mesa a estado 'libre'
-- Una sola sentencia SQL = transaccion con rollback automatico.
-- ============================================================

create or replace function public.liberar_mesa(p_mesa_id uuid)
returns void
language sql
security invoker
set search_path = public
as $$
  update public.peticiones set estado = 'atendida'
    where mesa_id = p_mesa_id and estado = 'pendiente';
  update public.sesiones_clientes set activa = false
    where mesa_id = p_mesa_id and activa = true;
  update public.mesas set estado = 'libre'
    where id = p_mesa_id;
$$;

revoke all on function public.liberar_mesa(uuid) from public;
grant execute on function public.liberar_mesa(uuid) to authenticated;