// Logo provisional de Los Arcos Inn con la palabra «Hotel» (10 de noviembre de 2026).
// Al dueño le están haciendo un logo nuevo con «Hotel»; mientras llega pidió uno hecho con los mismos arcos y las
// mismas letras, mejor compuesto que el original (ahí «Hotel» iba en otra letra, a pincel, pegada debajo, y las
// letras del nombre pisaban los pies de los arcos).
//
// Qué hace: separa del logo original (respaldo/logos-con-hotel/logo-color.png) los tres arcos y las letras
// «Los Arcos Inn» (por color: los arcos son naranjas y las letras negras), los limpia y los vuelve a componer:
//   arcos  ·  ── HOTEL ──  (versalitas espaciadas, la sans del sitio)  ·  Los Arcos Inn
// Deja en src/assets/la/: arcos-color.png, arcos-blanco.png, nombre-color.png, nombre-blanco.png (las piezas sueltas,
// para la cabecera) y logo-color.png, logo-blanco.png (el logo completo, apilado).
// Uso: node scripts/logo-arcos.mjs [carpeta-de-copia]   (si se da, copia ahí el logo completo y una muestra)
import { RAIZ } from './_raiz.mjs';
import sharp from 'sharp';
import { readFileSync, mkdirSync, copyFileSync } from 'node:fs';
const { chromium } = await import('./_pw.mjs');
const R = RAIZ, RES = R + 'respaldo/logos-con-hotel/', A = R + 'src/assets/la/', copia = process.argv[2];
const TINTA = [32, 22, 15], HOTEL = '#8A3D00';   // café de los textos (adobe-950) y naranja oscuro (terracota-700)

const { data, info } = await sharp(RES + 'logo-color.png').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, px = (x, y) => (y * W + x) * 4;
const REF = 300, INI = 316, FIN_ARCOS = 360, FIN_NOMBRE = 472;   // fila limpia de referencia; donde empiezan las letras; fin de arcos y del nombre
const esNaranja = (i) => data[i + 3] > 0 && data[i] > 140 && data[i] > data[i + 1] + 30 && data[i + 2] < 120;
const tinta = (i) => Math.max(data[i], data[i + 1], data[i + 2]);

// ── Arcos: lo naranja; donde las letras los pisaban se rellena con el color que la pierna trae más arriba ──
const arcos = Buffer.alloc(W * FIN_ARCOS * 4), tramo = new Int32Array(W * 2).fill(-1);
for (let x = 0; x < W;) { if (!esNaranja(px(x, REF))) { x++; continue; } let x1 = x; while (x1 + 1 < W && esNaranja(px(x1 + 1, REF))) x1++; for (let k = x; k <= x1; k++) { tramo[k * 2] = x; tramo[k * 2 + 1] = x1; } x = x1 + 1; }
for (let y = 0; y < FIN_ARCOS; y++) for (let x = 0; x < W; x++) {
  const i = px(x, y), o = (y * W + x) * 4;
  if (esNaranja(i)) { arcos[o] = data[i]; arcos[o + 1] = data[i + 1]; arcos[o + 2] = data[i + 2]; arcos[o + 3] = data[i + 3]; continue; }
  if (y < INI || data[i + 3] === 0 || tinta(i) > 150 || tramo[x * 2] < 0) continue;
  // tinta sobre una pierna: se rellena si arriba ya hay pierna y en esta fila la pierna sigue (queda naranja a la vista)
  let sigue = false; for (let k = tramo[x * 2]; k <= tramo[x * 2 + 1] && !sigue; k++) sigue = esNaranja(px(k, y));
  if (sigue && arcos[((y - 1) * W + x) * 4 + 3] > 128) { const j = px(x, REF); arcos[o] = data[j]; arcos[o + 1] = data[j + 1]; arcos[o + 2] = data[j + 2]; arcos[o + 3] = 255; }
}
// El original trae una raya más clara que cruza las piernas cerca del pie: de la fila limpia para abajo cada
// pierna toma el color (y la opacidad, si arriba y abajo es maciza) que trae en la fila de referencia.
for (let y = REF + 4; y < FIN_ARCOS - 1; y++) for (let x = 0; x < W; x++) {
  const o = (y * W + x) * 4; if (!arcos[o + 3] || tramo[x * 2] < 0) continue;
  const j = px(x, REF); arcos[o] = data[j]; arcos[o + 1] = data[j + 1]; arcos[o + 2] = data[j + 2];
  if (arcos[o - W * 4 + 3] > 250 && (esNaranja(px(x, y + 1)) || tinta(px(x, y + 1)) < 150) && data[px(x, y + 1) + 3] > 250) arcos[o + 3] = 255;
}
// ── Nombre: la tinta oscura entre el pie de los arcos y la palabra «Hotel» del original ──
const altoN = FIN_NOMBRE - (INI - 8), nombre = Buffer.alloc(W * altoN * 4);
for (let y = INI - 8; y < FIN_NOMBRE; y++) for (let x = 0; x < W; x++) {
  const i = px(x, y), cercaDePierna = y < FIN_ARCOS + 3 && (tramo[x * 2] >= 0 || tramo[Math.max(0, x - 2) * 2] >= 0 || tramo[Math.min(W - 1, x + 2) * 2] >= 0);
  if (cercaDePierna && (data[i] - data[i + 2] > 45 || tinta(i) > 90)) continue;   // borde naranja oscuro de una pierna, no letra
  const a = data[i + 3] * Math.min(1, Math.max(0, (170 - tinta(i)) / 110)); if (a < 6) continue;
  const o = ((y - (INI - 8)) * W + x) * 4; nombre[o] = TINTA[0]; nombre[o + 1] = TINTA[1]; nombre[o + 2] = TINTA[2]; nombre[o + 3] = Math.round(a);
}
const blanco = (buf) => { const b = Buffer.from(buf); for (let i = 0; i < b.length; i += 4) { b[i] = b[i + 1] = b[i + 2] = 255; } return b; };
const guardar = (buf, alto, f) => sharp(buf, { raw: { width: W, height: alto, channels: 4 } }).trim({ threshold: 1 }).png({ compressionLevel: 9 }).toFile(A + f);
const m = { ac: await guardar(arcos, FIN_ARCOS, 'arcos-color.png'), ab: await guardar(blanco(arcos), FIN_ARCOS, 'arcos-blanco.png'), nc: await guardar(nombre, altoN, 'nombre-color.png'), nb: await guardar(blanco(nombre), altoN, 'nombre-blanco.png') };
console.log(`arcos ${m.ac.width}×${m.ac.height} · nombre ${m.nc.width}×${m.nc.height}`);

// ── Logo completo, apilado: se arma en el navegador para escribir «HOTEL» con la letra del sitio ──
const uri = (f) => 'data:image/png;base64,' + readFileSync(A + f).toString('base64');
const letra = 'data:font/woff2;base64,' + readFileSync(R + 'node_modules/@fontsource/poppins/files/poppins-latin-500-normal.woff2').toString('base64');
const pieza = (v, id) => `<div id="${id}" class="logo ${v}"><img class="a" src="${uri('arcos-' + v + '.png')}"><div class="h"><i></i><span>HOTEL</span><i></i></div><img class="n" src="${uri('nombre-' + v + '.png')}"></div>`;
const html = `<!doctype html><meta charset="utf8"><style>
@font-face{font-family:P;src:url(${letra}) format("woff2");font-weight:500}
html,body{margin:0;background:transparent}
.logo{display:inline-flex;flex-direction:column;align-items:center;width:520px;padding:10px 14px 12px;box-sizing:content-box}
.logo .a{display:block;width:430px}
.logo .h{display:flex;align-items:center;gap:15px;width:430px;margin-top:21px;font:500 17.5px/1 P,sans-serif;letter-spacing:.62em;color:${HOTEL}}
.logo .h span{margin-right:-.62em}.logo .h i{flex:1;height:1.25px;background:currentColor;opacity:.55}
.logo .n{display:block;width:500px;margin-top:15px}
.logo.blanco .h{color:#fff}.logo.blanco .h i{opacity:.7}
.muestra{display:flex;gap:0;width:1232px}.muestra > div{flex:1;display:grid;place-items:center;padding:44px 24px}
</style>${pieza('color', 'c')}${pieza('blanco', 'b')}
<div class="muestra" id="m"><div style="background:#F9F5F0">${pieza('color', 'mc')}</div><div style="background:#EA6C00">${pieza('blanco', 'mb')}</div></div>
<div class="muestra" id="m2"><div style="background:#20160F">${pieza('blanco', 'mb2')}</div><div style="background:#fff">${pieza('color', 'mc2')}</div></div>`;
const nav = await chromium.launch({ channel: 'msedge' }), p = await (await nav.newContext({ viewport: { width: 1300, height: 900 }, deviceScaleFactor: 3 })).newPage();
await p.setContent(html); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
await p.locator('#c').screenshot({ path: A + 'logo-color.png', omitBackground: true });
await p.locator('#b').screenshot({ path: A + 'logo-blanco.png', omitBackground: true });
if (copia) {
  mkdirSync(copia, { recursive: true });
  copyFileSync(A + 'logo-color.png', copia + '/hotel-los-arcos-inn-logo-provisional-color.png'); copyFileSync(A + 'logo-blanco.png', copia + '/hotel-los-arcos-inn-logo-provisional-blanco.png');
  const a = await p.locator('#m').screenshot(), b = await p.locator('#m2').screenshot(), ma = await sharp(a).metadata(), mb = await sharp(b).metadata();
  const junto = await sharp({ create: { width: Math.max(ma.width, mb.width), height: ma.height + mb.height, channels: 3, background: '#fff' } }).composite([{ input: a, left: 0, top: 0 }, { input: b, left: 0, top: ma.height }]).png().toBuffer();
  await sharp(junto).resize({ width: 1848 }).jpeg({ quality: 90 }).toFile(copia + '/hotel-los-arcos-inn-logo-provisional-muestra.jpg');   // primero se junta y después se achica: sharp cambia el tamaño antes de componer
  console.log('copias en', copia);
}
await nav.close();
const fin = await sharp(A + 'logo-color.png').metadata(); console.log(`logo completo ${fin.width}×${fin.height}`);
