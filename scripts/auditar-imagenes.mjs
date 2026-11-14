// Auditoría de imágenes tal como se ven: entra a TODAS las páginas de un sitio, baja hasta el final y anota cada
// imagen que se muestra (fotos, portadas de video, fondos), en qué página y sección sale, a qué tamaño se dibuja y
// cuántos píxeles tiene su original. Sirve para dos cosas: saber cuáles se estiran y juntarlas todas para mirar si
// comparten la misma identidad gráfica.
// Uso: node scripts/auditar-imagenes.mjs http://127.0.0.1:4321 qa     (deja .capturas/auditoria/<hotel>.json)
import { RAIZ } from './_raiz.mjs';
import sharp from 'sharp';
import { readFileSync, readdirSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
const { chromium } = await import('./_pw.mjs');
const [base, hotel] = process.argv.slice(2);
const dirA = `${RAIZ}src/assets/${hotel}/`, sal = RAIZ + '.capturas/auditoria'; mkdirSync(sal, { recursive: true });
const originales = readdirSync(dirA).filter((x) => /\.(jpe?g|png|webp)$/i.test(x));
// De dónde viene cada foto, según las listas de scripts/material.mjs
const mat = readFileSync(RAIZ + 'scripts/material.mjs', 'utf8');
const bloque = (ini, fin) => { const a = mat.indexOf(ini), b = mat.indexOf(fin, a); return a < 0 ? '' : mat.slice(a, b < 0 ? undefined : b); };
const nombres = (t) => new Set([...t.matchAll(/'([a-z0-9-]+)'(?=[,\s}])/g)].map((m) => m[1]));
const disenador = nombres(bloque('const DIS_LA', 'function archivoGemini')), retocadas = nombres(bloque('const RET_QA', 'const CABECERAS'));
// la segunda ronda del retoque va con su nombre de archivo completo: a: 'nombre-{hotel}.jpg'
for (const m of (bloque('const RONDA2', '];') + bloque('const RONDA3', '];')).matchAll(/a: '([a-z0-9-]+?)(?:-cabecera|-horizontal)?-\{hotel\}/g)) retocadas.add(m[1].replace(/-cerca$/, ''));
const origen = (f) => {
  const b = f.replace(/-(horizontal|cabecera)(?=-hotel-)/, '').replace(/-(hotel-quinta-azul|hotel-los-arcos-inn).*$/, '').replace(/-cerca$/, '');
  if (/^logo-/.test(f)) return 'logotipo'; if (/^mapa-/.test(f)) return 'mapa'; if (/^instagram-/.test(f)) return 'post de redes'; if (/^video-/.test(f)) return 'portada de video';
  if (retocadas.has(b)) return 'retocada con IA'; if (disenador.has(b) || disenador.has(b + '-cerca')) return 'diseñador';
  if (/\.webp$/.test(f)) return 'sitio viejo';
  // del banco, pero con receta de acabado en la lista ACABADO de material.mjs
  return acabadas.includes("/" + b + "'") || acabadas.includes("/" + b + "-cerca'") ? 'banco con acabado' : 'banco (sin acabado)';
};
const acabadas = bloque('const ACABADO', '};');
const mapa = await (await fetch(base + '/sitemap-0.xml')).text();
const rutas = [...mapa.matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((m) => m[1] || '/');
const nav = await chromium.launch({ channel: 'msedge' });
const ctx = await nav.newContext({ viewport: { width: 1920, height: 1080 } });
const usos = new Map();
for (const r of rutas) {
  const p = await ctx.newPage();
  await p.goto(base + r, { waitUntil: 'load' });
  await p.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.6) { scrollTo(0, y); await new Promise((ok) => setTimeout(ok, 110)); } await new Promise((ok) => setTimeout(ok, 700)); });
  const lista = await p.evaluate(() => {
    const seccion = (e) => { const s = e.closest('section,header,footer,dialog,article'); if (!s) return ''; const id = s.getAttribute('aria-labelledby'); const t = id && document.getElementById(id); return (t ? t.textContent : s.className || s.tagName).replace(/\s+/g, ' ').trim().slice(0, 46); };
    const out = [];
    document.querySelectorAll('img').forEach((i) => { const u = i.currentSrc || i.src; if (!u || u.startsWith('data:')) return; const b = i.getBoundingClientRect(); out.push({ u, w: Math.round(b.width), h: Math.round(b.height), s: seccion(i), tipo: 'foto' }); });
    document.querySelectorAll('video[poster]').forEach((v) => { const b = v.getBoundingClientRect(); out.push({ u: v.poster, w: Math.round(b.width), h: Math.round(b.height), s: seccion(v), tipo: 'portada de video' }); });
    // fotos que solo aparecen al abrir algo (plantillas del detalle de habitación, visor)
    document.querySelectorAll('template').forEach((t) => t.content.querySelectorAll('img').forEach((i) => { const u = i.getAttribute('src'); if (u) out.push({ u, w: 600, h: 0, s: 'detalle de habitación (al abrir)', tipo: 'foto' }); }));
    document.querySelectorAll('[data-grande]').forEach((e) => out.push({ u: e.dataset.grande, w: innerWidth, h: 0, s: 'visor a pantalla completa', tipo: 'foto' }));
    return out;
  });
  for (const x of lista) {
    const arch = decodeURIComponent(x.u.split('/').pop().split('?')[0]), raiz = arch.replace(/\.[\w-]{8}(_[\w-]+)?\.(avif|webp|jpe?g|png)$/, '').replace(/\.(avif|webp|jpe?g|png)$/, '');
    const orig = originales.find((o) => o.replace(/\.(jpe?g|png|webp)$/i, '') === raiz); if (!orig) continue;
    const k = usos.get(orig) || { archivo: orig, paginas: new Set(), secciones: new Set(), maxAncho: 0 };
    k.paginas.add(r); if (x.s) k.secciones.add(x.s); k.maxAncho = Math.max(k.maxAncho, x.w); usos.set(orig, k);
  }
  await p.close();
}
await nav.close();
const filas = [];
for (const k of usos.values()) { const m = await sharp(dirA + k.archivo).metadata(); filas.push({ archivo: k.archivo, origen: origen(k.archivo), ancho: m.width, alto: m.height, maxAncho: k.maxAncho, paginas: [...k.paginas], secciones: [...k.secciones] }); }
filas.sort((a, b) => a.origen.localeCompare(b.origen) || a.archivo.localeCompare(b.archivo));
writeFileSync(`${sal}/${hotel}.json`, JSON.stringify(filas, null, 2));
const por = {}; filas.forEach((f) => { por[f.origen] = (por[f.origen] || 0) + 1; });
console.log(`${hotel.toUpperCase()}: ${rutas.length} páginas, ${filas.length} imágenes distintas a la vista → ` + Object.entries(por).map(([o, n]) => `${n} ${o}`).join(', '));
for (const f of filas.filter((x) => !['diseñador', 'retocada con IA', 'logotipo', 'mapa', 'post de redes', 'banco con acabado'].includes(x.origen))) console.log(`  ${f.origen.padEnd(20)} ${String(f.ancho).padStart(4)}×${String(f.alto).padEnd(4)} se dibuja hasta ${String(f.maxAncho).padStart(4)} px  ${f.archivo.replace(/-hotel.*$/, '').slice(0, 44).padEnd(44)} · ${f.paginas.join(' ')} · ${f.secciones.slice(0, 2).join(' | ')}`);
const cortas = filas.filter((x) => ['diseñador', 'retocada con IA'].includes(x.origen) && x.ancho < x.maxAncho * 0.95);
if (cortas.length) { console.log('  Con acabado pero estiradas en pantalla de 1920:'); cortas.forEach((f) => console.log(`    ${String(f.ancho).padStart(4)} px para ${String(f.maxAncho).padStart(4)}  ${f.archivo.replace(/-hotel.*$/, '')} · ${f.paginas.join(' ')}`)); }
