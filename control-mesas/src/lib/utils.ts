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