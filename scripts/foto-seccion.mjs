// Foto de una sección tal como se ve, ya quieta: baja hasta ella, espera a que terminen sus animaciones y captura.
// Uso: node scripts/foto-seccion.mjs <url> <selector> <salida.jpg> [pantallas] [--desfase=0.1]
//   Varias pantallas quedan una junto a otra en la misma imagen. --desfase mueve el encuadre (fracción del alto).
import sharp from 'sharp';
import { pantallas } from './pantallas.mjs';
const { chromium } = await import('./_pw.mjs');
const [url, sel, salida, cuales = '1080p,celular-grande'] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const desfase = +((process.argv.find((a) => a.startsWith('--desfase=')) || '').slice(10) || 0.08);
const nav = await chromium.launch({ channel: 'msedge', headless: true, args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const tomas = [];
for (const pan of pantallas(cuales)) {
  const ctx = await nav.newContext({ viewport: { width: pan.w, height: pan.h }, deviceScaleFactor: Math.min(pan.dpr || 1, 2), isMobile: pan.w < 800, hasTouch: !!pan.tactil });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'load' });
  await p.waitForTimeout(600);
  // baja por tramos (como una persona) para que carguen las fotos del camino, y se detiene en la sección
  await p.evaluate(async ([s, d]) => { const e = document.querySelector(s); const y = e.getBoundingClientRect().top + scrollY - innerHeight * d; for (let i = 0; i < y; i += innerHeight * 0.6) { scrollTo(0, i); await new Promise((ok) => setTimeout(ok, 90)); } scrollTo(0, y); }, [sel, desfase]);
  await p.waitForTimeout(2200);
  const b = await p.screenshot({ type: 'png' });
  tomas.push(await sharp(b).resize({ height: 1000 }).jpeg({ quality: 86 }).toBuffer({ resolveWithObject: true }));
  await ctx.close();
}
await nav.close();
let x = 0; const piezas = tomas.map((t) => { const pz = { input: t.data, left: x, top: 0 }; x += t.info.width + 8; return pz; });
await sharp({ create: { width: x - 8, height: 1000, channels: 3, background: '#d22' } }).composite(piezas).jpeg({ quality: 86 }).toFile(salida);
console.log(salida);
