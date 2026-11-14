// Todos los óvalos de los títulos del sitio, uno por uno y de cerca, en una hoja: para juzgar si cada uno rodea bien
// su frase (centrado, sin pisar letras, sin chocar con la línea de arriba ni salirse de la pantalla).
// Uso: node scripts/ovalos.mjs http://127.0.0.1:4321 qa [--ancho=1905 --alto=910] [--cols=4]
import { RAIZ } from './_raiz.mjs';
import { mkdirSync } from 'node:fs';
import { hoja } from './hoja-lista.mjs';
const { chromium } = await import('./_pw.mjs');
const arg = process.argv.slice(2), op = (n, d) => +((arg.find((a) => a.startsWith('--' + n + '=')) || '').slice(n.length + 3) || d);
const [base, hotel] = arg.filter((a) => !a.startsWith('--')), W = op('ancho', 1905), H = op('alto', 910), cols = op('cols', W < 800 ? 6 : 4);
const sal = `${RAIZ}.capturas/ovalos/${hotel}-${W}`; mkdirSync(sal, { recursive: true });
const rutas = [...(await (await fetch(base + '/sitemap-0.xml')).text()).matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((m) => m[1] || '/');
const nav = await chromium.launch({ channel: 'msedge' }), ctx = await nav.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, isMobile: W < 800, hasTouch: W < 800 });
const lista = []; let maxAn = 0, maxAl = 0;
for (const r of rutas) {
  const p = await ctx.newPage(); await p.goto(base + r, { waitUntil: 'load' }); await p.waitForTimeout(1500);
  for (const el of await p.$$('.titulo:has(.ovalo), .nombre-serie')) {
    try { await el.scrollIntoViewIfNeeded({ timeout: 1500 }); } catch { continue; }
    await p.waitForTimeout(1400);
    const b = await el.boundingBox(); if (!b || b.width < 8) continue;
    const frase = await el.evaluate((e) => (e.querySelector('.ovalo') || e).firstChild.nodeValue.trim());
    // el recorte se ciñe al texto del título, con margen para ver cuánto sobresale el óvalo
    const t = await el.evaluate((e) => { const r = document.createRange(); r.selectNodeContents(e); const q = [...r.getClientRects()].filter((x) => x.width > 4); const l = Math.min(...q.map((x) => x.left)), d = Math.max(...q.map((x) => x.right)), a = Math.min(...q.map((x) => x.top)), z = Math.max(...q.map((x) => x.bottom)); return { x: l, y: a, w: d - l, h: z - a }; });
    const m = Math.min(130, Math.round(W * 0.07) + 12), clip = { x: Math.max(0, t.x - m), y: Math.max(0, t.y - m * 0.45), width: Math.min(W - Math.max(0, t.x - m), t.w + 2 * m), height: Math.min(H - Math.max(0, t.y - m * 0.45), t.h + m * 0.9) };
    if (clip.width < 10 || clip.height < 10) continue;
    const f = `${sal}/${String(lista.length).padStart(2, '0')}.png`; await p.screenshot({ path: f, clip, type: 'png' });
    lista.push(`${r} · ${frase}=${f}`); maxAn = Math.max(maxAn, clip.width); maxAl = Math.max(maxAl, clip.height);
  }
  await p.close();
}
await nav.close();
const an = Math.round(1900 / cols) - 4;
console.log(lista.length, 'óvalos');
console.log(await hoja(`${sal}.jpg`, lista, { cols, an, al: Math.round(an * Math.min(0.62, maxAl / maxAn + 0.1)) + 26 }));
