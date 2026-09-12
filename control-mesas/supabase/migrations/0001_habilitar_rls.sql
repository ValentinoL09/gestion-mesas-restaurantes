-- ============================================================
-- 0001_habilitar_rls.sql
-- Habilita RLS en las 4 tablas y define políticas acotadas.
-- También agrega la columna url_carta (carta digital configurable)
-- y crea la vista pública restaurantes_publico.
-- ============================================================

-- ---------- 0) Carta digital configurable ----------
alter table public.restaurantes add column if not exists url_carta text null;

-- ---------- 1) restaurantes ----------
alter table public.restaurantes enable row level security;

-- Solo el dueño puede ver/editar su propio registro de restaurante.
drop policy if exists "restaurantes_owner_select" on public.restaurantes;
create policy "restaurantes_owner_select" on public.restaurantes
  for select to authenticated
  using (usuario_id = auth.uid());

drop policy if exists "restaurantes_owner_insert" on public.restaurantes;
create policy "restaurantes_owner_insert" on public.restaurantes
  for insert to authenticated
  with check (usuario_id = auth.uid());

drop policy if exists "restaurantes_owner_update" on public.restaurantes;
create policy "restaurantes_owner_update" on public.restaurantes
  for update to authenticated
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

-- Vista pública con SOLO los datos no sensibles del restaurante
-- (el comensal la necesita para la carta digital, sin exponer usuario_id).
drop view if exists public.restaurantes_publico;
create view public.restaurantes_publico as
  select id, url_carta
  from public.restaurantes;

grant select on public.restaurantes_publico to anon, authenticated;

-- ---------- 2) mesas ----------
alter table public.mesas enable row level security;

-- SELECT pública: el comensal lee la mesa desde el QR y Realtime lo necesita.
drop policy if exists "mesas_public_select" on public.mesas;
create policy "mesas_public_select" on public.mesas
  for select to anon, authenticated
  using (true);

-- El comensal anónimo SOLO puede pasar la mesa de 'libre' a 'ocupada'.
drop policy if exists "mesas_public_ocupar" on public.mesas;
create policy "mesas_public_ocupar" on public.mesas
  for update to anon, authenticated
  using (estado = 'libre')
  with check (estado = 'ocupada');

-- El dueño puede crear/gestionar mesas de sus restaurantes.
drop policy if exists "mesas_owner_all" on public.mesas;
create policy "mesas_owner_all" on public.mesas
  for all to authenticated
  using (exists (
    select 1 from public.restaurantes r
    where r.id = mesas.restaurante_id and r.usuario_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.restaurantes r
    where r.id = mesas.restaurante_id and r.usuario_id = auth.uid()
  ));

-- ---------- 3) peticiones ----------
alter table public.peticiones enable row level security;

-- INSERT pública acotada: el comensal solo puede crear peticiones validas
-- de tipo conocido y en estado 'pendiente'.
drop policy if exists "peticiones_public_insert" on public.peticiones;
create policy "peticiones_public_insert" on public.peticiones
  for insert to anon, authenticated
  with check (
    tipo in ('llamar_mozo', 'pedir_cuenta') and estado = 'pendiente'
  );

-- Cola de pedidos y marcado de atendida: solo el dueño del restaurante.
drop policy if exists "peticiones_owner_all" on public.peticiones;
create policy "peticiones_owner_all" on public.peticiones
  for all to authenticated
  using (exists (
    select 1 from public.restaurantes r
    where r.id = peticiones.restaurante_id and r.usuario_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.restaurantes r
    where r.id = peticiones.restaurante_id and r.usuario_id = auth.uid()
  ));

-- ---------- 4) sesiones_clientes ----------
alter table public.sesiones_clientes enable row level security;

-- El comensal anónimo crea su sesion activa.
drop policy if exists "sesiones_public_insert" on public.sesiones_clientes;
create policy "sesiones_public_insert" on public.sesiones_clientes
  for insert to anon, authenticated
  with check (activa = true);

-- Anti-QR fantasma: el comensal solo ve sesiones activas de su mesa.
drop policy if exists "sesiones_public_select" on public.sesiones_clientes;
create policy "sesiones_public_select" on public.sesiones_clientes
  for select to anon, authenticated
  using (activa = true);

-- Cerrar sesiones al liberar la mesa: solo el dueño.
drop policy if exists "sesiones_owner_update" on public.sesiones_clientes;
create policy "sesiones_owner_update" on public.sesiones_clientes
  for update to authenticated
  using (exists (
    select 1 from public.mesas m
    join public.restaurantes r on r.id = m.restaurante_id
    where m.id = sesiones_clientes.mesa_id and r.usuario_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.mesas m
    join public.restaurantes r on r.id = m.restaurante_id
    where m.id = sesiones_clientes.mesa_id and r.usuario_id = auth.uid()
  ));