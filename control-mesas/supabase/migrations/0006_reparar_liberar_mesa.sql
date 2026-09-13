-- ============================================================
-- 0006_reparar_liberar_mesa.sql
-- Normaliza el RPC liberar_mesa:
--  - Antes: security invoker -> dependía de que las políticas RLS
--    dejaran actualizar las 3 tablas (peticiones, sesiones_clientes
--    y mesas) y de los grants correctos. En el entorno remoto quedó
--    ejecutable por cualquiera (permisos mal aplicados).
--  - Ahora: security definer (corre con privilegios del dueño de la
--    función) + verificación explícita de que el user logueado es
--    dueño del restaurante de esa mesa. Atómico e idempotente.
-- ============================================================

create or replace function public.liberar_mesa(p_mesa_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.mesas m
    join public.restaurantes r on r.id = m.restaurante_id
    where m.id = p_mesa_id
      and r.usuario_id = auth.uid()
  ) then
    raise exception 'No tenés permisos para liberar esta mesa.';
  end if;

  update public.peticiones set estado = 'atendida'
    where mesa_id = p_mesa_id and estado = 'pendiente';
  update public.sesiones_clientes set activa = false
    where mesa_id = p_mesa_id and activa = true;
  update public.mesas set estado = 'libre'
    where id = p_mesa_id;
end;
$$;

revoke all on function public.liberar_mesa(uuid) from public;
grant execute on function public.liberar_mesa(uuid) to authenticated;