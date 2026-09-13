-- ============================================================
-- 0007_metodo_pago.sql
-- Método de pago en peticiones de "pedir cuenta" + nombre público.
--
--  1) peticiones.metodo_pago: 'efectivo' | 'tarjeta' (null en llamar mozo).
--  2) Recrea la policy de INSERT para que el servidor exija el método
--     en 'pedir_cuenta' y lo prohíba en 'llamar_mozo'.
--  3) La vista pública expone también el nombre del restaurante
--     (para mostrar el nombre en el comensal cuando no hay logo).
-- ============================================================

-- ---------- 1) Columna metodo_pago ----------
alter table public.peticiones
  add column if not exists metodo_pago text;

-- ---------- 2) Policy de insert con validación ----------
drop policy if exists "peticiones_public_insert" on public.peticiones;
create policy "peticiones_public_insert" on public.peticiones
  for insert to anon, authenticated
  with check (
    (tipo = 'llamar_mozo' and estado = 'pendiente' and metodo_pago is null)
    or
    (tipo = 'pedir_cuenta' and estado = 'pendiente'
      and metodo_pago in ('efectivo', 'tarjeta'))
  );

-- ---------- 3) Vista pública con nombre ----------
drop view if exists public.restaurantes_publico;
create view public.restaurantes_publico as
  select id, url_carta, logo_url, color_primario, color_secundario, nombre
  from public.restaurantes;

grant select on public.restaurantes_publico to anon, authenticated;