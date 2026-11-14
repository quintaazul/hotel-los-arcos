// Fotografía una sección a varios puntos de su recorrido (útil para escenas fijas con scroll).
// Uso: node scripts/escena.mjs <url> <selector> <carpeta> <anchos> [pasos] [recorrido en pantallas]
import { mkdirSync } from 'node:fs';
const { chromium } = await import('./_pw.mjs');
const [url, sel, carpeta, anchosTxt = '1440', pasosTxt = '6', recTxt = '3'] = process.argv.slice(2);
const altos = { 320: 568, 375: 667, 390: 844, 430: 932, 768: 1024, 1024: 768, 1280: 720, 1440: 900, 1920: 1080 };
mkdirSync(carpeta, { recursive: true });
const navegador = await chromium.launch({ executablePath: process.env.LOCALAPPDATA + '/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe' });
for (const w of anchosTxt.split(',').map(Number)) {
  const h = altos[w] || 900;
  const ctx = await navegador.newContext({ viewport: { width: w, height: h }, hasTouch: w < 800, isMobile: w < 800 });
  const pag = await ctx.newPage();
  await pag.goto(url, { waitUntil: 'networkidle' });
  await pag.waitForTimeout(1500);
  const y0 = await pag.evaluate((s) => { const e = document.querySelector(s); return e ? e.getBoundingClientRect().top + scrollY : 0; }, sel);
  const pasos = +pasosTxt, rec = +recTxt * h;
  for (let i = 0; i < pasos; i++) {
    const y = Math.round(y0 - h * 0.6 + (rec + h * 0.6) * (i / (pasos - 1)));
    await pag.evaluate((y) => { const l = window.__lenis; if (l) l.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y); }, y);
    await pag.waitForTimeout(1600);
    await pag.screenshot({ path: `${carpeta}/${w}-${String(i).padStart(2, '0')}.jpg`, type: 'jpeg', quality: 70 });
  }
  await ctx.close();
}
await navegador.close();
console.log('listo');
