/**
 * Identificación del administrador de la plataforma.
 *
 * El email se configura con la variable de entorno NEXT_PUBLIC_ADMIN_EMAIL
 * (disponible tanto en cliente como en servidor). Al iniciar sesión con ese
 * email, el login redirige a /admin; el resto de cuentas van a su dashboard.
 */
export function emailAdmin(): string {
  return (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? '').trim();
}

export function esAdmin(email: string | null | undefined): boolean {
  const admin = emailAdmin();
  if (!admin || !email) return false;
  return email.trim().toLowerCase() === admin.toLowerCase();
}
