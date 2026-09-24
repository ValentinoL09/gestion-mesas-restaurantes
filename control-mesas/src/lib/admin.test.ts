import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { esAdmin } from './admin';

const ADMIN = 'admin@ejemplo.com';

beforeEach(() => {
  process.env.NEXT_PUBLIC_ADMIN_EMAIL = ADMIN;
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_ADMIN_EMAIL;
});

describe('esAdmin', () => {
  it('devuelve true para el email exacto del admin', () => {
    expect(esAdmin(ADMIN)).toBe(true);
  });

  it('ignora mayúsculas y espacios', () => {
    expect(esAdmin(` ${ADMIN.toUpperCase()} `)).toBe(true);
  });

  it('devuelve false para cualquier otro email', () => {
    expect(esAdmin('dueno@restaurante.com')).toBe(false);
  });

  it('devuelve false para null o undefined', () => {
    expect(esAdmin(null)).toBe(false);
    expect(esAdmin(undefined)).toBe(false);
  });

  it('devuelve false si no hay admin configurado', () => {
    delete process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    expect(esAdmin(ADMIN)).toBe(false);
  });
});
