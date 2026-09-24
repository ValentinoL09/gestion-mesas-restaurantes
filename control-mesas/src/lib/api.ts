import type { NextRequest } from 'next/server';
import { obtenerAdmin } from './requerirAdmin';
import { mismoOrigen } from './validacion';
import { ipDe, limitar } from './rateLimit';

export type AdminUser = NonNullable<Awaited<ReturnType<typeof obtenerAdmin>>>;

const MAX_PETICIONES = 60;
const VENTANA_MS = 60_000;

/**
 * Guardas comunes de las APIs de administración: sesión de admin, origen
 * (CSRF) y límite de tasa. Devuelve el admin o la respuesta de rechazo.
 */
export async function autorizarAdmin(
  request: NextRequest
): Promise<{ ok: true; admin: AdminUser } | { ok: false; respuesta: Response }> {
  const admin = await obtenerAdmin();
  if (!admin) {
    return { ok: false, respuesta: Response.json({ error: 'No autorizado' }, { status: 401 }) };
  }

  if (!mismoOrigen(request)) {
    return { ok: false, respuesta: Response.json({ error: 'Origen no permitido.' }, { status: 403 }) };
  }

  if (!limitar(`admin:${ipDe(request)}`, MAX_PETICIONES, VENTANA_MS)) {
    return {
      ok: false,
      respuesta: Response.json(
        { error: 'Demasiadas solicitudes. Probá de nuevo en un minuto.' },
        { status: 429 }
      ),
    };
  }

  return { ok: true, admin };
}

/**
 * Respuesta de error interna: registra el detalle real en el servidor y
 * devuelve un mensaje genérico para no filtrar información de la base.
 */
export function errorInterno(contexto: string, detalle: unknown): Response {
  console.error(`${contexto}:`, detalle);
  return Response.json({ error: 'Ocurrió un error. Intentalo de nuevo.' }, { status: 500 });
}
