// Velo de las portadas: cuánto hay que oscurecer cada foto para que el texto blanco se lea.
// No todas las fotos necesitan lo mismo: una sierra oscura casi nada, una pared blanca bastante. Cada portada lleva
// cuatro valores: el sombreado del bloque del título (t) y el de la franja de arriba, donde van el menú y las migas
// (a), y sus pares para pantallas de pie (tm, am). Los usa «.portada.sombreada::after» en interiores.css.
//
// De dónde salen:
//  1. De src/data/velos.json, si la foto ya está ahí. Esos valores los MIDE `node scripts/legibilidad.mjs … --ajustar`
//     sobre el sitio armado: el mínimo con el que todo el texto de la portada pasa 4.5 a 1 (WCAG AA) en todos los
//     tamaños de pantalla. Es lo que vale.
//  2. Si la foto es nueva y todavía no se ha medido, de un cálculo aproximado al compilar (lo más claro de las zonas
//     donde suele ir texto). Sirve para salir del paso; después hay que correr el ajuste.
import sharp from 'sharp';
import { join } from 'node:path';
import guardados from '../data/velos.json';

type Velo = { t: number; a: number; tm: number; am: number };
/** Nombre con el que se guarda el velo de una portada: hotel, foto de celular y foto apaisada. */
export const claveVelo = (hotel: string, vertical: string, ancha?: string) => hotel + '|' + vertical + '|' + (ancha || '');

const lin = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
// Valor de pantalla (0 a 1) de lo más claro de una zona (percentil 92), con la foto recortada como la recorta la
// pantalla («object-fit: cover») para esa proporción.
async function claro(ruta: string, proporcion: number, x0: number, y0: number, x1: number, y1: number): Promise<number> {
  const W = 96, H = Math.max(24, Math.round(W / proporcion));
  const { data } = await sharp(ruta).rotate().resize(W, H, { fit: 'cover' }).removeAlpha().toColourspace('srgb').raw().toBuffer({ resolveWithObject: true });
  const L: number[] = [];
  for (let y = Math.floor(y0 * H); y < Math.ceil(y1 * H); y++) for (let x = Math.floor(x0 * W); x < Math.ceil(x1 * W); x++) { const i = (y * W + x) * 3; L.push(0.2126 * lin(data[i]) + 0.7152 * lin(data[i + 1]) + 0.0722 * lin(data[i + 2])); }
  L.sort((a, b) => a - b);
  const l = L[Math.floor(L.length * 0.92)] ?? 0;
  return l <= 0.0031308 ? l * 12.92 : 1.055 * l ** (1 / 2.4) - 0.055;
}
// Opacidad del velo (casi negro) para llevar ese valor a 0.40, que contra blanco da unos 5.4 a 1.
const META = 0.4, NOCHE = 0.06;
const opacidad = (v: number, min: number, max: number) => +Math.min(max, Math.max(min, (v - META) / (v - NOCHE))).toFixed(2);
const css = (v: Velo) => `--velo-t:${v.t};--velo-a:${v.a};--velo-tm:${v.tm};--velo-am:${v.am}`;

const hechos = new Map<string, Promise<string>>();
/** Variables de CSS con el velo de una portada. `vertical`: la foto de celular; `ancha`: la de pantallas apaisadas. */
export function velo(hotel: string, vertical: string, ancha?: string): Promise<string> {
  const k = claveVelo(hotel, vertical, ancha), medido = (guardados as Record<string, Velo>)[k];
  if (medido) return Promise.resolve(css(medido));
  if (!hechos.has(k)) hechos.set(k, (async () => {
    const dir = join(process.cwd(), 'src', 'assets', hotel), v = join(dir, vertical), a = join(dir, ancha || vertical);
    try {
      const [t, ar, tm, arm] = await Promise.all([claro(a, 2, 0, 0.26, 0.66, 1), claro(a, 2, 0, 0, 1, 0.16), claro(v, 0.56, 0, 0.16, 1, 1), claro(v, 0.56, 0, 0, 1, 0.16)]);
      return css({ t: opacidad(t, 0.34, 0.68), a: opacidad(ar, 0.3, 0.68), tm: opacidad(tm, 0.4, 0.7), am: opacidad(arm, 0.34, 0.7) });
    } catch {
      // No se pudo leer la foto (en el taller el proceso arranca desde otra carpeta): un velo medio, que no tumba la página.
      return css({ t: 0.5, a: 0.5, tm: 0.56, am: 0.56 });
    }
  })());
  return hechos.get(k)!;
}
