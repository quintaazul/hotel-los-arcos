// Contraste de todo el texto que va sobre un fondo liso (no sobre fotos: eso lo mide legibilidad.mjs). Sirve para
// comprobar un cambio de paleta: lista cada combinación de color de texto y color de fondo que no llega al mínimo
// (4.5 a 1; 3 a 1 en texto grande), con un ejemplo y la página donde aparece.
// Uso: node scripts/contraste.mjs <url-base> [--rutas=/,/contacto] [--ancho=1905 --alto=910]
//      Sin --rutas toma las del mapa del sitio compilado del mismo hotel (o de la propia base si lo tiene).
const { chromium } = await import('./_pw.mjs');
const arg = process.argv.slice(2), op = (n, d) => (arg.find((a) => a.startsWith('--' + n + '=')) || '').slice(n.length + 3) || d;
const base = arg.find((a) => !a.startsWith('--')), W = +op('ancho', 1905), H = +op('alto', 910);
let rutas = op('rutas', '') ? op('rutas', '').split(',') : null;
if (!rutas) for (const b of [base, base.replace(':4311', ':4321').replace(':4312', ':4322')]) { try { const t = await (await fetch(b + '/sitemap-0.xml')).text(); const r = [...t.matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((m) => m[1] || '/'); if (r.length) { rutas = r; break; } } catch { /* sigue con la otra */ } }
const nav = await chromium.launch({ channel: 'msedge' }), p = await (await nav.newContext({ viewport: { width: W, height: H } })).newPage();
const vistos = new Map();
for (const r of rutas) {
  await p.goto(base + r, { waitUntil: 'load' }); await p.waitForTimeout(900);
  const malos = await p.evaluate(() => {
    const parse = (c) => { const m = (c.match(/[\d.]+/g) || [0, 0, 0, 0]).map(Number); return { r: m[0], g: m[1], b: m[2], a: m[3] ?? 1 }; };
    const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }, lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
    const out = [], tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
    while ((n = tw.nextNode())) {
      if (!n.nodeValue.trim()) continue; const el = n.parentElement, cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      const q = el.getBoundingClientRect(); if (q.width < 3 || q.height < 3) continue;
      let bg = null, x = el, salta = false, op = 1;
      while (x && x.nodeType === 1) { const s = getComputedStyle(x); op *= +s.opacity; if (s.backgroundImage !== 'none' || x.matches('.portada,.foto-caja,figure,.visor,.video,.mosaico,.habs-media,.dest,.vista-previa,.insta-fila,.puntos-foto,[data-vt-foto]')) { salta = true; break; } const b = parse(s.backgroundColor); if (b.a >= 0.95) { bg = b; break; } if (b.a > 0.04) { salta = true; break; } x = x.parentElement; }
      if (salta || op < 0.5) continue; if (!bg) bg = { r: 255, g: 255, b: 255, a: 1 };
      const c = parse(cs.color), a = c.a * op, t = { r: a * c.r + (1 - a) * bg.r, g: a * c.g + (1 - a) * bg.g, b: a * c.b + (1 - a) * bg.b };
      const l1 = lum(t), l2 = lum(bg), razon = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05), px = parseFloat(cs.fontSize), grande = px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700);
      if (razon < (grande ? 3 : 4.5)) out.push({ k: `${Math.round(t.r)},${Math.round(t.g)},${Math.round(t.b)} sobre ${bg.r},${bg.g},${bg.b}`, razon: +razon.toFixed(2), min: grande ? 3 : 4.5, donde: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '') + ' < ' + (x && x.className && typeof x.className === 'string' ? '.' + x.className.trim().split(/\s+/).slice(0, 2).join('.') : (x ? x.tagName.toLowerCase() : '')), t: n.nodeValue.trim().slice(0, 34) });
    }
    return out;
  });
  for (const m of malos) { const k = m.k + ' | ' + m.donde; if (!vistos.has(k)) vistos.set(k, { ...m, ruta: r, n: 0 }); vistos.get(k).n++; }
}
await nav.close();
const lista = [...vistos.values()].sort((a, b) => a.razon - b.razon);
for (const m of lista) console.log(`✗ ${String(m.razon).padEnd(5)} (mín ${m.min})  ${m.k.padEnd(34)} ${m.donde.slice(0, 60).padEnd(60)} «${m.t}»  ${m.ruta} ×${m.n}`);
console.log(lista.length ? `\n${lista.length} combinaciones por debajo del mínimo` : 'Todo el texto sobre fondo liso pasa el mínimo');
