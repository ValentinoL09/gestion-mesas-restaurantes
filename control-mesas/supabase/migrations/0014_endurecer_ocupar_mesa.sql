-- ============================================================
-- 0014_endurecer_ocupar_mesa.sql
-- Endurece el ciclo de sesiones de cliente:
--   1) ocupar_mesa BORRA las sesiones previas de la mesa en vez de solo
--      desactivarlas, para que llamar al RPC en bucle no pueda inflar la
--      tabla sesiones_clientes (vector de DoS).
--   2) Índice único parcial: como máximo UNA sesión activa por mesa.
-- ============================================================

-- ---------- 1) ocupar_mesa sin acumular sesiones ----------
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

  -- Borra cualquier sesión previa (activa o fantasma) antes de abrir la nueva.
  delete from public.sesiones_clientes where mesa_id = p_mesa_id;

  insert into public.sesiones_clientes (mesa_id, activa)
  values (p_mesa_id, true)
  returning id into v_sesion;

  return v_sesion;
end;
$$;

revoke all on function public.ocupar_mesa(uuid) from public;
grant execute on function public.ocupar_mesa(uuid) to anon, authenticated;

-- ---------- 2) Limpieza previa: una sola activa por mesa ----------
with ranked as (
  select id, row_number() over (partition by mesa_id order by creado_en desc) as rn
  from public.sesiones_clientes
  where activa
)
update public.sesiones_clientes s
set activa = false
from ranked r
where s.id = r.id and r.rn > 1;

-- ---------- 3) Índice único de sesión activa ----------
create unique index if not exists sesiones_activas_unicas
  on public.sesiones_clientes (mesa_id)
  where activa;
