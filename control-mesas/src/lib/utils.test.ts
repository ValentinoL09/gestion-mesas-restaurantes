import { describe, it, expect } from 'vitest';
import { minutosTranscurridos, urlMesaQR } from './utils';

describe('minutosTranscurridos', () => {
  const ahora = new Date('2026-01-01T12:00:00Z');

  it('devuelve "ahora" para menos de un minuto', () => {
    const hace10Seg = new Date('2026-01-01T11:59:50Z').toISOString();
    expect(minutosTranscurridos(hace10Seg, ahora)).toBe('ahora');
  });

  it('devuelve 0 minutos si la diferencia es menor a 1', () => {
    const hace59Seg = new Date('2026-01-01T11:59:01Z').toISOString();
    expect(minutosTranscurridos(hace59Seg, ahora)).toBe('ahora');
  });

  it('devuelve la cantidad de minutos transcurridos', () => {
    const hace5 = new Date('2026-01-01T11:55:00Z').toISOString();
    expect(minutosTranscurridos(hace5, ahora)).toBe('hace 5 min');
  });

  it('devuelve 0 minutos si la fecha es futura (reloj ajustado)', () => {
    const futuro = new Date('2026-01-01T12:05:00Z').toISOString();
    expect(minutosTranscurridos(futuro, ahora)).toBe('ahora');
  });
});

describe('urlMesaQR', () => {
  it('concatena la base con /m/{mesaId}', () => {
    expect(urlMesaQR('https://app.ejemplo.com', 'abc-123')).toBe('https://app.ejemplo.com/m/abc-123');
  });

  it('respeta la base local en desarrollo', () => {
    expect(urlMesaQR('http://localhost:3000', 'xyz')).toBe('http://localhost:3000/m/xyz');
  });
});