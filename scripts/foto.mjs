// Una foto de la pantalla tal como se ve, en el tamaño que se pida, ya con las animaciones terminadas.
// Uso: node scripts/foto.mjs <url> <salida.jpg> <pantalla de pantallas.mjs> [selector al que bajar] [segundos de espera]
import sharp from 'sharp';
import { pantallas } from './pantallas.mjs';
const { chromium } = await import('./_pw.mjs');
const [url, salida, cual, sel = '', espera = '1.6'] = process.argv.slice(2);
const pan = pantallas(cual)[0];
const nav = await chromium.launch({ channel: 'msedge', headless: true, args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const ctx = await nav.newContext({ viewport: { width: pan.w, height: pan.h }, deviceScaleFactor: 1, isMobile: pan.w < 800, hasTouch: !!pan.tactil });
const p = await ctx.newPage();
await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(900);
if (sel) await p.evaluate(async (s) => { const e = document.querySelector(s); if (!e) return; const m = e.getBoundingClientRect().top + scrollY - innerHeight * 0.12, n = Math.max(1, Math.ceil(Math.abs(m - scrollY) / 240)), d = (m - scrollY) / n; for (let k = 0; k < n; k++) { scrollBy(0, d); await new Promise((ok) => setTimeout(ok, 24)); } }, sel);
await p.waitForTimeout(+espera * 1000);
// Las pantallas grandes se guardan a 1600 px de ancho como máximo: suficiente para revisar y más ligero de abrir
const img = sharp(await p.screenshot({ type: 'png' }));
await (pan.w > 1600 ? img.resize({ width: 1600 }) : img).jpeg({ quality: 86 }).toFile(salida);
console.log(`${pan.nombre} ${pan.w}×${pan.h} → ${salida}`);
await nav.close();
