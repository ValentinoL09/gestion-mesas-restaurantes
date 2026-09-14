import { describe, it, expect } from 'vitest';
import { esAdmin, ADMIN_EMAIL } from './admin';

describe('esAdmin', () => {
  it('devuelve true para el email exacto del admin', () => {
    expect(esAdmin(ADMIN_EMAIL)).toBe(true);
  });

  it('ignora mayúsculas y espacios', () => {
    expect(esAdmin(` ${'lasagnovalentino@gmail.com'.toUpperCase()} `)).toBe(true);
  });

  it('devuelve false para cualquier otro email', () => {
    expect(esAdmin('dueno@restaurante.com')).toBe(false);
  });

  it('devuelve false para null o undefined', () => {
    expect(esAdmin(null)).toBe(false);
    expect(esAdmin(undefined)).toBe(false);
  });
});