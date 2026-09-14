import { createClient } from './supabase-server';
import { esAdmin } from './admin';

/**
 * Devuelve el usuario autenticado solo si es el admin de la plataforma.
 * Si no hay sesión o el email no corresponde al admin, devuelve null.
 *
 * Uso en Route Handlers y en el layout de /admin:
 *   const admin = await obtenerAdmin();
 *   if (!admin) return Response.json({ error: 'No autorizado' }, { status: 401 });
 */
export async function obtenerAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !esAdmin(user.email)) return null;
  return user;
}