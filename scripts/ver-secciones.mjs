// Fotos de una lista de secciones (ruta + selector) en una pantalla dada, juntas en una hoja: para revisar de un
// vistazo cómo quedó cada escena de las páginas interiores en celular, tablet o computadora.
// Uso: node scripts/ver-secciones.mjs <base> <hotel> [ancho=430] [alto=932]
import { RAIZ } from './_raiz.mjs';
import { mkdirSync } from 'node:fs';
import { hoja } from './hoja-lista.mjs';
const { chromium } = await import('./_pw.mjs');
const [base, hotel, W = '430', H = '932'] = process.argv.slice(2), w = +W, h = +H, movil = w < 800;
const habs = hotel === 'qa' ? '/hospedaje' : '/habitaciones';
const LISTA = [[habs, '.mosaico', 'mosaico'], [habs, '.horario', 'horario'], [habs, '.reglas-fila', 'reglas'], [habs, '.partida', 'grupos'], ['/celebraciones', '.puntos-marco', 'puntos'], ['/celebraciones', '.celebra', 'celebrar'], ['/celebraciones', '.cotiza-marco', 'cotizar'],
  ['/ubicacion', '.pasos', 'llegar'], ['/ubicacion', '.distancias', 'distancias'], ['/ubicacion', '.partida', 'trabajo'], ['/contacto', '.contacta-marco', 'contacto'], ['/contacto', '.vias', 'vias'], ['/planes', '.dest-grid', 'destacados']];
const sal = `${RAIZ}.capturas/secciones/${hotel}-${w}`; mkdirSync(sal, { recursive: true });
const nav = await chromium.launch({ channel: 'msedge', args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const ctx = await nav.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: movil, hasTouch: movil }), p = await ctx.newPage(), err = [];
p.on('pageerror', (e) => err.push(String(e)));
const fotos = []; let ruta = '';
for (const [r, sel, n] of LISTA) {
  if (r !== ruta) { await p.goto(base + r, { waitUntil: 'load' }); ruta = r; await p.waitForTimeout(700); }
  const hay = await p.evaluate(async ([s, d]) => { const e = document.querySelector(s); if (!e) return false; const y = e.getBoundingClientRect().top + scrollY - innerHeight * d; for (let i = Math.max(0, y - innerHeight * 3); i < y; i += innerHeight * 0.5) { scrollTo(0, i); await new Promise((ok) => setTimeout(ok, 90)); } scrollTo(0, y); return true; }, [sel, movil ? 0.12 : 0.16]);
  if (!hay) { console.log('  no existe', r, sel); continue; }
  await p.waitForTimeout(2100);
  const f = `${sal}/${n}.jpg`; await p.screenshot({ path: f, type: 'jpeg', quality: 82 }); fotos.push(`${n}=${f}`);
}
await nav.close();
const cols = movil ? 7 : 3, an = Math.round(1900 / cols) - 4;
console.log(await hoja(`${sal}.jpg`, fotos, { cols, an, al: Math.round(an * h / w) + 26 }), err.length ? 'ERRORES: ' + err.join(' | ') : 'sin errores');
