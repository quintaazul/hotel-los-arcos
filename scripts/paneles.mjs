// Las fotos de los paneles, tal como se ven: pasa el ratón por cada fila de una lista con vista previa (celebraciones,
// planes) y captura la foto que aparece; además captura los marcos de la «ventana» y las portadas cortas de planes.
// Sirve para revisar recortes y encuadres después de cambiar una foto o la forma de un marco.
// Uso: node scripts/paneles.mjs <url-base> <hotel> [--ancho=1905 --alto=910]
import { RAIZ } from './_raiz.mjs';
import { mkdirSync } from 'node:fs';
import { hoja } from './hoja-lista.mjs';
const { chromium } = await import('./_pw.mjs');
const arg = process.argv.slice(2), op = (n, d) => +((arg.find((a) => a.startsWith('--' + n + '=')) || '').slice(n.length + 3) || d);
const [base, hotel] = arg.filter((a) => !a.startsWith('--')), W = op('ancho', 1905), H = op('alto', 910);
const sal = `${RAIZ}.capturas/paneles/${hotel}`; mkdirSync(sal, { recursive: true });
const nav = await chromium.launch({ channel: 'msedge' }), ctx = await nav.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 }), lista = [];
const cargadas = async (loc) => { for (let i = 0; i < 30; i++) { if (await loc.evaluate((e) => [...e.querySelectorAll('img')].filter((x) => x.getBoundingClientRect().width > 4).every((x) => x.complete && x.naturalWidth > 0)).catch(() => true)) break; await loc.page().waitForTimeout(400); } };
const foto = async (loc, rotulo) => { const f = `${sal}/${String(lista.length).padStart(2, '0')}.png`; try { await loc.screenshot({ path: f }); lista.push(`${rotulo}=${f}`); } catch { /* no visible */ } };
// listas con vista previa
for (const [ruta, raiz] of [['/celebraciones', '.celebra'], ['/planes', '.serie']]) {
  const p = await ctx.newPage(); await p.goto(base + ruta, { waitUntil: 'load' }); await p.waitForTimeout(1200);
  const filas = await p.$$(raiz + ' .fila-plan'); if (!filas.length) { await p.close(); continue; }
  await filas[0].scrollIntoViewIfNeeded(); await p.waitForTimeout(900);
  for (let i = 0; i < filas.length; i++) {
    await filas[i].scrollIntoViewIfNeeded(); await filas[i].hover({ force: true }); await p.waitForTimeout(700);
    const v = p.locator(raiz + ' .vista-previa').first(); await cargadas(v); await p.waitForTimeout(500);
    await foto(v, `${ruta} · ${(await filas[i].innerText()).replace(/\s+/g, ' ').slice(0, 38)}`);
  }
  await p.close();
}
// marcos sueltos
for (const [ruta, sel] of [['/', '.ventana-marcos .vm'], ['/', '.pc-in'], ['/', '.palapa-foto'], ['/celebraciones', '.palapa-foto'], ['/planes', '.dest']]) {
  const p = await ctx.newPage(); await p.goto(base + ruta, { waitUntil: 'load' }); await p.waitForTimeout(1000);
  const els = p.locator(sel), n = await els.count();
  for (let i = 0; i < n; i++) { const e = els.nth(i); try { await e.scrollIntoViewIfNeeded({ timeout: 1500 }); } catch { continue; } await p.waitForTimeout(1300); await cargadas(e); await p.waitForTimeout(400); await foto(e, `${ruta} · ${sel} ${i + 1}`); }
  await p.close();
}
await nav.close();
console.log(lista.length, 'fotos de paneles');
console.log(await hoja(`${sal}.jpg`, lista, { cols: 6, an: 310, al: 430 }));
