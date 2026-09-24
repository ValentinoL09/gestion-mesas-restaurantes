/**
 * Limitador de tasa en memoria (ventana deslizante). Es best-effort: en
 * entornos serverless el estado es por instancia, no global, pero alcanza
 * para frenar abuso básico sin infraestructura adicional.
 */

type Registro = { marcas: number[] };

const almacen = new Map<string, Registro>();
const MAX_CLAVES = 5000;

/** IP del cliente a partir de los headers del proxy. */
export function ipDe(request: { headers: { get(name: string): string | null } }): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip')?.trim() || 'desconocida';
}

/**
 * Registra un intento para `clave`. Devuelve true si está permitido, false si
 * se superó `max` intentos dentro de `ventanaMs`.
 */
export function limitar(clave: string, max: number, ventanaMs: number): boolean {
  const ahora = Date.now();

  // Poda ocasional para que el mapa no crezca sin límite.
  if (almacen.size > MAX_CLAVES) {
    for (const [k, v] of almacen) {
      v.marcas = v.marcas.filter((t) => ahora - t < ventanaMs);
      if (v.marcas.length === 0) almacen.delete(k);
    }
  }

  const registro = almacen.get(clave) ?? { marcas: [] };
  registro.marcas = registro.marcas.filter((t) => ahora - t < ventanaMs);

  if (registro.marcas.length >= max) {
    almacen.set(clave, registro);
    return false;
  }

  registro.marcas.push(ahora);
  almacen.set(clave, registro);
  return true;
}
