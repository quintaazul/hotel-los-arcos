// ¿La foto devuelta ganó detalle de verdad o solo se estiró? Compara cada devuelta contra su original ampliada de la
// forma normal (sin inteligencia), en tres recortes: cuánto se parece (diferencia media) y cuánta nitidez tiene.
//   nitidez ≈ 1.0  → no ganó detalle: es un estirado simple
//   nitidez ≥ 1.4  → sí hay detalle nuevo
//   diferencia alta → la imagen cambió (esperado en el grupo B, que se retoca; sospechoso en el grupo A)
// Uso: node scripts/medir-retoque.mjs
import sharp from 'sharp';
import { readFileSync, readdirSync } from 'node:fs';
const PAQ = 'E:/hoteles-contenido/para-retocar';
const CARP = (process.argv.find((a) => a.startsWith('--carpeta=')) || '').slice(10) || 'devueltas';   // «devueltas-2» para la segunda ronda
const MAN = (process.argv.find((a) => a.startsWith('--manifiesto=')) || '').slice(13) || 'manifiesto.json';   // «manifiesto-3.json» para la tercera ronda
const man = JSON.parse(readFileSync(PAQ + '/' + MAN, 'utf8'));
const dev = readdirSync(PAQ + '/' + CARP).filter((x) => /\.(jpe?g|png|webp)$/i.test(x));
const R = 768;
const nitidez = (d, w, h) => { let s = 0, n = 0; for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x, l = 4 * d[i] - d[i - 1] - d[i + 1] - d[i - w] - d[i + w]; s += l * l; n++; } return Math.sqrt(s / n); };
const filas = [];
for (const m of man) {
  const f = dev.find((x) => x.toUpperCase().startsWith(m.clave)); if (!f) continue;
  const ruta = `${PAQ}/${CARP}/${f}`, i = await sharp(ruta).metadata();
  const normal = await sharp(m.origen).rotate().resize(i.width, i.height, { fit: 'fill', kernel: 'lanczos3' }).greyscale().raw().toBuffer();
  const vuelta = await sharp(ruta).greyscale().raw().toBuffer();
  let nN = 0, nV = 0, dif = 0, k = 0;
  for (const [fx, fy] of [[0.3, 0.35], [0.6, 0.55], [0.5, 0.75]]) {
    const x0 = Math.max(0, Math.min(i.width - R, Math.round(i.width * fx - R / 2))), y0 = Math.max(0, Math.min(i.height - R, Math.round(i.height * fy - R / 2)));
    const a = Buffer.allocUnsafe(R * R), b = Buffer.allocUnsafe(R * R);
    for (let y = 0; y < R; y++) { normal.copy(a, y * R, (y0 + y) * i.width + x0, (y0 + y) * i.width + x0 + R); vuelta.copy(b, y * R, (y0 + y) * i.width + x0, (y0 + y) * i.width + x0 + R); }
    nN += nitidez(a, R, R); nV += nitidez(b, R, R);
    let d = 0; for (let j = 0; j < R * R; j++) d += Math.abs(a[j] - b[j]); dif += d / (R * R); k++;
  }
  filas.push({ c: m.clave, g: m.grupo, tam: `${i.width}×${i.height}`, f: m.factor, nit: nV / nN, dif: dif / k });
}
if (!filas.length) { console.log(`Todavía no hay fotos en «${CARP}».`); process.exit(0); }
for (const x of filas) console.log(`${x.c}  ${x.tam.padEnd(10)} ×${String(x.f).padEnd(3)}  nitidez ${x.nit.toFixed(2).padStart(5)}  diferencia ${x.dif.toFixed(1).padStart(5)}   ${x.g === 'A' ? (x.nit < 1.25 ? 'solo estirada' : 'ganó detalle') + (x.dif > 9 ? ' · CAMBIÓ la imagen' : '') : (x.nit < 1.25 ? 'retocada, sin detalle nuevo' : 'retocada y con detalle')}`);
const a = filas.filter((x) => x.g === 'A'), b = filas.filter((x) => x.g === 'B'), med = (l, k) => (l.reduce((s, x) => s + x[k], 0) / l.length).toFixed(2);
console.log(`\nGrupo A: nitidez media ${med(a, 'nit')}, diferencia media ${med(a, 'dif')}  ·  Grupo B: nitidez media ${med(b, 'nit')}, diferencia media ${med(b, 'dif')}`);
