// Recorrido en fotos: baja una página (o una sección) y arma una hoja con lo que se ve en cada tramo,
// en las pantallas que se pidan. Sirve para revisar de un vistazo que el diseño y las animaciones quedan bien.
// Uso: node scripts/recorrido.mjs <url> <carpeta> [pantallas] [--seccion=.ventana] [--tomas=12] [--ancho=420]
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';
import { pantallas } from './pantallas.mjs';
const { chromium } = await import('./_pw.mjs');
const [url, carpeta, cuales = ''] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const op = (n, d) => (process.argv.find((a) => a.startsWith('--' + n + '=')) || '').slice(n.length + 3) || d;
const sel = op('seccion', ''), tomas = +op('tomas', '12'), ancho = +op('ancho', '420');
mkdirSync(carpeta, { recursive: true });
const nav = await chromium.launch({ channel: 'msedge', headless: true, args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
for (const pan of pantallas(cuales)) {
  const ctx = await nav.newContext({ viewport: { width: pan.w, height: pan.h }, deviceScaleFactor: 1, isMobile: pan.w < 800, hasTouch: !!pan.tactil });
  const p = await ctx.newPage();
  const err = []; p.on('pageerror', (e) => err.push(String(e)));
  await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(1400);
  const [y0, alto] = await p.evaluate((s) => { const e = s ? document.querySelector(s) : null; if (!e) return [0, document.documentElement.scrollHeight - innerHeight]; const r = e.getBoundingClientRect(); return [Math.max(0, r.top + scrollY - innerHeight * 0.35), r.height + innerHeight * 0.1]; }, sel);
  const piezas = [], cw = Math.round(pan.w >= pan.h ? ancho : ancho * 0.55), ch = Math.round(cw * pan.h / pan.w);
  for (let i = 0; i < tomas; i++) {
    const meta = Math.round(y0 + alto * i / Math.max(1, tomas - 1));
    // Baja por pasos cortos hasta el punto (así lo que aparece al bajar tiene su turno) y espera a que termine de entrar
    await p.evaluate(async (m) => { const d = m - scrollY, n = Math.max(1, Math.ceil(Math.abs(d) / 240)); for (let k = 1; k <= n; k++) { scrollTo(0, scrollY + d / n); await new Promise((ok) => setTimeout(ok, 24)); } scrollTo(0, m); }, meta);
    await p.waitForTimeout(1250);
    const img = await sharp(await p.screenshot({ type: 'jpeg', quality: 82 })).resize(cw, ch).jpeg({ quality: 84 }).toBuffer();
    piezas.push(img);
  }
  const cols = Math.min(tomas, Math.max(2, Math.floor(1680 / (cw + 6)))), filas = Math.ceil(tomas / cols);
  const arch = `${carpeta}/${pan.id}${sel ? '-' + sel.replace(/[^\w]+/g, '') : ''}.jpg`;
  await sharp({ create: { width: cols * (cw + 6) + 6, height: filas * (ch + 6) + 6, channels: 3, background: '#d81b60' } }).composite(piezas.map((b, i) => ({ input: b, left: 6 + (i % cols) * (cw + 6), top: 6 + Math.floor(i / cols) * (ch + 6) }))).jpeg({ quality: 85 }).toFile(arch);
  console.log(`${pan.nombre}: ${arch} (${tomas} tomas de ${pan.w}×${pan.h})${err.length ? ' ERRORES: ' + err.join(' | ') : ''}`);
  await ctx.close();
}
await nav.close();
