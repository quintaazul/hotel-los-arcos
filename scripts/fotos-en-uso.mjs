// Qué fotos usa de verdad cada sitio, de dónde viene cada una y si le alcanzan los píxeles.
// Uso: node scripts/fotos-en-uso.mjs [--json]
import { RAIZ } from './_raiz.mjs';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
const raiz = RAIZ, json = process.argv.includes('--json');
const textos = []; (function andar(d) { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) { if (f !== 'assets') andar(p); } else if (/\.(ts|astro|md|mdx|json)$/.test(f)) textos.push(readFileSync(p, 'utf8')); } })(raiz + 'src');
const todo = textos.join('\n');
// Las del diseñador se reconocen porque las escribe material.mjs desde su lista
const mat = readFileSync(raiz + 'scripts/material.mjs', 'utf8');
const delDisenador = new Set([...mat.matchAll(/'[a-z0-9]{6}': '([a-z0-9-]+)'/g)].map((m) => m[1]).concat([...mat.matchAll(/': '([a-z0-9-]+)'/g)].map((m) => m[1])));
const salida = {};
for (const h of ['qa', 'la']) {
  const dir = raiz + 'src/assets/' + h + '/', filas = [];
  for (const f of readdirSync(dir).filter((x) => /\.(jpe?g|png|webp)$/i.test(x) && !/^logo-|^instagram-|^video-/.test(x))) {
    const usos = todo.split(f).length - 1; if (!usos) continue;
    const m = await sharp(dir + f).metadata();
    const base = f.replace(/-(hotel-quinta-azul|hotel-los-arcos-inn).*$/, '').replace(/-cerca$/, '');
    const origen = delDisenador.has(base) || delDisenador.has(base + '-cerca') || /-horizontal-/.test(f) ? 'diseñador' : /\.webp$/.test(f) ? 'sitio viejo' : 'banco';
    filas.push({ f, w: m.width, h: m.height, usos, origen });
  }
  salida[h] = filas.sort((a, b) => a.origen.localeCompare(b.origen) || Math.max(a.w, a.h) - Math.max(b.w, b.h));
}
if (json) console.log(JSON.stringify(salida));
else for (const h of ['qa', 'la']) {
  console.log(`\n${h.toUpperCase()}: ${salida[h].length} fotos en uso → ` + ['diseñador', 'sitio viejo', 'banco'].map((o) => `${salida[h].filter((x) => x.origen === o).length} ${o}`).join(', '));
  for (const x of salida[h].filter((y) => y.origen !== 'diseñador')) console.log(`  ${x.origen.padEnd(11)} ${String(x.w).padStart(4)}×${String(x.h).padEnd(4)} ${x.usos}×  ${x.f}`);
}
