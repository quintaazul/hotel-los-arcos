// Recibe las fotos que regresan del retoque con IA (carpeta «devueltas» del paquete) y las revisa contra su original:
// cuáles llegaron, si tienen el tamaño pedido y si conservan la proporción. Arma hojas de antes y después, completas
// y de cerca, para mirarlas una por una antes de meter nada al sitio. No cambia el sitio.
// Uso: node scripts/recibir-retoque.mjs [carpeta del paquete]
import { RAIZ } from './_raiz.mjs';
import sharp from 'sharp';
import { readFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
const PAQ = (process.argv[2] || 'E:/hoteles-contenido/para-retocar').replace(/\\/g, '/');
const CARP = (process.argv.find((a) => a.startsWith('--carpeta=')) || '').slice(10) || 'devueltas';   // «devueltas-2» para la segunda ronda
const man = JSON.parse(readFileSync(PAQ + '/manifiesto.json', 'utf8'));
const dev = existsSync(PAQ + '/' + CARP) ? readdirSync(PAQ + '/' + CARP).filter((x) => /\.(jpe?g|png|webp|jfif)$/i.test(x)) : [];
const sal = RAIZ + '.capturas/retoque'; mkdirSync(sal, { recursive: true });
const rotulo = (t, w) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="34"><rect width="100%" height="100%" fill="#111"/><text x="8" y="23" font-family="Arial" font-size="16" fill="#fff">${t.replace(/[<>&]/g, '')}</text></svg>`);
let llegaron = 0; const avisos = [];
for (const m of man) {
  const f = dev.find((x) => x.toUpperCase().startsWith(m.clave));
  if (!f) { console.log(`  —  ${m.clave}  no ha llegado  (${m.que})`); continue; }
  llegaron++;
  const ruta = `${PAQ}/${CARP}/${f}`, i = await sharp(ruta).rotate().metadata();
  const propA = m.ancho / m.alto, propD = i.width / i.height, desvio = Math.abs(propD / propA - 1) * 100, largo = Math.max(i.width, i.height);
  const notas = [];
  if (desvio > 2.5) notas.push(`cambió la proporción ${desvio.toFixed(1)} %`);
  if (largo < 3000) notas.push(`lado largo de ${largo} px (se pidió ${Math.max(m.pedirAncho, m.pedirAlto)})`);
  if (largo <= Math.max(m.ancho, m.alto)) notas.push('no creció');
  console.log(`  ${notas.length ? '!' : '✓'}  ${m.clave}  ${m.ancho}×${m.alto} → ${i.width}×${i.height}${notas.length ? '  ← ' + notas.join('; ') : ''}`);
  if (notas.length) avisos.push(m.clave);
  // Hoja: arriba las dos completas; abajo el mismo recorte del centro, al tamaño real de la devuelta
  const H = 620, a = await sharp(m.origen).rotate().resize({ height: H }).jpeg({ quality: 86 }).toBuffer({ resolveWithObject: true }), d = await sharp(ruta).rotate().resize({ height: H }).jpeg({ quality: 86 }).toBuffer({ resolveWithObject: true });
  const R = Math.min(700, i.width, i.height), corte = async (src, w, h) => sharp(await sharp(src).rotate().resize(i.width, i.height, { fit: 'fill', kernel: 'lanczos3' }).toBuffer()).extract({ left: Math.round((i.width - R) / 2), top: Math.round((i.height - R) * 0.55), width: R, height: R }).jpeg({ quality: 90 }).toBuffer();
  const ca = await corte(m.origen), cd = await corte(ruta);
  const W = Math.max(a.info.width + d.info.width + 6, R * 2 + 6);
  await sharp({ create: { width: W, height: H + 34 + R + 34, channels: 3, background: '#444' } }).composite([
    { input: a.data, left: 0, top: 0 }, { input: d.data, left: a.info.width + 6, top: 0 },
    { input: rotulo(`${m.clave} · ANTES ${m.ancho}×${m.alto} · ${m.uso}`, a.info.width), left: 0, top: H }, { input: rotulo(`DESPUÉS ${i.width}×${i.height}`, d.info.width), left: a.info.width + 6, top: H },
    { input: ca, left: 0, top: H + 34 }, { input: cd, left: R + 6, top: H + 34 },
    { input: rotulo('antes, de cerca (ampliada normal)', R), left: 0, top: H + 34 + R }, { input: rotulo('después, de cerca', R), left: R + 6, top: H + 34 + R },
  ]).jpeg({ quality: 88 }).toFile(`${sal}/${m.clave}.jpg`);
}
console.log(`\nLlegaron ${llegaron} de ${man.length}. ${avisos.length ? 'Con avisos: ' + avisos.join(', ') + '. ' : ''}Hojas de antes y después en ${sal}`);
