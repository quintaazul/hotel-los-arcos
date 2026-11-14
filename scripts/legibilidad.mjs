// ¿Se lee el texto de cada portada? Mide el contraste real de cada texto blanco contra la foto que tiene detrás.
// En cada página y tamaño: ubica cada renglón de texto de la portada y del menú, vuelve transparente el texto,
// fotografía el fondo (foto + sombreado) y calcula el contraste contra la zona MÁS CLARA que queda detrás de cada
// renglón (percentil 90), que es donde una letra se pierde. Meta: 4.5 a 1 en texto normal y 3 a 1 en titulares
// (WCAG AA).
//
// Uso: node scripts/legibilidad.mjs <url> [url2] [--pantallas=1905x910,430x800] [--rutas=/planes] [--todo] [--ajustar]
//   --todo     lista también lo que pasa
//   --ajustar  en vez de solo medir, busca para cada foto de portada el sombreado MÍNIMO con el que todo su texto
//              pasa en todos los tamaños, y lo guarda en src/data/velos.json (lo lee src/lib/velo.ts al compilar).
//              Hay que correrlo al cambiar una foto de portada o su texto; después se compila y se vuelve a medir
//              sin --ajustar: debe dar 0 textos por debajo de la meta.
import sharp from 'sharp';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const { chromium } = await import('./_pw.mjs');
const arg = process.argv.slice(2), bases = arg.filter((a) => !a.startsWith('--')), todo = arg.includes('--todo'), ajustar = arg.includes('--ajustar');
const SOLO = (arg.find((a) => a.startsWith('--rutas=')) || '').slice(8).split(',').filter(Boolean).map((r) => '/' + r.replace(/^[A-Za-z]:[\\/].*?[\\/]Git[\\/]/, '').replace(/^[\\/]+/, ''));   // --rutas=planes,contacto: solo esas páginas (sin la barra inicial: Git Bash la convierte en una ruta de Windows)
const PANT = ((arg.find((a) => a.startsWith('--pantallas=')) || '').slice(12) || '2560x1300,1905x910,1366x650,1280x620,1024x768,768x1024,430x800,360x640').split(',').map((x) => x.split('x').map(Number));
const SEL = [['título', '.portada .titulo-portada .l > span', 3], ['clave', '.portada .titulo-portada .clave', 4.5], ['bajada', '.portada .bajada', 4.5], ['migas', '.portada .migas', 4.5], ['datos', '.portada .guia-meta, .portada .vias-portada, .portada .nota-google, .portada .reserva-nota', 4.5],
  ['botón de contorno', '.portada .boton.contorno', 4.5], ['menú', '.cabecera:not(.solida) .nav a, .cabecera:not(.solida) .menu-btn, .cabecera:not(.solida) .logo-nombre', 4.5], ['nombre de la serie', '.serie.tope .nombre-serie, .serie.tope .pre, .serie.tope .serie-cab .texto', 3],
  // el texto de adentro de los recuadros de vidrio: se mide contra el vidrio con la foto detrás (no entra en el ajuste)
  ['recuadro', '.portada .barra .et, .portada .barra .val, .portada .tarjeta-google, .portada .portada-barra, .portada .tarjeta-form .form-tit, .portada .tarjeta-form label, .portada .tarjeta-form .form-pie', 4.5]];
const ARCHIVO = new URL('../src/data/velos.json', import.meta.url);
// pisos (lo mínimo que lleva cualquier portada, por estética), tope, paso de búsqueda y margen sobre la meta
const PISO = { t: 0.34, a: 0.3, tm: 0.4, am: 0.34 }, TOPE = 0.8, PASO = 0.04, MARGEN = 0.1;
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const cod = (l) => (l <= 0.0031308 ? l * 12.92 : 1.055 * l ** (1 / 2.4) - 0.055) * 255;
const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);

// Dentro de la página: cada texto con los rectángulos de sus renglones y su color real (con transparencias).
const tomar = (SEL) => {
  const out = [], vw = innerWidth, vh = innerHeight;
  const opac = (e) => { let o = 1; for (let x = e; x && x !== document.documentElement; x = x.parentElement) o *= parseFloat(getComputedStyle(x).opacity); return o; };
  for (const [n, s, meta] of SEL) document.querySelectorAll(s).forEach((e) => {
    const c = getComputedStyle(e); if (c.visibility === 'hidden' || c.display === 'none') return;
    const rects = [], tw = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); let nodo;
    while ((nodo = tw.nextNode())) {
      if (!nodo.nodeValue.trim()) continue;
      const pe = nodo.parentElement, pc = getComputedStyle(pe); if (pc.visibility === 'hidden' || pc.display === 'none') continue;
      // el texto que va sobre su propia ficha de color liso (un botón, una pastilla marcada) no es texto sobre foto: lo mide contraste.mjs
      let propio = false; for (let x = pe; x && x !== e; x = x.parentElement) { const b = getComputedStyle(x).backgroundColor.match(/[\d.]+/g); if (b && (b[3] === undefined || +b[3] >= 0.9)) { propio = true; break; } } if (propio) continue;
      const m = pc.color.match(/[\d.]+/g).map(Number), a = (m[3] ?? 1) * opac(pe);
      const r = document.createRange(); r.selectNodeContents(nodo);
      for (const b of r.getClientRects()) { const x = Math.max(0, b.left), y = Math.max(0, b.top), w = Math.min(vw, b.right) - x, h = Math.min(vh, b.bottom) - y; if (w > 3 && h > 3) rects.push({ x, y, w, h, rgb: m.slice(0, 3), a }); }
    }
    if (rects.length) out.push({ n, meta, t: (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 28), rects });
  });
  // se vuelve transparente el texto, no el sombreado ni las tarjetas: así se mide el fondo tal cual queda detrás
  const st = document.createElement('style');
  st.textContent = '.portada *,.cabecera,.cabecera *,.serie-cab,.serie-cab *{color:transparent !important;-webkit-text-fill-color:transparent !important;text-shadow:none !important;transition:none !important}'
    + '.portada svg,.cabecera svg,.cabecera img,.serie-cab svg{visibility:hidden !important}';
  document.head.appendChild(st);
  return out;
};
async function medir(p, cajas) {
  const { data, info } = await sharp(await p.screenshot({ type: 'png' })).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return cajas.map((c) => {
    let peor = 99, cy = 0; const tips = [];
    for (const r of c.rects) {
      const x0 = Math.round(r.x), y0 = Math.round(r.y), x1 = Math.min(info.width, Math.round(r.x + r.w)), y1 = Math.min(info.height, Math.round(r.y + r.h)); if (x1 - x0 < 3 || y1 - y0 < 3) continue;
      const L = [], paso = (x1 - x0) * (y1 - y0) > 40000 ? 2 : 1;
      for (let y = y0; y < y1; y += paso) for (let x = x0; x < x1; x += paso) { const i = (y * info.width + x) * 3; L.push(lum(data[i], data[i + 1], data[i + 2])); }
      L.sort((a, b) => a - b);
      // el texto translúcido se mezcla con su fondo como lo hace el navegador (en valores de pantalla, no de luz)
      const con = (f) => { const g = cod(f), t = lum(r.a * r.rgb[0] + (1 - r.a) * g, r.a * r.rgb[1] + (1 - r.a) * g, r.a * r.rgb[2] + (1 - r.a) * g); return (Math.max(t, f) + 0.05) / (Math.min(t, f) + 0.05); };
      peor = Math.min(peor, con(L[Math.floor(L.length * 0.9)])); tips.push(con(L[Math.floor(L.length * 0.5)])); cy += (y0 + y1) / 2;
    }
    if (!tips.length) return null;
    tips.sort((a, b) => a - b);
    return { ...c, peor, tip: tips[tips.length >> 1], cy: cy / tips.length / info.height };
  }).filter(Boolean);
}

const nav = await chromium.launch({ channel: 'msedge', args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
let fallas = 0, medidos = 0; const peores = [], hallado = {}, alTope = [];
for (const base of bases) {
  const rutas = [...(await (await fetch(base + '/sitemap-0.xml')).text()).matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((m) => m[1] || '/').filter((r) => !SOLO.length || SOLO.includes(r));
  for (const [w, h] of PANT) {
    const ctx = await nav.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: w < 800, hasTouch: w < 800 }), p = await ctx.newPage();
    for (const r of rutas) {
      await p.goto(base + r, { waitUntil: 'load' }); await p.waitForTimeout(1700);
      const cajas = await p.evaluate(tomar, SEL);
      if (!cajas.length) continue;
      await p.waitForTimeout(150);
      const sec = ajustar ? await p.$('.portada.sombreada[data-velo]') : null;
      let res;
      if (sec) {
        // Búsqueda: se parte del piso y se sube de a poco la franja de arriba (menú y migas) o el bloque del texto,
        // según dónde esté lo que todavía no se lee, hasta que todo pasa con margen.
        const clave = await sec.getAttribute('data-velo'), movil = await p.evaluate(() => matchMedia('(max-width:1100px),(max-aspect-ratio:1/1)').matches);
        const kA = movil ? 'am' : 'a', kT = movil ? 'tm' : 't', v = { [kA]: PISO[kA], [kT]: PISO[kT] };
        for (let i = 0; i < 40; i++) {
          await sec.evaluate((e, v) => { for (const k in v) e.style.setProperty('--velo-' + k, v[k]); }, v);
          await p.waitForTimeout(60);
          res = await medir(p, cajas);
          const mal = res.filter((x) => x.n !== 'recuadro' && x.peor < x.meta + MARGEN); if (!mal.length) break;
          const arriba = mal.some((x) => x.n === 'menú' || x.n === 'migas' || x.cy < 0.2), texto = mal.some((x) => !(x.n === 'menú' || x.n === 'migas' || x.cy < 0.2));
          const sube = (k) => { if (v[k] >= TOPE) return false; v[k] = +Math.min(TOPE, v[k] + PASO).toFixed(2); return true; };
          let subio = false;
          if (arriba) subio = sube(kA) || subio;
          if (texto) subio = sube(kT) || subio;
          if (!subio) subio = sube(arriba ? kT : kA);   // su zona ya llegó al tope: probar con la otra
          if (!subio) { alTope.push(`${w}×${h} ${base.slice(-4)}${r}`); break; }
        }
        hallado[clave] ??= {}; for (const k in v) hallado[clave][k] = Math.max(hallado[clave][k] ?? 0, v[k]);
      } else res = await medir(p, cajas);
      for (const c of res) {
        medidos++; const mal = c.peor < c.meta;
        if (mal) { fallas++; peores.push([c.peor, `${w}×${h} ${base.slice(-4)}${r}`, c.n, c.t]); }
        if (mal || todo) console.log(`${mal ? '✗' : '✓'} ${String(w + '×' + h).padEnd(10)} ${(base.slice(-4) + r).padEnd(34)} ${c.n.padEnd(18)} peor ${c.peor.toFixed(1)} · típico ${c.tip.toFixed(1)} · meta ${c.meta}  «${c.t}»`);
      }
    }
    await ctx.close();
  }
}
await nav.close();
if (ajustar) {
  const prev = existsSync(ARCHIVO) ? JSON.parse(readFileSync(ARCHIVO, 'utf8')) : {};
  for (const [k, v] of Object.entries(hallado)) prev[k] = { ...PISO, ...(prev[k] || {}), ...v };
  writeFileSync(ARCHIVO, JSON.stringify(Object.fromEntries(Object.entries(prev).sort(([a], [b]) => a.localeCompare(b))), null, 2) + '\n');
  for (const [k, v] of Object.entries(hallado)) console.log(k.padEnd(110), JSON.stringify(v));
  if (alTope.length) console.log('\nLlegaron al tope sin pasar (la foto no sirve para llevar ese texto encima):\n  ' + [...new Set(alTope)].join('\n  '));
  console.log(`\nGuardado en src/data/velos.json (${Object.keys(hallado).length} fotos). Ahora compila y vuelve a medir sin --ajustar.`);
}
console.log(`\n${medidos} textos medidos, ${fallas} por debajo de la meta` + (peores.length ? `. El peor: ${peores.sort((a, b) => a[0] - b[0])[0].slice(0, 3).map((x) => typeof x === 'number' ? x.toFixed(1) + ' a 1' : x).join(' · ')}` : ''));
