import { describe, it, expect } from 'vitest';
import type { NextRequest } from 'next/server';
import {
  emailValido,
  enteroEnRango,
  colorHexValido,
  urlValida,
  limpiarTexto,
  textoEnRango,
  mismoOrigen,
  LIMITE_URL,
} from './validacion';

const peticion = (headers: Record<string, string> | null) => {
  const h = headers ? new Headers(headers) : new Headers();
  return { headers: h } as unknown as NextRequest;
};

describe('limpiarTexto', () => {
  it('recorta espacios', () => {
    expect(limpiarTexto('  hola  ')).toBe('hola');
  });

  it('devuelve null para vacío, espacios o no-string', () => {
    expect(limpiarTexto('   ')).toBe(null);
    expect(limpiarTexto('')).toBe(null);
    expect(limpiarTexto(123)).toBe(null);
    expect(limpiarTexto(null)).toBe(null);
  });
});

describe('textoEnRango', () => {
  it('valida el límite superior', () => {
    expect(textoEnRango('a'.repeat(120), 1, 120)).toBe(true);
    expect(textoEnRango('a'.repeat(121), 1, 120)).toBe(false);
    expect(textoEnRango('', 1, 120)).toBe(false);
  });

  it('devuelve false para valores que no son string', () => {
    expect(textoEnRango(null, 1, 120)).toBe(false);
    expect(textoEnRango(42, 1, 120)).toBe(false);
  });
});

describe('emailValido', () => {
  it('acepta emails normales', () => {
    expect(emailValido('dueno@restaurante.com')).toBe(true);
    expect(emailValido('  nombre.apellido@dominio.ar  ')).toBe(true);
  });

  it('rechaza emails sin @, sin dominio o con espacios internos', () => {
    expect(emailValido('solo-algo')).toBe(false);
    expect(emailValido('a@b')).toBe(false);
    expect(emailValido('un email@x.com')).toBe(false);
  });

  it('rechaza emails más largos que 254 caracteres', () => {
    expect(emailValido(`${'a'.repeat(250)}@x.com`)).toBe(false);
  });
});

describe('enteroEnRango', () => {
  it('devuelve el entero si está dentro del rango', () => {
    expect(enteroEnRango(5, 1, 10)).toBe(5);
    expect(enteroEnRango('7', 1, 10)).toBe(7);
  });

  it('devuelve null fuera de rango o no entero', () => {
    expect(enteroEnRango(0, 1, 10)).toBe(null);
    expect(enteroEnRango(11, 1, 10)).toBe(null);
    expect(enteroEnRango(1.5, 1, 10)).toBe(null);
    expect(enteroEnRango('abc', 1, 10)).toBe(null);
    expect(enteroEnRango(null, 1, 10)).toBe(null);
  });
});

describe('colorHexValido', () => {
  it('acepta #rgb y #rrggbb', () => {
    expect(colorHexValido('#abc')).toBe('#abc');
    expect(colorHexValido('#A1B2C3')).toBe('#A1B2C3');
    expect(colorHexValido('  #123456  ')).toBe('#123456');
  });

  it('rechaza formatos inválidos', () => {
    expect(colorHexValido('rojo')).toBeNull();
    expect(colorHexValido('#12')).toBeNull();
    expect(colorHexValido('#12345g')).toBeNull();
    expect(colorHexValido('')).toBeNull();
    expect(colorHexValido(null)).toBeNull();
  });
});

describe('urlValida', () => {
  it('acepta enlaces http(s) y rutas relativas', () => {
    expect(urlValida('https://g.page/r/abc/review')).toBe('https://g.page/r/abc/review');
    expect(urlValida('/carta.pdf')).toBe('/carta.pdf');
  });

  it('rechaza esquemas peligrosos', () => {
    expect(urlValida('javascript:alert(1)')).toBeNull();
    expect(urlValida('data:text/html,<script>x</script>')).toBeNull();
  });

  it('rechaza vacío y URLs demasiado largas', () => {
    expect(urlValida('')).toBeNull();
    expect(urlValida('   ')).toBeNull();
    expect(urlValida(null)).toBeNull();
    expect(urlValida(`https://x.com/${'a'.repeat(LIMITE_URL)}`)).toBeNull();
  });
});

describe('mismoOrigen', () => {
  it('devuelve true si el Origin coincide con el Host', () => {
    const req = peticion({ origin: 'https://app.ejemplo.com', host: 'app.ejemplo.com' });
    expect(mismoOrigen(req)).toBe(true);
  });

  it('devuelve true si no viene cabecera Origin (curl, navegación directa)', () => {
    expect(mismoOrigen(peticion({ host: 'app.ejemplo.com' }))).toBe(true);
  });

  it('devuelve false si el Origin no coincide', () => {
    const req = peticion({ origin: 'https://otro.com', host: 'app.ejemplo.com' });
    expect(mismoOrigen(req)).toBe(false);
  });

  it('devuelve false si el Origin es inválido o falta el Host', () => {
    expect(mismoOrigen(peticion({ origin: 'no es una url', host: 'app.ejemplo.com' }))).toBe(false);
    expect(mismoOrigen(peticion({ origin: 'https://app.ejemplo.com' }))).toBe(false);
  });
});