// ¿Las fotos que van juntas miden lo mismo? Recorre cada página y, en cada grupo de fotos hermanas (una galería,
// una fila de tarjetas, un carrusel), compara ancho, alto y altura a la que arrancan. Lista los grupos disparejos:
// fotos de distinto tamaño, o del mismo tamaño pero escalonadas (una más arriba que la otra), que en celular se leen
// como «unas más grandes que otras».
// Uso: node scripts/fotos-parejas.mjs <url-base> [url-base-2] [--pantallas=430x932,360x640] [--todo]
const { chromium } = await import('./_pw.mjs');
const arg = process.argv.slice(2), bases = arg.filter((a) => !a.startsWith('--')), op = (n, d) => (arg.find((a) => a.startsWith('--' + n + '=')) || '').slice(n.length + 3) || d;
const PANT = op('pantallas', '430x932,360x640').split(',').map((x) => x.split('x').map(Number)), todo = arg.includes('--todo');
const nav = await chromium.launch({ channel: 'msedge' }); let mal = 0, grupos = 0;
for (const base of bases) {
  const rutas = [...(await (await fetch(base + '/sitemap-0.xml')).text()).matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((m) => m[1] || '/');
  for (const [w, h] of PANT) {
    const p = await (await nav.newContext({ viewport: { width: w, height: h }, isMobile: w < 800, hasTouch: w < 800 })).newPage();
    for (const r of rutas) {
      await p.goto(base + r, { waitUntil: 'load' }); await p.waitForTimeout(300);
      await p.evaluate(() => document.documentElement.classList.add('sin-mov')); await p.waitForTimeout(200);
      const filas = await p.evaluate(() => {
        // la caja visible de una foto: su marco recortado si lo tiene, si no la imagen
        const caja = (img) => (img.closest('.foto-caja, .art-foto, .pc-in, .vm, .opc-foto, .esencial-foto, .fila-foto, .teja, figure') || img).getBoundingClientRect();
        const fotos = [...document.querySelectorAll('main img, .pie img')].filter((i) => { const c = caja(i); return c.width > 70 && c.height > 70 && getComputedStyle(i).visibility !== 'hidden' && !i.closest('[hidden], template, .portada-foto, .video-cartel, .mapa, .lienzo, .autor-foto, .logo'); });
        // el grupo de una foto: el antepasado más cercano con dos o más hijos que traen foto
        const visto = new Map();
        for (const f of fotos) { let hijo = f, padre = f.parentElement;
          while (padre && padre !== document.body) { const conFoto = [...padre.children].filter((c) => fotos.some((x) => c.contains(x))); if (conFoto.length >= 2) break; hijo = padre; padre = padre.parentElement; }
          if (!padre || padre === document.body || padre.tagName === 'MAIN') continue;
          if (!visto.has(padre)) visto.set(padre, []); const lista = visto.get(padre); if (!lista.some((x) => x.el === hijo)) { const c = caja(f); lista.push({ el: hijo, w: Math.round(c.width), h: Math.round(c.height), top: Math.round(c.top + scrollY), left: Math.round(c.left) }); } }
        const nombre = (e) => (e.id ? '#' + e.id : '') + '.' + [...e.classList].slice(0, 2).join('.');
        return [...visto].map(([padre, l]) => { const ws = l.map((x) => x.w), hs = l.map((x) => x.h), tops = l.map((x) => x.top);
          const enFila = l.length > 1 && l.every((x, i) => i === 0 || Math.abs(x.top - l[0].top) < Math.max(x.h, l[0].h) * 0.6) && new Set(l.map((x) => x.left)).size > 1;   // van lado a lado
          return { grupo: nombre(padre) + ' < ' + nombre(padre.parentElement || padre), n: l.length, anchos: [...new Set(ws)].join('/'), altos: [...new Set(hs)].join('/'),
            dw: Math.max(...ws) / Math.min(...ws), dh: Math.max(...hs) / Math.min(...hs), escalon: enFila ? Math.max(...tops) - Math.min(...tops) : 0 }; });
      });
      for (const f of filas) { grupos++; const disparejo = f.dw > 1.06 || f.dh > 1.06 || f.escalon > 6; if (disparejo) mal++;
        if (disparejo || todo) console.log(`${disparejo ? '✗' : '✓'} ${w}×${h} ${base.slice(-4)}${r}  ${f.grupo} · ${f.n} fotos · anchos ${f.anchos} · altos ${f.altos}${f.escalon > 6 ? ' · escalón de ' + f.escalon + 'px' : ''}`); }
    }
    await p.context().close();
  }
}
await nav.close();
console.log(`\n${grupos} grupos de fotos medidos · ${mal} disparejos`);
