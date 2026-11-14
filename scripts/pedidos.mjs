// Qué pide una página al servidor: cuántos archivos, de qué tipo, cuánto pesan y en qué momento (al abrir o al bajar).
// Sirve para encontrar fotos repetidas en varios tamaños, formatos pesados y cosas que se piden sin hacer falta.
// Uso: node scripts/pedidos.mjs http://127.0.0.1:4321 [--ruta=/hospedaje] [--pantallas=2k,celular-chico] [--detalle]
import { pantallas } from './pantallas.mjs';
const { chromium } = await import('./_pw.mjs');
const arg = (n, d = '') => { const a = process.argv.find((x) => x.startsWith('--' + n + '=')); return a ? a.slice(n.length + 3) : d; };
const base = process.argv.slice(2).find((a) => !a.startsWith('--')), ruta = arg('ruta', '/'), detalle = process.argv.includes('--detalle');
const lista = pantallas(arg('pantallas', '2k,celular-chico'));
const nav = await chromium.launch({ channel: 'msedge' });
const kb = (n) => (n / 1024).toFixed(0).padStart(6) + ' KB';

for (const pan of lista) {
  const ctx = await nav.newContext({ viewport: { width: pan.w, height: pan.h }, deviceScaleFactor: pan.dpr || 1, isMobile: pan.w < 800, hasTouch: !!pan.tactil });
  const p = await ctx.newPage();
  const ped = []; let fase = 'abrir';
  p.on('response', async (r) => {
    const u = r.url().replace(base, ''); let peso = +(r.headers()['content-length'] || 0);
    if (!peso) { try { peso = (await r.body()).length; } catch {} }
    ped.push({ u, tipo: r.request().resourceType(), peso, fase, estado: r.status() });
  });
  await p.goto(base + ruta, { waitUntil: 'load' });
  await p.waitForTimeout(1500);
  fase = 'bajar';
  await p.evaluate(async () => { const paso = innerHeight * 0.5; for (let y = 0; y < document.documentElement.scrollHeight; y += paso) { scrollTo(0, y); await new Promise((ok) => setTimeout(ok, 120)); } });
  await p.waitForTimeout(1500);
  const suma = (f) => { const x = ped.filter(f); return `${String(x.length).padStart(3)} archivos, ${kb(x.reduce((a, b) => a + b.peso, 0))}`; };
  console.log(`\n${pan.nombre} ${pan.w}×${pan.h}  ${ruta}`);
  console.log(`  al abrir: ${suma((x) => x.fase === 'abrir')}   |   al bajar: ${suma((x) => x.fase === 'bajar')}`);
  for (const t of [...new Set(ped.map((x) => x.tipo))]) console.log(`    ${t.padEnd(10)} ${suma((x) => x.tipo === t)}`);
  // La misma foto pedida en varios tamaños o formatos
  const porFoto = new Map();
  ped.filter((x) => x.tipo === 'image').forEach((x) => { const k = x.u.replace(/^\/_astro\//, '').replace(/\.[\w-]{8}(_[\w-]+)?\.(avif|webp|jpe?g|png)$/, ''); (porFoto.get(k) || porFoto.set(k, []).get(k)).push(x); });
  const rep = [...porFoto].filter(([, v]) => v.length > 1).sort((a, b) => b[1].length - a[1].length);
  console.log(`  fotos distintas: ${porFoto.size}; pedidas más de una vez: ${rep.length} (${rep.reduce((a, [, v]) => a + v.length - 1, 0)} pedidos de sobra)`);
  rep.slice(0, detalle ? 40 : 6).forEach(([k, v]) => console.log(`    ${v.length}×  ${k}  → ${v.map((x) => x.u.split('.').pop() + ' ' + (x.peso / 1024).toFixed(0) + 'KB' + (x.fase === 'abrir' ? '*' : '')).join(', ')}`));
  const pesadas = ped.filter((x) => x.peso > 150 * 1024).sort((a, b) => b.peso - a.peso);
  if (pesadas.length) { console.log('  de más de 150 KB:'); pesadas.slice(0, detalle ? 30 : 8).forEach((x) => console.log(`    ${kb(x.peso)}  ${x.fase.padEnd(5)} ${x.u}`)); }
  if (detalle) { console.log('  al abrir:'); ped.filter((x) => x.fase === 'abrir').forEach((x) => console.log(`    ${kb(x.peso)}  ${x.tipo.padEnd(9)} ${x.u}`)); }
  await ctx.close();
}
await nav.close();
