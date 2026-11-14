// Primera pantalla de TODAS las páginas de un sitio, juntas en una hoja: para ver de un vistazo cómo quedó la foto
// de cabecera de cada una (recorte, luz, si el texto se lee encima) después de cambiar fotos.
// Uso: node scripts/portadas.mjs http://127.0.0.1:4321 qa [--ancho=1920 --alto=1080] [--cols=4]
import { RAIZ } from './_raiz.mjs';
import { mkdirSync } from 'node:fs';
import { hoja } from './hoja-lista.mjs';
const { chromium } = await import('./_pw.mjs');
const arg = process.argv.slice(2), op = (n, d) => +((arg.find((a) => a.startsWith('--' + n + '=')) || '').slice(n.length + 3) || d);
const [base, hotel] = arg.filter((a) => !a.startsWith('--')), W = op('ancho', 1920), H = op('alto', 1080), cols = op('cols', 4);
const sal = `${RAIZ}.capturas/portadas/${hotel}-${W}`; mkdirSync(sal, { recursive: true });
const mapa = await (await fetch(base + '/sitemap-0.xml')).text();
const rutas = [...mapa.matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((m) => m[1] || '/');
const nav = await chromium.launch({ channel: 'msedge' }), ctx = await nav.newContext({ viewport: { width: W, height: H } }), lista = [];
for (const r of rutas) {
  const p = await ctx.newPage(); await p.goto(base + r, { waitUntil: 'load' }); await p.waitForTimeout(1600);
  const f = `${sal}/${(r === '/' ? 'inicio' : r.slice(1)).replace(/\//g, '_')}.jpg`; await p.screenshot({ path: f, type: 'jpeg', quality: 80 }); await p.close();
  lista.push(`${r}=${f}`);
}
await nav.close();
const an = Math.round(1900 / cols) - 4;
console.log(await hoja(`${sal}.jpg`, lista, { cols, an, al: Math.round(an * H / W) + 26 }));
