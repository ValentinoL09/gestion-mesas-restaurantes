import type { NextRequest } from 'next/server';
import { urlSegura } from './utils';

export const LIMITE_NOMBRE = 120;
export const LIMITE_URL = 2048;
export const MAX_SUCURSALES = 20;
export const MAX_MESAS_POR_SUCURSAL = 200;
export const MIN_PASSWORD = 6;

/** Devuelve el texto recortado, o null si no es un string con contenido. */
export function limpiarTexto(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const texto = valor.trim();
  return texto.length > 0 ? texto : null;
}

/** true si el texto (recortado) tiene entre `min` y `max` caracteres. */
export function textoEnRango(valor: unknown, min: number, max: number): boolean {
  if (typeof valor !== 'string') return false;
  const texto = valor.trim();
  return texto.length >= min && texto.length <= max;
}

/** Validación pragmática de email (sin regex complejas). */
export function emailValido(valor: unknown): boolean {
  if (typeof valor !== 'string') return false;
  const email = valor.trim();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Entero dentro de [min, max]; null si no cumple. */
export function enteroEnRango(valor: unknown, min: number, max: number): number | null {
  const n = Number(valor);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
}

/** Color hexadecimal #rgb o #rrggbb; null si no es válido. */
export function colorHexValido(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const color = valor.trim();
  return /^#[0-9a-fA-F]{3}$/.test(color) || /^#[0-9a-fA-F]{6}$/.test(color) ? color : null;
}

/** URL http(s) válida y acotada en longitud; null si no lo es. */
export function urlValida(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const texto = valor.trim();
  if (!texto || texto.length > LIMITE_URL) return null;
  return urlSegura(texto);
}

/**
 * Defensa CSRF: true si la petición proviene del mismo origen que la sirve.
 * Si no viene cabecera Origin (p. ej. curl o navegación directa) se permite,
 * porque las cookies de Supabase son SameSite=Lax.
 */
export function mismoOrigen(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const host = request.headers.get('host');
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
