// Capturas de prueba: recorre la página como un visitante y toma fotos a varios anchos.
// Uso: node scripts/capturas.mjs <url> <carpeta> [anchos separados por coma] [paso en pantallas]
// Usa el Playwright que ya está instalado en C:\dev\nexo (no se agrega como dependencia).
import { mkdirSync } from 'node:fs';
const { chromium } = await import('./_pw.mjs');

const url = process.argv[2] || 'http://127.0.0.1:4321/';
const carpeta = process.argv[3] || '.inspeccion/qa';
const anchos = (process.argv[4] || '1440,768,390').split(',').map(Number);
const paso = parseFloat(process.argv[5] || '0.9');
const altos = { 390: 844, 375: 812, 768: 1024, 1024: 768, 1440: 900, 1920: 1080 };
mkdirSync(carpeta, { recursive: true });

const navegador = await chromium.launch({ executablePath: process.env.LOCALAPPDATA + '/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe' });
for (const w of anchos) {
  const h = altos[w] || 900;
  const ctx = await navegador.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: w < 800, isMobile: w < 800 });
  const pag = await ctx.newPage();
  const errores = [];
  pag.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  pag.on('pageerror', (e) => errores.push(String(e)));
  await pag.goto(url, { waitUntil: 'networkidle' });
  await pag.waitForTimeout(1800);
  const total = await pag.evaluate(() => document.documentElement.scrollHeight);
  const desborde = await pag.evaluate(() => {
    const W = document.documentElement.clientWidth, out = [];
    document.querySelectorAll('body *').forEach((e) => {
      const r = e.getBoundingClientRect();
      if (r.right > W + 1 && r.width > 0) {
        let p = e.parentElement, c = false;
        while (p && p !== document.documentElement) { if (getComputedStyle(p).overflowX !== 'visible') { c = true; break; } p = p.parentElement; }
        if (!c) out.push((typeof e.className === 'string' && e.className ? e.className : e.tagName).slice(0, 30) + ' ' + Math.round(r.right));
      }
    });
    return out.slice(0, 8);
  });
  let i = 0;
  for (let y = 0; y < total - h * 0.3; y += Math.round(h * paso)) {
    await pag.evaluate((y) => { const l = window.__lenis; if (l) l.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y); }, y);
    await pag.waitForTimeout(1300);
    await pag.screenshot({ path: `${carpeta}/${w}-${String(i).padStart(2, '0')}.jpg`, type: 'jpeg', quality: 70 });
    i++;
  }
  console.log(`${w}px: ${i} capturas, alto ${total}px, desborde: ${desborde.length ? desborde.join(' | ') : 'ninguno'}, errores: ${errores.length ? errores.join(' | ') : 'ninguno'}`);
  await ctx.close();
}
await navegador.close();
