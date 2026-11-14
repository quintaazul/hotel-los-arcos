// Fotos de la misma escena en los tres motores (Chrome/Edge, Firefox y Safari) para compararlas a ojo.
// Toma el arco al empezar, a medio abrir y abierto, y la sección de habitaciones.
// Uso: node scripts/motores.mjs http://127.0.0.1:4321 [--pantallas=720p,celular-grande] [--motores=firefox,webkit]
import { RAIZ } from './_raiz.mjs';
import { mkdirSync, readdirSync } from 'node:fs';
import { pantallas } from './pantallas.mjs';
const pw = await import('./_pw.mjs');
const arg = (n, d = '') => { const a = process.argv.find((x) => x.startsWith('--' + n + '=')); return a ? a.slice(n.length + 3) : d; };
const base = process.argv.slice(2).find((a) => !a.startsWith('--'));
const lista = pantallas(arg('pantallas', '720p,celular-grande'));
const copias = process.env.LOCALAPPDATA + '/ms-playwright/';
const masNueva = (prefijo, dentro) => copias + readdirSync(copias).filter((x) => x.startsWith(prefijo + '-')).sort((a, b) => parseInt(b.split('-')[1]) - parseInt(a.split('-')[1]))[0] + dentro;
const rutas = { chromium: copias + 'chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe', firefox: masNueva('firefox', '/firefox/firefox.exe'), webkit: masNueva('webkit', '/Playwright.exe') };
const dir = RAIZ + '.capturas/motores'; mkdirSync(dir, { recursive: true });
const sitio = new URL(base).port === '4322' ? 'la' : 'qa';

for (const motor of arg('motores', 'chromium,firefox,webkit').split(',')) {
  const nav = await pw[motor].launch({ executablePath: rutas[motor] });
  for (const pan of lista) {
    const ctx = await nav.newContext({ viewport: { width: pan.w, height: pan.h }, deviceScaleFactor: Math.min(pan.dpr || 1, 2), hasTouch: !!pan.tactil, ...(motor === 'firefox' ? {} : { isMobile: pan.w < 800 }) });
    const p = await ctx.newPage(); const err = [];
    p.on('pageerror', (e) => err.push(String(e)));
    await p.goto(base + '/', { waitUntil: 'load' });
    await p.waitForTimeout(900);
    const foto = async (nombre) => { await p.waitForTimeout(900); await p.screenshot({ path: `${dir}/${sitio}-${pan.id}-${motor}-${nombre}.jpg`, type: 'jpeg', quality: 72 }); };
    const m = await p.evaluate(() => { const v = document.querySelector('.ventana'); if (!v) return null; const r = v.getBoundingClientRect(); return { arriba: r.top + scrollY, recorrido: v.offsetHeight - innerHeight }; });
    if (m) for (const [nombre, avance] of [['arco-0', 0.02], ['arco-1', 0.42], ['arco-2', 0.72], ['arco-3', 1]]) { await p.evaluate((y) => scrollTo(0, y), Math.round(m.arriba + m.recorrido * avance)); await foto(nombre); }
    const hab = await p.evaluate(() => { const h = document.querySelector('[data-habs]'); return h ? h.getBoundingClientRect().top + scrollY : 0; });
    if (hab) { await p.evaluate((y) => scrollTo(0, y), Math.round(hab + pan.h * 0.5)); await foto('habs'); }
    const d = await p.evaluate(() => ({ clases: document.documentElement.className, conCss: CSS.supports('animation-timeline: view()') }));
    console.log(`${motor} ${nav.version()}  ${pan.nombre}: arco ${d.conCss ? 'movido por el navegador (CSS)' : 'pintado con código'}, clases «${d.clases}»${err.length ? ', ERRORES: ' + err.join(' | ') : ''}`);
    await ctx.close();
  }
  await nav.close();
}
