// Hojas compactas para revisar el retoque: por cada foto, una fila con el antes, el después y un recorte del después
// a tamaño real (para ver si la textura quedó natural o «pintada»). Tres fotos por hoja.
// Uso: node scripts/revision-retoque.mjs [claves separadas por coma] [--x=50 --y=55]   (centro del recorte, en %)
import { RAIZ } from './_raiz.mjs';
import sharp from 'sharp';
import { readFileSync, readdirSync, mkdirSync } from 'node:fs';
const PAQ = 'E:/hoteles-contenido/para-retocar', sal = RAIZ + '.capturas/retoque'; mkdirSync(sal, { recursive: true });
const op = (n, d) => +((process.argv.find((a) => a.startsWith('--' + n + '=')) || '').slice(n.length + 3) || d);
const cx = op('x', 50), cy = op('y', 55), POR = op('por', 3), H = op('alto', 420), R = op('recorte', 420);
const CARP = (process.argv.find((a) => a.startsWith('--carpeta=')) || '').slice(10) || 'devueltas';   // «devueltas-2» para la segunda ronda
const MAN = (process.argv.find((a) => a.startsWith('--manifiesto=')) || '').slice(13) || 'manifiesto.json';   // «manifiesto-3.json» para la tercera ronda
const man = JSON.parse(readFileSync(PAQ + '/' + MAN, 'utf8'));
const dev = readdirSync(PAQ + '/' + CARP).filter((x) => /\.(jpe?g|png|webp)$/i.test(x));
const pedir = (process.argv.slice(2).find((a) => !a.startsWith('--')) || '').split(',').filter(Boolean);
const lista = man.filter((m) => !pedir.length || pedir.includes(m.clave));
const rot = (t, w) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="30"><rect width="100%" height="100%" fill="#111"/><text x="8" y="21" font-family="Arial" font-size="15" fill="#fff">${t.replace(/[<>&]/g, '')}</text></svg>`);
let hoja = 0;
for (let i = 0; i < lista.length; i += POR) {
  const piezas = []; let y = 0, W = 0;
  for (const m of lista.slice(i, i + POR)) {
    const f = dev.find((x) => x.toUpperCase().startsWith(m.clave)); if (!f) continue;
    const ruta = `${PAQ}/${CARP}/${f}`, info = await sharp(ruta).metadata();
    const a = await sharp(m.origen).rotate().resize({ height: H }).jpeg({ quality: 88 }).toBuffer({ resolveWithObject: true });
    const d = await sharp(ruta).resize({ height: H }).jpeg({ quality: 88 }).toBuffer({ resolveWithObject: true });
    const left = Math.max(0, Math.min(info.width - R, Math.round(info.width * cx / 100 - R / 2))), top = Math.max(0, Math.min(info.height - R, Math.round(info.height * cy / 100 - R / 2)));
    const c = await sharp(ruta).extract({ left, top, width: R, height: R }).jpeg({ quality: 92 }).toBuffer();
    const x2 = a.info.width + 6, x3 = x2 + d.info.width + 6;
    piezas.push({ input: a.data, left: 0, top: y }, { input: d.data, left: x2, top: y }, { input: c, left: x3, top: y + H - R },
      { input: rot(`${m.clave} ANTES ${m.ancho}×${m.alto} · ${m.uso}`.slice(0, 120), x3 + R), left: 0, top: y + H });
    W = Math.max(W, x3 + R); y += H + 36;
  }
  if (!piezas.length) continue;
  const nombre = `${sal}/revision-${pedir.length ? pedir.join('-').slice(0, 40) : String(++hoja).padStart(2, '0')}.jpg`;
  await sharp({ create: { width: W, height: y, channels: 3, background: '#555' } }).composite(piezas).jpeg({ quality: 88 }).toFile(nombre);
  console.log(nombre);
}
