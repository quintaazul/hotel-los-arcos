// Una página entera, pantalla por pantalla, en una hoja: baja de verdad por la página (para que cada pieza haga su
// entrada como la vería una persona), captura cada pantalla y las acomoda en orden. Sirve para juzgar cada pantalla
// como composición completa (huecos, proporciones, cortes) en el tamaño que se pida.
// Uso: node scripts/pantalla-por-pantalla.mjs <url> <salida.jpg> [ancho=1905] [alto=910] [--max=14] [--desde=0] [--ancho-hoja=1250]
//      Dice cuántas pantallas mide la página y si algo se desborda a los lados.
import sharp from 'sharp';
const { chromium } = await import('./_pw.mjs');
const arg = process.argv.slice(2), op = (n, d) => (arg.find((a) => a.startsWith('--' + n + '=')) || '').slice(n.length + 3) || d;
const [URL0, SAL, W = '1905', H = '910'] = arg.filter((a) => !a.startsWith('--')), an = +W, al = +H, MAX = +op('max', 14), DESDE = +op('desde', 0), HOJA = +op('ancho-hoja', 1250);
const nav = await chromium.launch({ channel: 'msedge' });
const p = await (await nav.newContext({ viewport: { width: an, height: al }, deviceScaleFactor: 1, isMobile: an < 800, hasTouch: an < 800 })).newPage();
const errores = []; p.on('pageerror', (e) => errores.push(String(e).slice(0, 140))); p.on('console', (m) => { if (m.type() === 'error') errores.push(m.text().slice(0, 140)); });
await p.goto(URL0, { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(1200);
const total = await p.evaluate(() => document.documentElement.scrollHeight), paso = Math.round(al * 0.94), pantallas = Math.ceil((total - al * 0.06) / paso);
const desborde = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const tomas = [];
for (let i = DESDE; i < Math.min(pantallas, DESDE + MAX); i++) {
  await p.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), i * paso); await p.waitForTimeout(i === DESDE ? 1500 : 1100);
  tomas.push(await p.screenshot({ type: 'png' }));
}
await nav.close();
const cols = an > 1024 ? 2 : an > 600 ? 3 : 5, sep = 8, w = Math.floor((HOJA - sep * (cols - 1)) / cols), h = Math.round(al * w / an);
const piezas = await Promise.all(tomas.map(async (b, i) => ({ input: await sharp(b).resize({ width: w }).toBuffer(), left: (i % cols) * (w + sep), top: Math.floor(i / cols) * (h + sep) })));
await sharp({ create: { width: HOJA, height: Math.ceil(tomas.length / cols) * (h + sep) - sep, channels: 3, background: '#e8336d' } }).composite(piezas).jpeg({ quality: 84 }).toFile(SAL);
console.log(`${URL0} · ${an}×${al} · ${pantallas} pantallas (${tomas.length} en la hoja, desde la ${DESDE + 1}) · desborde lateral ${desborde}px · errores ${errores.length}${errores.length ? ' → ' + errores.slice(0, 3).join(' | ') : ''} → ${SAL}`);
