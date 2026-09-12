-- ============================================================
-- 0005_theming.sql
-- Identidad visual por restaurante: logo + colores de marca.
-- Cualquier restaurante nuevo nace con la marca SmartTable
-- (azul #2563eb + negro #0a0a0a) hasta personalizarlo.
-- ============================================================

-- ---------- 1) Columnas de tema en restaurantes ----------
alter table public.restaurantes
  add column if not exists logo_url text,
  add column if not exists color_primario text not null default '#2563eb',
  add column if not exists color_secundario text not null default '#0a0a0a';

-- ---------- 2) Vista pública: exponer identidad no sensible ----------
-- El comensal la necesita para pintar la pantalla /m/[id] con la marca.
drop view if exists public.restaurantes_publico;
create view public.restaurantes_publico as
  select id, url_carta, logo_url, color_primario, color_secundario
  from public.restaurantes;

grant select on public.restaurantes_publico to anon, authenticated;

-- ---------- 3) Bucket público para logos de clientes ----------
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;