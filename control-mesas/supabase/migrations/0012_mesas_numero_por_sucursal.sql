-- ============================================================
-- 0012_mesas_numero_por_sucursal.sql
-- La numeración de mesas pasa a ser por sucursal (antes, por
-- restaurante, cuando restaurante = un solo local). Sin este
-- cambio, agregar una mesa a la Sucursal 2 choca con el número
-- de una mesa de la Sucursal 1 del mismo restaurante.
-- ============================================================

alter table public.mesas drop constraint if exists mesas_restaurante_id_numero_key;

create unique index if not exists mesas_sucursal_numero_unicos
  on public.mesas (sucursal_id, numero);