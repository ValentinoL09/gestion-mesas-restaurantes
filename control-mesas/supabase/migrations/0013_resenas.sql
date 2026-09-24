-- ============================================================
-- 0013_resenas.sql
-- Reseñas de Google por restaurante:
--   1) Columna url_resenas (link público a las reseñas de Google Maps).
--   2) La vista pública la expone para que el comensal pueda ofrecer
--      el botón "Dejanos tu reseña" sin exponer datos sensibles.
-- ============================================================

-- ---------- 1) Columna url_resenas ----------
alter table public.restaurantes
  add column if not exists url_resenas text;

-- ---------- 2) Vista pública con la URL de reseñas ----------
drop view if exists public.restaurantes_publico;
create view public.restaurantes_publico as
  select id, url_carta, url_resenas, logo_url, color_primario, color_secundario, nombre
  from public.restaurantes;

grant select on public.restaurantes_publico to anon, authenticated;
