// ¿Se nota cuando el ratón pasa por encima de un botón? Captura cada tipo de botón del sitio en reposo y con el
// ratón encima, lado a lado, en una hoja. Un tipo = su clase + dónde está (sobre foto, sobre fondo oscuro o claro),
// así un botón que se repite en veinte páginas sale una sola vez.
// Uso: node scripts/hover.mjs http://127.0.0.1:4321 qa [--ancho=1905 --alto=910]
import { RAIZ } from './_raiz.mjs';
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { hoja } from './hoja-lista.mjs';
const { chromium } = await import('./_pw.mjs');
const arg = process.argv.slice(2), op = (n, d) => +((arg.find((a) => a.startsWith('--' + n + '=')) || '').slice(n.length + 3) || d);
const [base, hotel] = arg.filter((a) => !a.startsWith('--')), W = op('ancho', 1905), H = op('alto', 910);
const sal = `${RAIZ}.capturas/hover/${hotel}`; mkdirSync(sal, { recursive: true });
const rutas = [...(await (await fetch(base + '/sitemap-0.xml')).text()).matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((m) => m[1] || '/');
const nav = await chromium.launch({ channel: 'msedge' }), ctx = await nav.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const vistos = new Set(), lista = [];
for (const r of rutas) {
  const p = await ctx.newPage(); await p.goto(base + r, { waitUntil: 'load' }); await p.waitForTimeout(1500);
  for (const el of await p.$$('.boton, .icono-btn, .filtros button, .campo-btn, .enlace')) {
    const tipo = await el.evaluate((e) => (e.closest('.cabecera') ? 'cabecera' : e.closest('.portada') ? 'sobre foto' : e.closest('.sobre-oscuro,.pie') ? 'sobre oscuro' : 'sobre claro') + ' · ' + [...e.classList].join('.') + (e.matches('[aria-pressed="true"]') ? '.activo' : ''));
    if (vistos.has(tipo)) continue;
    try { await el.scrollIntoViewIfNeeded({ timeout: 1500 }); } catch { continue; }
    await p.waitForTimeout(900);
    const b = await el.boundingBox(); if (!b || b.width < 8 || b.height < 8 || b.y < 0 || b.y + b.height > H) continue;
    vistos.add(tipo);
    const m = 26, clip = { x: Math.max(0, b.x - m), y: Math.max(0, b.y - m), width: Math.min(W - Math.max(0, b.x - m), b.width + 2 * m), height: Math.min(H - Math.max(0, b.y - m), b.height + 2 * m) };
    await p.mouse.move(2, H - 2); await p.waitForTimeout(250);
    const a = await p.screenshot({ clip, type: 'png' });
    await el.hover({ force: true }); await p.waitForTimeout(550);
    const d = await p.screenshot({ clip, type: 'png' });
    const f = `${sal}/${String(lista.length).padStart(2, '0')}.png`, w = Math.round(clip.width), h = Math.round(clip.height);
    await sharp({ create: { width: w * 2 + 6, height: h, channels: 3, background: '#e8336d' } }).composite([{ input: a, left: 0, top: 0 }, { input: d, left: w + 6, top: 0 }]).png().toFile(f);
    lista.push(`${tipo}  (${r})=${f}`);
  }
  await p.close();
}
await nav.close();
console.log(lista.length, 'tipos de botón');
console.log(await hoja(`${sal}.jpg`, lista, { cols: 3, an: 630, al: 150 }));
