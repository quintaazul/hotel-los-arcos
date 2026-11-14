// Logos y favicones. Los Arcos Inn (10 de noviembre de 2026): el mismo dibujo, sin la palabra «Hotel».
// Lo saca de los logos originales (se guardan una sola vez en respaldo/logos-con-hotel/) y deja:
//   src/assets/la/logo-blanco.png y logo-color.png  → los tres arcos con «Los Arcos Inn»
//   public/favicon-la.png                           → solo los tres arcos, en blanco sobre el naranja del logo
// Uso: node scripts/logos.mjs
import { RAIZ } from './_raiz.mjs';
import sharp from 'sharp';
import { existsSync, mkdirSync, copyFileSync } from 'node:fs';
const R = RAIZ, A = R + 'src/assets/la/', RES = R + 'respaldo/logos-con-hotel/';
mkdirSync(RES, { recursive: true });
for (const f of ['logo-blanco.png', 'logo-color.png']) if (!existsSync(RES + f)) copyFileSync(A + f, RES + f);
if (!existsSync(RES + 'favicon-la.png')) copyFileSync(R + 'public/favicon-la.png', RES + 'favicon-la.png');

// Dónde acaba «Los Arcos Inn» y dónde empieza «Hotel»: la primera fila vacía después de la mitad del dibujo
async function filas(f) {
  const { data, info } = await sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const n = []; for (let y = 0; y < info.height; y++) { let c = 0; for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > 40) c++; n.push(c); }
  return { n, w: info.width, h: info.height };
}
for (const f of ['logo-blanco.png', 'logo-color.png']) {
  const { n, w, h } = await filas(RES + f);
  const corte = n.findIndex((c, y) => y > h * 0.55 && c === 0);
  if (corte < 0) throw new Error('No encuentro el hueco entre el nombre y «Hotel» en ' + f);
  const i = await sharp(RES + f).extract({ left: 0, top: 0, width: w, height: corte }).trim({ threshold: 1 }).extend({ top: 6, bottom: 6, left: 6, right: 6, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png({ compressionLevel: 9 }).toFile(A + f);
  console.log(`${f}  ${w}×${h} → ${i.width}×${i.height}  (se quitó «Hotel» desde la fila ${corte})`);
}
// Favicon: los tres arcos solos. Los arcos terminan donde las filas dejan de cruzar casi todo el ancho.
{
  const { n, w, h } = await filas(RES + 'logo-blanco.png');
  // se cortan un poco antes de donde empiezan las letras altas del nombre (L, A, I), que se meten entre las patas
  const fin = Math.round(h * 0.49);
  const arcos = await sharp(RES + 'logo-blanco.png').extract({ left: 0, top: 0, width: w, height: fin }).trim({ threshold: 1 }).resize({ width: 204 }).toBuffer({ resolveWithObject: true });
  // el naranja se toma del logo de color
  const col = await sharp(RES + 'logo-color.png').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let naranja = { r: 232, g: 112, b: 10 };
  for (let x = 0, y = 14; x < col.info.width; x++) { const i = (y * col.info.width + x) * 4; if (col.data[i + 3] > 240) { const j = i + 4 * 10; naranja = { r: col.data[j], g: col.data[j + 1], b: col.data[j + 2] }; break; } }
  const fondo = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" rx="56" fill="rgb(${naranja.r},${naranja.g},${naranja.b})"/></svg>`);
  await sharp(fondo).composite([{ input: arcos.data, left: Math.round((256 - arcos.info.width) / 2), top: Math.round((256 - arcos.info.height) / 2) }]).png().toFile(R + 'public/favicon-la-256.png');
  await sharp(R + 'public/favicon-la-256.png').resize(64, 64).png({ compressionLevel: 9 }).toFile(R + 'public/favicon-la.png');
  console.log(`favicon-la.png  arcos ${arcos.info.width}×${arcos.info.height} sobre rgb(${naranja.r},${naranja.g},${naranja.b})`);
}

// ───────── Quinta Azul: el favicon lleva solo el símbolo (la Q con la A), sin «Hotel Quinta Azul» ─────────
// El símbolo se separa del nombre en la primera fila vacía bajo la mitad. También sale suelto (simbolo-*.png) para
// la cabecera: ahí el nombre va escrito al lado en letra de verdad, porque dentro del logo no se alcanzaba a leer.
{
  const Q = R + 'src/assets/qa/';
  if (!existsSync(RES + 'favicon-qa.png')) copyFileSync(R + 'public/favicon-qa.png', RES + 'favicon-qa.png');
  const { n, w, h } = await filas(Q + 'logo-blanco.png');
  let corte = n.findIndex((c, y) => y > h * 0.6 && c === 0);
  if (corte < 0) { let min = Infinity; for (let y = Math.round(h * 0.7); y < Math.round(h * 0.92); y++) if (n[y] < min) { min = n[y]; corte = y; } }   // sin fila vacía: la más despejada
  const simbolo = await sharp(Q + 'logo-blanco.png').extract({ left: 0, top: 0, width: w, height: corte }).trim({ threshold: 1 }).resize({ width: 176, height: 176, fit: 'inside' }).toBuffer({ resolveWithObject: true });
  const col = await sharp(Q + 'logo-color.png').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let azul = { r: 61, g: 77, b: 160 }, cuenta = 0, s = [0, 0, 0];
  for (let i = 0; i < col.data.length; i += 4) if (col.data[i + 3] > 250) { s[0] += col.data[i]; s[1] += col.data[i + 1]; s[2] += col.data[i + 2]; cuenta++; }
  if (cuenta) azul = { r: Math.round(s[0] / cuenta), g: Math.round(s[1] / cuenta), b: Math.round(s[2] / cuenta) };
  const fondo = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" rx="56" fill="rgb(${azul.r},${azul.g},${azul.b})"/></svg>`);
  await sharp(fondo).composite([{ input: simbolo.data, left: Math.round((256 - simbolo.info.width) / 2), top: Math.round((256 - simbolo.info.height) / 2) }]).png().toFile(R + 'public/favicon-qa-256.png');
  await sharp(R + 'public/favicon-qa-256.png').resize(64, 64).png({ compressionLevel: 9 }).toFile(R + 'public/favicon-qa.png');
  for (const c of ['blanco', 'color']) await sharp(Q + 'logo-' + c + '.png').extract({ left: 0, top: 0, width: w, height: corte }).trim({ threshold: 1 }).png({ compressionLevel: 9 }).toFile(Q + 'simbolo-' + c + '.png');
  console.log(`favicon-qa.png  símbolo ${simbolo.info.width}×${simbolo.info.height} (corte en la fila ${corte} de ${h}) sobre rgb(${azul.r},${azul.g},${azul.b})`);
}
