-- ============================================================
-- 0008_ocupar_mesa.sql
-- Correcciones de la pantalla comensal:
--
--  1) SELECT público de peticiones pendientes: el comensal (anon) tiene
--     que leer las solicitudes vigentes de su mesa para deshabilitar los
--     botones (anti-spam de verdad) y que el realtime funcione.
--     Solo se exponen las filas con estado = 'pendiente'.
--
--  2) RPC ocupar_mesa: ocupa la mesa de forma ATÓMICA y auto-curativa.
--     Cierra cualquier sesión activa vieja (anti-QR-fantasma quedó con
--     sesiones "fantasma" cuya mesa ya estaba libre) y crea una nueva.
--     Devuelve el id de la sesión a guardar en localStorage.
-- ============================================================

-- ---------- 1) SELECT público de peticiones pendientes ----------
drop policy if exists "peticiones_public_select" on public.peticiones;
create policy "peticiones_public_select" on public.peticiones
  for select to anon, authenticated
  using (estado = 'pendiente');

-- ---------- 2) RPC ocupar_mesa (security definer) ----------
create or replace function public.ocupar_mesa(p_mesa_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sesion uuid;
begin
  -- Serializa contra ocupaciones concurrentes (doble lectura de un mismo QR).
  if not exists (select 1 from public.mesas where id = p_mesa_id for update) then
    raise exception 'La mesa no existe.';
  end if;

  update public.mesas set estado = 'ocupada' where id = p_mesa_id;

  -- Cierra sesiones viejas/fantasma y abre una nueva para este dispositivo.
  update public.sesiones_clientes set activa = false
    where mesa_id = p_mesa_id and activa = true;

  insert into public.sesiones_clientes (mesa_id, activa)
  values (p_mesa_id, true)
  returning id into v_sesion;

  return v_sesion;
end;
$$;

revoke all on function public.ocupar_mesa(uuid) from public;
grant execute on function public.ocupar_mesa(uuid) to anon, authenticated;