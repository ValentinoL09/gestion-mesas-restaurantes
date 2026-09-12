-- ============================================================
-- 0004_anti_spam.sql
-- Impide duplicar peticiones pendientes del mismo tipo en la misma mesa:
-- solo puede haber UNA 'llamar_mozo' pendiente y UNA 'pedir_cuenta' pendiente
-- por mesa. Al marcarse 'atendida' (o al liberar la mesa), la restricción
-- deja pasar la siguiente petición.
-- ============================================================

create unique index if not exists peticiones_pendientes_unicas
  on public.peticiones (mesa_id, tipo)
  where estado = 'pendiente';