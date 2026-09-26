import { describe, it, expect } from 'vitest';
import {
  buscarContenido,
  calcularSalida,
  detectarModo,
  resolverCorte,
} from './normalizar-logo';

type EspecificacionP = { x: number; y: number; r: number; g: number; b: number; a?: number };

/** Fondo por defecto: blanco opaco, como el que trae un JPEG. */
const BLANCO: EspecificacionP = { x: 0, y: 0, r: 255, g: 255, b: 255, a: 255 };

/** Arma un buffer RGBA como el que devuelve `ctx.getImageData`. */
function pintar(
  ancho: number,
  alto: number,
  pixeles: EspecificacionP[],
  fondo: Partial<EspecificacionP> = {}
): Uint8ClampedArray {
  const base = { ...BLANCO, ...fondo };
  const datos = new Uint8ClampedArray(ancho * alto * 4);
  for (let i = 0; i < datos.length; i += 4) {
    datos[i] = base.r;
    datos[i + 1] = base.g;
    datos[i + 2] = base.b;
    datos[i + 3] = base.a ?? 255;
  }
  for (const p of pixeles) {
    const i = (p.y * ancho + p.x) * 4;
    datos[i] = p.r;
    datos[i + 1] = p.g;
    datos[i + 2] = p.b;
    datos[i + 3] = p.a ?? 255;
  }
  return datos;
}

/** Rectángulo lleno del color indicado. */
function bloque(x: number, y: number, ancho: number, alto: number, color: Partial<EspecificacionP> = {}) {
  const pixeles: EspecificacionP[] = [];
  for (let dy = 0; dy < alto; dy += 1) {
    for (let dx = 0; dx < ancho; dx += 1) {
      pixeles.push({ x: x + dx, y: y + dy, r: 20, g: 20, b: 20, ...color });
    }
  }
  return pixeles;
}

describe('detectarModo', () => {
  it('usa el canal alfa cuando la imagen tiene fondo transparente', () => {
    const datos = pintar(10, 10, bloque(4, 4, 2, 2), { a: 0 });
    expect(detectarModo(datos)).toBe('alfa');
  });

  it('asume fondo opaco cuando la imagen no tiene transparencia', () => {
    const datos = pintar(4, 4, bloque(0, 0, 4, 4));
    expect(detectarModo(datos)).toBe('opaco');
  });

  it('no confunde un rincón transparente con una imagen con canal alfa', () => {
    // 1 de 100 píxeles transparentes (1%) no alcanza el umbral del 5%.
    const pixeles = [...bloque(0, 0, 10, 10), ...bloque(0, 0, 1, 1, { a: 0 })];
    expect(detectarModo(pintar(10, 10, pixeles))).toBe('opaco');
  });

  it('un buffer vacío no revienta', () => {
    expect(detectarModo(new Uint8ClampedArray(0))).toBe('opaco');
  });
});

describe('buscarContenido', () => {
  it('encuentra el arte dentro de un JPEG con margen blanco', () => {
    const datos = pintar(10, 6, bloque(3, 2, 4, 2));
    expect(buscarContenido(datos, 10, 6, 'opaco')).toEqual({ x: 3, y: 2, ancho: 4, alto: 2 });
  });

  it('conserva el arte blanco de un PNG con fondo transparente', () => {
    const datos = pintar(6, 6, bloque(2, 1, 3, 4, { r: 255, g: 255, b: 255, a: 255 }), { a: 0 });
    expect(buscarContenido(datos, 6, 6, 'alfa')).toEqual({ x: 2, y: 1, ancho: 3, alto: 4 });
  });

  it('un fondo transparente y negro no se confunde con arte', () => {
    const datos = pintar(8, 8, bloque(3, 3, 2, 2), { r: 0, g: 0, b: 0, a: 0 });
    expect(buscarContenido(datos, 8, 8, 'opaco')).toEqual({ x: 3, y: 3, ancho: 2, alto: 2 });
  });

  it('detecta el arte pegado al borde izquierdo y superior', () => {
    const datos = pintar(8, 8, bloque(0, 0, 2, 2));
    expect(buscarContenido(datos, 8, 8, 'opaco')).toEqual({ x: 0, y: 0, ancho: 2, alto: 2 });
  });

  it('devuelve null si no queda nada visible', () => {
    const datos = pintar(5, 5, bloque(0, 0, 5, 5, { a: 0 }));
    expect(buscarContenido(datos, 5, 5, 'alfa')).toBeNull();
  });

  it('devuelve el marco completo si el arte lo cubre todo', () => {
    const datos = pintar(4, 3, bloque(0, 0, 4, 3));
    expect(buscarContenido(datos, 4, 3, 'opaco')).toEqual({ x: 0, y: 0, ancho: 4, alto: 3 });
  });
});

describe('resolverCorte', () => {
  it('mapea el rectángulo de la imagen reducida al original', () => {
    const original = { ancho: 1080, alto: 1074 };
    expect(resolverCorte({ x: 10, y: 20, ancho: 4, alto: 4 }, 0.5, original)).toEqual({
      x: 20,
      y: 40,
      ancho: 8,
      alto: 8,
    });
  });

  it('redondea hacia afuera para no comerse un píxel del arte', () => {
    expect(
      resolverCorte({ x: 3, y: 3, ancho: 4, alto: 4 }, 0.5, { ancho: 100, alto: 100 })
    ).toEqual({ x: 6, y: 6, ancho: 8, alto: 8 });
  });

  it('nunca se sale de los límites de la imagen original', () => {
    const corte = resolverCorte({ x: 0, y: 0, ancho: 10, alto: 10 }, 2, { ancho: 4, alto: 4 });
    expect(corte).toEqual({ x: 0, y: 0, ancho: 4, alto: 4 });
  });

  it('propaga null y no divide por una escala inválida', () => {
    expect(resolverCorte(null, 0.5, { ancho: 10, alto: 10 })).toBeNull();
    expect(resolverCorte({ x: 0, y: 0, ancho: 4, alto: 4 }, 0, { ancho: 10, alto: 10 })).toBeNull();
  });
});

describe('calcularSalida', () => {
  it('deja el lado más largo en 512', () => {
    expect(calcularSalida(1080, 1074)).toEqual({ ancho: 512, alto: 509 });
    expect(calcularSalida(4000, 1000)).toEqual({ ancho: 512, alto: 128 });
  });

  it('conserva la proporción en formatos verticales', () => {
    expect(calcularSalida(1000, 4000)).toEqual({ ancho: 128, alto: 512 });
  });

  it('amplía también los logos chicos para que no se vean menores', () => {
    expect(calcularSalida(200, 100)).toEqual({ ancho: 512, alto: 256 });
  });

  it('nunca devuelve una dimensión en cero', () => {
    expect(calcularSalida(0, 0)).toEqual({ ancho: 512, alto: 512 });
    expect(calcularSalida(600, 0)).toEqual({ ancho: 512, alto: 512 });
    const salida = calcularSalida(4000, 1);
    expect(salida.ancho).toBe(512);
    expect(salida.alto).toBe(1);
  });
});

describe('contrato de los helpers', () => {
  it('buscarContenido y resolverCorte se encadenan sin perder el arte', () => {
    const escala = 0.5;
    const original = { ancho: 1000, alto: 1000 };
    const analisis = pintar(500, 500, bloque(100, 50, 200, 100));
    const rect = buscarContenido(analisis, 500, 500, 'opaco');
    expect(resolverCorte(rect, escala, original)).toEqual({ x: 200, y: 100, ancho: 400, alto: 200 });
  });

  it('elegir mal el modo borraría un logo blanco de una imagen con alfa', () => {
    // Un wordmark blanco sobre fondo transparente. detectModo lo detecta como
    // 'alfa'; en modo 'opaco' el arte se confundiría con el fondo y la
    // imagen se recortaría a la nada.
    const datos = pintar(10, 10, bloque(2, 2, 3, 3, { r: 255, g: 255, b: 255, a: 255 }), { a: 0 });

    expect(detectarModo(datos)).toBe('alfa');
    expect(buscarContenido(datos, 10, 10, 'alfa')).toEqual({ x: 2, y: 2, ancho: 3, alto: 3 });
    expect(buscarContenido(datos, 10, 10, 'opaco')).toBeNull();
  });
});
