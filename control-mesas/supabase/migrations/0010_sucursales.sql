-- ============================================================
-- 0010_sucursales.sql
-- Gestión de sucursales: el restaurante es ahora la MARCA y puede
-- tener varios locales (sucursales), cada uno con sus propias mesas.
--
--  1) Tabla sucursales (perteneciente a un restaurante).
--  2) Columnas sucursal_id en mesas y peticiones (con backfill).
--  3) FKs ON DELETE CASCADE + índices.
--  4) RLS de sucursales (solo el dueño de la marca).
--  5) Policy de delete en sesiones para el dueño (mesa liberada/eliminada).
--  6) RPC eliminar_sucursal transaccional (valida propiedad, no permite
--     borrar la última sucursal y limpia sesiones/peticiones/mesas).
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- 1) Tabla sucursales ----------
create table if not exists public.sucursales (
  id uuid primary key default gen_random_uuid(),
  restaurante_id uuid not null references public.restaurantes(id) on delete cascade,
  nombre text not null,
  creado_en timestamptz not null default now()
);

create index if not exists sucursales_restaurante_id_idx
  on public.sucursales (restaurante_id);

-- ---------- 2) Columnas sucursal_id (nullable para el backfill) ----------
alter table public.mesas add column if not exists sucursal_id uuid null;
alter table public.peticiones add column if not exists sucursal_id uuid null;

create index if not exists mesas_sucursal_id_idx on public.mesas (sucursal_id);
create index if not exists peticiones_sucursal_id_idx on public.peticiones (sucursal_id);

-- ---------- 3) Backfill: una sucursal "Sucursal 1" por restaurante ----------
insert into public.sucursales (restaurante_id, nombre)
select r.id, 'Sucursal 1'
from public.restaurantes r;

update public.mesas m
set sucursal_id = s.id
from public.sucursales s
where s.restaurante_id = m.restaurante_id
  and m.sucursal_id is null;

update public.peticiones p
set sucursal_id = s.id
from public.sucursales s
where s.restaurante_id = p.restaurante_id
  and p.sucursal_id is null;

-- ---------- 4) NOT NULL + FKs + índices ----------
alter table public.mesas
  alter column sucursal_id set not null;

alter table public.mesas
  add constraint mesas_sucursal_id_fkey
  foreign key (sucursal_id) references public.sucursales(id) on delete cascade;

alter table public.peticiones
  alter column sucursal_id set not null;

alter table public.peticiones
  add constraint peticiones_sucursal_id_fkey
  foreign key (sucursal_id) references public.sucursales(id) on delete cascade;

-- ---------- 5) RLS de sucursales: solo el dueño de la marca ----------
alter table public.sucursales enable row level security;

drop policy if exists "sucursales_owner_all" on public.sucursales;
create policy "sucursales_owner_all" on public.sucursales
  for all to authenticated
  using (exists (
    select 1 from public.restaurantes r
    where r.id = sucursales.restaurante_id and r.usuario_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.restaurantes r
    where r.id = sucursales.restaurante_id and r.usuario_id = auth.uid()
  ));

-- Delete de sesiones para el dueño (mesa liberada/eliminada por el local).
drop policy if exists "sesiones_owner_delete" on public.sesiones_clientes;
create policy "sesiones_owner_delete" on public.sesiones_clientes
  for delete to authenticated
  using (exists (
    select 1 from public.mesas m
    join public.restaurantes r on r.id = m.restaurante_id
    where m.id = sesiones_clientes.mesa_id and r.usuario_id = auth.uid()
  ));

-- ---------- 6) RPC eliminar_sucursal (security definer) ----------
create or replace function public.eliminar_sucursal(p_sucursal_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_restaurante uuid;
  v_restante integer;
begin
  -- Valida que la sucursal exista y pertenezca al dueño autenticado.
  select s.restaurante_id into v_restaurante
  from public.sucursales s
  join public.restaurantes r on r.id = s.restaurante_id
  where s.id = p_sucursal_id and r.usuario_id = auth.uid()
  for update;

  if v_restaurante is null then
    raise exception 'Sucursal no encontrada o sin permisos.';
  end if;

  -- No se puede dejar a la marca sin sucursales.
  select count(*) into v_restante
  from public.sucursales
  where restaurante_id = v_restaurante;

  if v_restante <= 1 then
    raise exception 'No se puede eliminar la única sucursal de la marca.';
  end if;

  -- Limpieza en cascada manual antes de borrar la sucursal.
  delete from public.sesiones_clientes sc
  using public.mesas m
  where sc.mesa_id = m.id and m.sucursal_id = p_sucursal_id;

  delete from public.peticiones where sucursal_id = p_sucursal_id;
  delete from public.mesas where sucursal_id = p_sucursal_id;
  delete from public.sucursales where id = p_sucursal_id;
end;
$$;

revoke all on function public.eliminar_sucursal(uuid) from public;
grant execute on function public.eliminar_sucursal(uuid) to authenticated;