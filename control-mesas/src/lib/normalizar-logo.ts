/**
 * Normaliza los logos que suben los restaurantes para que todos se vean
 * igual, sin importar las dimensiones con las que llegan.
 *
 * El problema: un `h-10 w-auto` en CSS normaliza el ALTO, así que un logo
 * cuadrado de 1080x1074 se ve diminuto al lado de uno panorámico de 4:1, y
 * un archivo con mucho margen vacío se ve más chico que el arte real.
 *
 * La solución en dos pasos:
 *  1. acá (una sola vez, al subir): recortar el margen vacío y dejar el lado
 *     más largo en exactamente LADO_CANONICO px, en PNG para conservar alfa;
 *  2. en el CSS: una caja fija con `object-contain`, que ya no depende de la
 *     proporción del archivo.
 *
 * La lógica de recorte vive en funciones puras (`detectarModo`,
 * `buscarContenido`, `resolverCorte`, `calcularSalida`) porque son las que se
 * pueden testear sin canvas; `normalizarLogo` solo orquesta el dibujo.
 */

export type ModoRecorte = 'alfa' | 'opaco';
export type Rect = { x: number; y: number; ancho: number; alto: number };

/** Lado más largo de la imagen ya normalizada. */
export const LADO_CANONICO = 512;

/** Lado más largo con el que se analiza el recorte, para no traer millones de píxeles a memoria. */
const LADO_ANALISIS = 512;

/** Margen que se deja alrededor del arte, como fracción del lado mayor. */
const PADDING = 0.04;

/** `alpha` >= 250 cuenta como opaco al detectar el modo. */
const UMBRAL_OPACO = 250;

/** Proporción mínima de píxeles transparentes para asumir que hay canal alfa. */
const PROPORCION_TRANSPARENTE = 0.05;

/** `alpha` >= 8 cuenta como contenido en modo 'alfa'. */
const UMBRAL_ALFA = 8;

/** r, g y b >= 245 cuentan como blanco (padding de un JPEG o PNG sin alfa). */
const UMBRAL_BLANCO = 245;

/** Total de píxeles transparentes según el criterio del modo. */
function contarTransparentes(datos: Uint8ClampedArray): number {
  let total = 0;
  for (let i = 3; i < datos.length; i += 4) {
    if (datos[i] < UMBRAL_OPACO) total += 1;
  }
  return total;
}

/**
 * Un logo blanco sobre fondo transparente y uno oscuro sobre fondo blanco
 * necesitan criterios opuestos: si se usara uno solo, el primero se recortaría
 * a la nada. Se decide por el canal alfa y, si hay poco, se asume opaco.
 */
export function detectarModo(datos: Uint8ClampedArray): ModoRecorte {
  const pixeles = datos.length / 4;
  if (pixeles === 0) return 'opaco';
  return contarTransparentes(datos) / pixeles > PROPORCION_TRANSPARENTE ? 'alfa' : 'opaco';
}

function esContenido(datos: Uint8ClampedArray, indice: number, modo: ModoRecorte): boolean {
  if (datos[indice + 3] < UMBRAL_ALFA) return false;
  if (modo === 'alfa') return true;
  const blanco =
    datos[indice] >= UMBRAL_BLANCO &&
    datos[indice + 1] >= UMBRAL_BLANCO &&
    datos[indice + 2] >= UMBRAL_BLANCO;
  return !blanco;
}

/** Rectángulo que envuelve al contenido, o `null` si la imagen está vacía. */
export function buscarContenido(
  datos: Uint8ClampedArray,
  ancho: number,
  alto: number,
  modo: ModoRecorte
): Rect | null {
  let minX = ancho;
  let minY = alto;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < alto; y += 1) {
    for (let x = 0; x < ancho; x += 1) {
      if (!esContenido(datos, (y * ancho + x) * 4, modo)) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < 0) return null;
  return { x: minX, y: minY, ancho: maxX - minX + 1, alto: maxY - minY + 1 };
}

/**
 * Traduce el rectángulo encontrado en la imagen analizada (reducida) a
 * coordenadas de la imagen original, redondeando hacia afuera para no cortar
 * ni un píxel del arte.
 */
export function resolverCorte(
  rect: Rect | null,
  escala: number,
  original: { ancho: number; alto: number }
): Rect | null {
  if (!rect || escala <= 0) return null;

  const x = Math.max(0, Math.floor(rect.x / escala));
  const y = Math.max(0, Math.floor(rect.y / escala));
  const derecha = Math.min(original.ancho, Math.ceil((rect.x + rect.ancho) / escala));
  const abajo = Math.min(original.alto, Math.ceil((rect.y + rect.alto) / escala));
  const ancho = derecha - x;
  const alto = abajo - y;

  if (ancho <= 0 || alto <= 0) return null;
  return { x, y, ancho, alto };
}

/**
 * Deja el lado más largo en LADO_CANONICO. Siempre amplía también: un logo de
 * 200px se vería más chico que el resto en la caja fija, que es justo lo que
 * se busca evitar.
 */
export function calcularSalida(ancho: number, alto: number): { ancho: number; alto: number } {
  if (ancho <= 0 || alto <= 0) return { ancho: LADO_CANONICO, alto: LADO_CANONICO };
  const escala = LADO_CANONICO / Math.max(ancho, alto);
  return {
    ancho: Math.max(1, Math.round(ancho * escala)),
    alto: Math.max(1, Math.round(alto * escala)),
  };
}

function crearCanvas(ancho: number, alto: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Sin contexto 2D');
  return { canvas, ctx };
}

async function decodificar(archivo: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') return await createImageBitmap(archivo);

  const url = URL.createObjectURL(archivo);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('No se pudo decodificar la imagen'));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function conPadding(corte: Rect, limite: { ancho: number; alto: number }): Rect {
  const pad = Math.round(PADDING * Math.max(corte.ancho, corte.alto));
  const x = Math.max(0, corte.x - pad);
  const y = Math.max(0, corte.y - pad);
  return {
    x,
    y,
    ancho: Math.min(limite.ancho - x, corte.ancho + pad * 2),
    alto: Math.min(limite.alto - y, corte.alto + pad * 2),
  };
}

/**
 * Devuelve el mismo archivo si no se puede normalizar, para que un formato
 * raro nunca deje al restaurante sin poder subir su logo.
 */
export async function normalizarLogo(archivo: File): Promise<File> {
  let imagen: ImageBitmap | HTMLImageElement;
  try {
    imagen = await decodificar(archivo);
  } catch {
    return archivo;
  }

  try {
    const original = { ancho: imagen.width, alto: imagen.height };
    const escala = Math.min(1, LADO_ANALISIS / Math.max(original.ancho, original.alto));
    const analisis = crearCanvas(
      Math.max(1, Math.round(original.ancho * escala)),
      Math.max(1, Math.round(original.alto * escala))
    );
    analisis.ctx.drawImage(imagen, 0, 0, analisis.canvas.width, analisis.canvas.height);
    const datos = analisis.ctx.getImageData(0, 0, analisis.canvas.width, analisis.canvas.height).data;

    const modo = detectarModo(datos);
    const buscar = (m: ModoRecorte) => resolverCorte(buscarContenido(datos, analisis.canvas.width, analisis.canvas.height, m), escala, original);

    // Fallback en cascada: si el modo detectado no encuentra nada (por ejemplo,
    // un PNG con alfa casi total y solo arte blanco), se prueba el otro criterio
    // y por último se usa la imagen entera.
    const corte = buscar(modo) ?? buscar(modo === 'alfa' ? 'opaco' : 'alfa') ?? { x: 0, y: 0, ...original };
    const recorte = conPadding(corte, original);
    const salida = calcularSalida(recorte.ancho, recorte.alto);

    const { canvas, ctx } = crearCanvas(salida.ancho, salida.alto);
    ctx.drawImage(imagen, recorte.x, recorte.y, recorte.ancho, recorte.alto, 0, 0, salida.ancho, salida.alto);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return archivo;

    const nombre = archivo.name.replace(/\.[^.]+$/, '') || 'logo';
    return new File([blob], `${nombre}.png`, { type: 'image/png', lastModified: Date.now() });
  } catch {
    return archivo;
  } finally {
    if ('close' in imagen) imagen.close();
  }
}
