// La sección «Cómo llegar» tal como se ve, en todos los tamaños, en una sola hoja: sirve para revisar el mapa (que
// cubra la sección, que el pin caiga sobre el hotel, que la tarjeta no tape lo importante) sin ir pantalla por pantalla.
// Uso: node scripts/mapa-capturas.mjs <url> <salida.jpg> [--ruta=ubicacion] [--pantallas=1905x910,430x932] [--entera=1905x910]
//      «entera» guarda además esa pantalla a tamaño real, junto a la hoja, con el sufijo -entera.
import sharp from 'sharp';
const { chromium } = await import('./_pw.mjs');
const arg = process.argv.slice(2), op = (n, d) => (arg.find((a) => a.startsWith('--' + n + '=')) || '').slice(n.length + 3) || d;
const [URL0, SAL] = arg.filter((a) => !a.startsWith('--')), RUTA = op('ruta', '').replace(/^[\\/]+/, ''), ENTERA = op('entera', '');
const PANTALLAS = op('pantallas', '1905x910,3840x2160,2560x1440,1920x1080,1280x720,1366x650,1024x1366,768x1024,430x932,360x640').split(',').map((p) => p.split('x').map(Number));
const nav = await chromium.launch({ channel: 'msedge' }), piezas = []; let x = 0, y = 0, fila = 0; const ANCHO = 1250, SEP = 8, notas = [];
for (const [an, al] of PANTALLAS) {
  const p = await (await nav.newContext({ viewport: { width: an, height: al }, deviceScaleFactor: 1, reducedMotion: 'no-preference' })).newPage();
  await p.goto(URL0.replace(/\/$/, '') + '/' + RUTA, { waitUntil: 'load', timeout: 180000 });
  const s = p.locator('#mapa'); await s.scrollIntoViewIfNeeded(); await p.evaluate(() => document.querySelector('#mapa').scrollIntoView({ block: 'center' }));
  await p.waitForFunction(() => { const i = document.querySelector('#mapa .lienzo img'); return i && i.complete && i.naturalWidth > 0; }, null, { timeout: 180000 });
  await p.waitForTimeout(2600);
  // ¿la imagen cubre toda la capa del mapa?, ¿y cuánto de la imagen se ve?
  const m = await p.evaluate(() => { const c = document.querySelector('#mapa .mapa-capa').getBoundingClientRect(), i = document.querySelector('#mapa .lienzo img').getBoundingClientRect(), img = document.querySelector('#mapa .lienzo img');
    return { cubre: i.left <= c.left + 0.5 && i.top <= c.top + 0.5 && i.right >= c.right - 0.5 && i.bottom >= c.bottom - 0.5, ve: [Math.round(Math.min(1, c.width / i.width) * 100), Math.round(Math.min(1, c.height / i.height) * 100)], archivo: Math.round(img.naturalWidth), ancho: Math.round(i.width) }; });
  notas.push(`${an}×${al}: ${m.cubre ? 'cubre' : 'NO CUBRE'} · se ve ${m.ve[0]} % × ${m.ve[1]} % · imagen de ${m.archivo} px para ${m.ancho} px`);
  const buf = await s.screenshot({ type: 'png' }); await p.context().close();
  if (ENTERA === an + 'x' + al) await sharp(buf).jpeg({ quality: 90 }).toFile(SAL.replace(/\.jpg$/, '-entera.jpg'));
  const w = an > 1024 ? 621 : Math.round(an * (an > 500 ? 0.4 : 0.62)), meta = await sharp(buf).metadata(), b = await sharp(buf).resize({ width: w }).toBuffer(), h = Math.round(meta.height * w / meta.width);
  if (x + w > ANCHO) { x = 0; y += fila + SEP; fila = 0; }
  piezas.push({ input: b, left: x, top: y }); x += w + SEP; fila = Math.max(fila, h);
}
await nav.close();
await sharp({ create: { width: ANCHO, height: y + fila, channels: 3, background: '#e8336d' } }).composite(piezas).jpeg({ quality: 86 }).toFile(SAL);
console.log(notas.join('\n')); console.log('hoja →', SAL);
