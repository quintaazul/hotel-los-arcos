// Revisión rápida del sitio en marcha: abre cada página en TODAS las pantallas de scripts/pantallas.mjs y reporta
// errores de consola, desbordes laterales, cuántos títulos principales hay, si quedó contenido sin aparecer y si la
// foto de la cabecera cubre toda su franja al abrir.
// Uso: node scripts/revisar.mjs http://127.0.0.1:4321 [http://127.0.0.1:4322] [--pantallas=2k,celular-chico]
//   --motor=chromium|firefox|webkit   con qué navegador se revisa (Chrome/Edge, Firefox o Safari). Por defecto, chromium.
//   --sin-avisos   caso extremo: el navegador nunca avisa de «entró a la pantalla», «viene un cuadro» ni «cambió de
//                  tamaño» (así se comporta con el equipo saturado o con extensiones pesadas). Todo debe aparecer igual.
import { pantallas } from './pantallas.mjs';
const pw = await import('./_pw.mjs');
const arg = (n, d = '') => { const a = process.argv.find((x) => x.startsWith('--' + n + '=')); return a ? a.slice(n.length + 3) : d; };
const motor = arg('motor', 'chromium'), sinAvisos = process.argv.includes('--sin-avisos');
// Firefox y Safari (WebKit): se usa la copia de prueba más nueva que haya instalada en el equipo
const copias = process.env.LOCALAPPDATA + '/ms-playwright/';
const { readdirSync } = await import('node:fs');
const masNueva = (prefijo, dentro) => { const d = readdirSync(copias).filter((x) => x.startsWith(prefijo + '-')).sort((a, b) => parseInt(b.split('-')[1]) - parseInt(a.split('-')[1]))[0]; if (!d) throw new Error('No hay ' + prefijo + ' de prueba instalado'); return copias + d + dentro; };
const nav = motor === 'chromium'
  ? await pw.chromium.launch({ executablePath: copias + 'chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe' })
  : await pw[motor].launch({ executablePath: motor === 'firefox' ? masNueva('firefox', '/firefox/firefox.exe') : masNueva('webkit', '/Playwright.exe') });
const lista = pantallas(arg('pantallas'));
const A_LA_VEZ = 3;   // páginas abiertas al mismo tiempo
const APAGAR_AVISOS = () => {
  const nada = function () {}; nada.prototype = { observe() {}, unobserve() {}, disconnect() {}, takeRecords() { return []; } };
  const Mudo = function () { return Object.create(nada.prototype); }; Mudo.prototype = nada.prototype;
  window.IntersectionObserver = Mudo; window.ResizeObserver = Mudo;
  window.requestAnimationFrame = () => 0; window.cancelAnimationFrame = () => {};
};

async function revisar(ctx, base, r) {
  const p = await ctx.newPage(); const err = [];
  p.on('pageerror', (e) => err.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') err.push(m.text()); });
  try {
    const resp = await p.goto(base + r, { waitUntil: 'load' });
    await p.waitForTimeout(400);
    // Recién abierta y sin bajar, la foto de la cabecera debe cubrir toda su franja: si empieza corrida deja ver una
    // tira del fondo arriba (pasó el 10 nov 2026: la animación atada al scroll arrancaba adelantada en las cabeceras bajas)
    const hueco = await p.evaluate(() => { const po = document.querySelector('.portada'), f = document.querySelector('.portada-foto'); if (!po || !f) return 0; const a = po.getBoundingClientRect(), b = f.getBoundingClientRect(); return Math.round(Math.max(0, b.top - a.top, a.bottom - b.bottom, b.left - a.left, a.right - b.right) * 10) / 10; });
    // Baja hasta el final por tramos, como una persona, para que todo lo que aparece al bajar tenga su turno
    await p.evaluate(async () => { const paso = innerHeight * 0.7; for (let y = 0; y < document.documentElement.scrollHeight; y += paso) { scrollTo(0, y); await new Promise((ok) => setTimeout(ok, 70)); } scrollTo(0, document.documentElement.scrollHeight); await new Promise((ok) => setTimeout(ok, 1200)); });
    const d = await p.evaluate(async () => {
      const W = document.documentElement.clientWidth; let fuera = 0;
      document.querySelectorAll('body *').forEach((e) => { const b = e.getBoundingClientRect(); if (b.right > W + 1 && b.width > 0) { let x = e.parentElement, c = false; while (x && x !== document.documentElement) { if (getComputedStyle(x).overflowX !== 'visible') { c = true; break; } x = x.parentElement; } if (!c) fuera++; } });
      // Contenido que debía aparecer y sigue escondido. Lo que se pasó de largo (por bajar rápido o por estar a un lado
      // en una fila que se desliza) se trae a la vista: si entonces tampoco aparece, sí es un problema.
      const sel = '[data-aparece],[data-titulo],[data-revela],[data-nombre-serie]', falta = (e) => e.offsetParent && !e.classList.contains('visto');
      const apagado = document.documentElement.classList.contains('sin-mov');   // la red de seguridad mostró todo de una vez
      if (!apagado) for (const e of [...document.querySelectorAll(sel)].filter(falta).slice(0, 80)) { e.scrollIntoView({ block: 'center', inline: 'center' }); await new Promise((ok) => setTimeout(ok, 340)); }
      await new Promise((ok) => setTimeout(ok, 300));
      const ocultos = apagado ? 0 : [...document.querySelectorAll(sel)].filter(falta).length;
      // Óvalos sin dibujar (el trazo se calcula con código)
      const ovalos = [...document.querySelectorAll('.ovalo svg path, .nombre-serie svg path')].filter((x) => x.closest('svg').getBoundingClientRect().width > 2 && !/\d/.test(x.getAttribute('d') || '')).length;
      return { h1: document.querySelectorAll('h1').length, fuera, ocultos, ovalos, apagado };
    });
    const mal = resp.status() !== 200 || err.length || d.fuera || d.h1 !== 1 || d.ocultos || d.ovalos || d.apagado || hueco > 0.5;
    return mal ? `estado ${resp.status()}, h1 ${d.h1}, desbordes ${d.fuera}, sin aparecer ${d.ocultos}, óvalos sin dibujar ${d.ovalos}${hueco > 0.5 ? `, LA FOTO DE CABECERA NO CUBRE SU FRANJA (hueco de ${hueco} px)` : ''}${d.apagado ? ', SIN MOVIMIENTO (saltó la red de seguridad)' : ''}, errores ${err.join(' | ') || 'ninguno'}` : '';
  } catch (e) { return 'no se pudo abrir: ' + String(e.message).split('\n')[0]; } finally { await p.close(); }
}

console.log(`Motor: ${motor} ${nav.version()}${sinAvisos ? '  ·  sin avisos del navegador' : ''}`);
let total = 0;
for (const base of process.argv.slice(2).filter((a) => !a.startsWith('--'))) {
  const mapa = await (await fetch(base + '/sitemap-0.xml')).text();
  const rutas = [...mapa.matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((m) => m[1] || '/').concat('/estandar');
  let malas = 0;
  for (const pan of lista) {
    // Firefox no admite el modo «celular» de la herramienta: ahí el tamaño de pantalla se respeta igual
    const ctx = await nav.newContext({ viewport: { width: pan.w, height: pan.h }, hasTouch: !!pan.tactil, ...(motor === 'firefox' ? {} : { isMobile: pan.w < 800 }) });
    if (sinAvisos) await ctx.addInitScript(APAGAR_AVISOS);
    let malasAqui = 0;
    for (let i = 0; i < rutas.length; i += A_LA_VEZ) {
      const tanda = rutas.slice(i, i + A_LA_VEZ), res = await Promise.all(tanda.map((r) => revisar(ctx, base, r)));
      res.forEach((m, k) => { if (m) { malas++; malasAqui++; console.log(`  ✗ ${pan.nombre} ${tanda[k]}: ${m}`); } });
    }
    await ctx.close();
    console.log(`  ${malasAqui ? '✗' : '✓'} ${pan.nombre.padEnd(15)} ${pan.w}×${pan.h}  ${rutas.length} páginas${malasAqui ? ', ' + malasAqui + ' con problemas' : ''}`);
  }
  total += malas;
  console.log(`${base}: ${rutas.length} páginas × ${lista.length} pantallas, ${malas ? malas + ' con problemas' : 'todas bien'}`);
}
await nav.close();
process.exit(total ? 1 : 0);
