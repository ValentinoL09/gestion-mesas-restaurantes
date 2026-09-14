/**
 * Identificación del administrador de la plataforma.
 *
 * REEMPLAZA 'tu-email-admin@example.com' por el email real de tu cuenta:
 * al iniciar sesión con ese email, el login redirige a /admin y el resto
 * de cuentas siguen yendo a su propio dashboard.
 */
export const ADMIN_EMAIL = 'tu-email-admin@example.com';

export function esAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.trim().toLowerCase();
}