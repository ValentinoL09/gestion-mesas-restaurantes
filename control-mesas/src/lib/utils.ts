export function minutosTranscurridos(fechaIso: string, ahora: Date = new Date()): string {
  const dif = Math.floor((ahora.getTime() - new Date(fechaIso).getTime()) / 60000);
  return dif < 1 ? 'ahora' : `hace ${dif} min`;
}

export function urlMesaQR(urlBase: string, mesaId: string): string {
  return `${urlBase}/m/${mesaId}`;
}

export function etiquetaCuenta(metodoPago: string | null): string {
  return metodoPago === 'tarjeta'
    ? '💳 Paga con Tarjeta'
    : '💵 Paga con Efectivo / Transferencia';
}

export type SucursalConId = { id: string; nombre: string };

/**
 * Resuelve la sucursal activa del panel: toma el parámetro ?sucursal= solo
 * si coincide con alguna sucursal real; si no viene (o es inválido) usa la
 * primera. Devuelve null cuando la marca no tiene sucursales todavía.
 */
export function resolverSucursalActiva(
  sucursales: SucursalConId[],
  parametro: string | null | undefined
): string | null {
  if (!Array.isArray(sucursales) || sucursales.length === 0) return null;
  if (parametro && sucursales.some((s) => s.id === parametro)) return parametro;
  return sucursales[0].id;
}

/**
 * Determina si la URL (o un fragmento de ella) corresponde a un link de
 * recuperación de contraseña. Con flujo implícito el link trae los tokens en
 * el hash con `type=recovery`; con flujo PKCE nunca aparece este parámetro.
 */
export function urlConRecuperacion(href: string): boolean {
  if (href.includes('type=recovery')) return true;
  try {
    return new URL(href).searchParams.get('type') === 'recovery';
  } catch {
    return false;
  }
}

/**
 * Determina si la sesión fue creada desde un link de recuperación de
 * contraseña, mirando el claim `amr` del JWT (contiene "recovery").
 * Cualquier sesión normal (password/otp) devuelve false.
 */
export function esSesionRecovery(session: { access_token: string } | null): boolean {
  if (!session) return false;

  try {
    const segmentoBase64Url = session.access_token.split('.')[1];
    const payload = JSON.parse(
      atob(segmentoBase64Url.replace(/-/g, '+').replace(/_/g, '/'))
    );
    const amr: unknown[] = payload.amr ?? [];
    return amr.some((a) =>
      typeof a === 'string' ? a === 'recovery' : (a as { method?: string }).method === 'recovery'
    );
  } catch {
    return false;
  }
}