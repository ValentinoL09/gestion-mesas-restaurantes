/**
 * Identificación del administrador de la plataforma.
 *
 * al iniciar sesión con ese email, el login redirige a /admin y el resto
 * de cuentas siguen yendo a su propio dashboard.
 */
export const ADMIN_EMAIL = 'lasagnovalentino@gmail.com';

export function esAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.trim().toLowerCase();
}