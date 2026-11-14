// Aire entre secciones seguidas: recorre los bloques de cada página y mide cuánto espacio vacío queda entre el final
// del contenido de uno y el principio del contenido del siguiente. Marca los pares que comparten color de fondo (ahí
// el aire de los dos se suma y se ve como un hueco) y los que quedaron demasiado juntos.
// Uso: node scripts/huecos.mjs <url-base> [url-base-2] [--pantallas=1905x910,430x932] [--rutas=,hospedaje] [--todo]
//      Sin --rutas toma las del mapa del sitio. La regla: entre secciones del mismo fondo, un solo «aire de sección»
//      (--seccion); nunca dos, y nunca menos de la mitad.
const { chromium } = await import('./_pw.mjs');
const arg = process.argv.slice(2), bases = arg.filter((a) => !a.startsWith('--')), op = (n, d) => (arg.find((a) => a.startsWith('--' + n + '=')) || '').slice(n.length + 3) || d;
const PANT = op('pantallas', '1905x910').split(',').map((x) => x.split('x').map(Number)), todo = arg.includes('--todo');
const SOLO = op('rutas', null);
const nav = await chromium.launch({ channel: 'msedge' }); let mal = 0, pares = 0;
for (const base of bases) {
  const rutas = SOLO !== null ? SOLO.split(',').map((r) => '/' + r) : [...(await (await fetch(base + '/sitemap-0.xml')).text()).matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((m) => m[1] || '/');
  for (const [w, h] of PANT) {
    const p = await (await nav.newContext({ viewport: { width: w, height: h }, isMobile: w < 800, hasTouch: w < 800 })).newPage();
    for (const r of rutas) {
      await p.goto(base + r, { waitUntil: 'load' }); await p.waitForTimeout(350);
      // todo a la vista y quieto: las piezas que aún no entran están corridas por su animación y falsearían la medida
      await p.evaluate(() => document.documentElement.classList.add('sin-mov')); await p.waitForTimeout(250);
      const filas = await p.evaluate(() => {
        const sec = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--seccion')) || null;
        const px = (v) => { const d = document.createElement('div'); d.style.cssText = 'position:absolute;visibility:hidden;height:' + v; document.body.appendChild(d); const n = d.getBoundingClientRect().height; d.remove(); return n; };
        const unAire = px('var(--seccion)');
        const fondo = (e) => { for (let x = e; x && x !== document.documentElement; x = x.parentElement) { const s = getComputedStyle(x); if (s.backgroundImage !== 'none') return 'imagen'; const c = s.backgroundColor; if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) return c; } return getComputedStyle(document.body).backgroundColor; };
        // bloques: hijos directos de <main> más el pie; lo que no ocupa alto no cuenta
        const bloques = [...document.querySelectorAll('main > *'), document.querySelector('.pie, footer')].filter((e) => e && e.getBoundingClientRect().height > 4 && getComputedStyle(e).position !== 'fixed' && getComputedStyle(e).position !== 'absolute');
        // dónde empieza y dónde termina lo que se ve dentro de un bloque (texto, fotos, botones, cajas con fondo o borde)
        const tinta = (b) => { let arr = Infinity, aba = -Infinity; const cb = b.getBoundingClientRect();
          for (const e of b.querySelectorAll('*')) { const s = getComputedStyle(e); if (s.visibility === 'hidden' || s.display === 'none' || s.position === 'fixed') continue; const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
            const pinta = e.matches('img,picture,video,svg,button,input,textarea,canvas,hr') || [...e.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim()) || (s.backgroundColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(s.backgroundColor) && e !== b) || parseFloat(s.borderTopWidth) > 0 || parseFloat(s.borderBottomWidth) > 0;
            if (!pinta) continue; arr = Math.min(arr, Math.max(r.top, cb.top)); aba = Math.max(aba, Math.min(r.bottom, cb.bottom)); }
          return arr === Infinity ? [cb.top, cb.bottom] : [arr, aba]; };
        const nombre = (e) => (e.id ? '#' + e.id : '') + '.' + [...e.classList].slice(0, 3).join('.');
        const datos = bloques.map((b) => { const [a, z] = tinta(b), r = b.getBoundingClientRect(); return { n: nombre(b), f: fondo(b), top: r.top + scrollY, bot: r.bottom + scrollY, a: a + scrollY, z: z + scrollY, lleno: b.matches('.portada,.mapa,.partida,.cinta,.tope,.migas') }; });
        const sale = []; for (let i = 1; i < datos.length; i++) { const A = datos[i - 1], B = datos[i]; sale.push({ a: A.n, b: B.n, mismo: A.f === B.f && A.f !== 'imagen', hueco: Math.round(B.a - A.z), aire: Math.round(unAire), borde: A.lleno || B.lleno }); }
        return sale;
      });
      for (const f of filas) {
        if (!f.mismo || f.borde) { if (todo) console.log(`   ${w}×${h} ${base.slice(-4)}${r}  ${f.a} → ${f.b}: ${f.hueco}px (otro fondo)`); continue; }
        pares++; const rel = f.hueco / f.aire, malo = rel > 1.35 || rel < 0.5;
        if (malo) mal++;
        if (malo || todo) console.log(`${malo ? '✗' : '✓'} ${w}×${h} ${base.slice(-4)}${r}  ${f.a} → ${f.b}: ${f.hueco}px = ${rel.toFixed(2)} aires (un aire = ${f.aire}px)`);
      }
    }
    await p.context().close();
  }
}
await nav.close();
console.log(`\n${pares} pares de secciones del mismo fondo medidos · ${mal} fuera de la regla (más de 1.35 aires o menos de 0.5)`);
