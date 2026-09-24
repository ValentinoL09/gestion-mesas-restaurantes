import { describe, it, expect } from 'vitest';
import { limitar, ipDe } from './rateLimit';

describe('limitar', () => {
  it('permite hasta el máximo y luego rechaza el excedente', () => {
    const clave = `clave-${Math.random()}`;
    expect(limitar(clave, 3, 60_000)).toBe(true);
    expect(limitar(clave, 3, 60_000)).toBe(true);
    expect(limitar(clave, 3, 60_000)).toBe(true);
    expect(limitar(clave, 3, 60_000)).toBe(false);
  });

  it('mantiene ventanas independientes por clave', () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    expect(limitar(a, 1, 60_000)).toBe(true);
    expect(limitar(a, 1, 60_000)).toBe(false);
    expect(limitar(b, 1, 60_000)).toBe(true);
  });

  it('con ventana vencida vuelve a permitir', async () => {
    const clave = `vencida-${Math.random()}`;
    expect(limitar(clave, 1, 50)).toBe(true);
    expect(limitar(clave, 1, 50)).toBe(false);
    await new Promise((r) => setTimeout(r, 80));
    expect(limitar(clave, 1, 50)).toBe(true);
  });
});

describe('ipDe', () => {
  it('toma la primera IP de x-forwarded-for', () => {
    const req = { headers: new Headers({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1' }) };
    expect(ipDe(req)).toBe('1.2.3.4');
  });

  it('usa x-real-ip como respaldo', () => {
    const req = { headers: new Headers({ 'x-real-ip': '10.0.0.9' }) };
    expect(ipDe(req)).toBe('10.0.0.9');
  });

  it('devuelve "desconocida" si no hay headers', () => {
    expect(ipDe({ headers: new Headers() })).toBe('desconocida');
  });
});