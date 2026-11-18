// Revisión de SEO del sitio ya compilado (dist-qa y dist-la). Comprueba, página por página, lo que pide el plan SEO
// del documento del rediseño y lo que hoy recomiendan Google y los asistentes de IA:
//   · título único de hasta 60 caracteres, descripción única de 120 a 160 y un solo H1;
//   · dirección canónica correcta y la misma en og:url; etiquetas para redes con imagen de 1200 × 630;
//   · datos estructurados que se leen bien (Hotel en todas; artículo con sus fechas en el blog);
//   · toda foto con texto alternativo y medidas; ningún enlace interno roto ni con texto genérico («Ver», «Más»);
//   · cada hotel con sus palabras: las del otro hotel no van en títulos, encabezados ni enlaces;
//   · cada artículo con fecha visible y al menos 2 enlaces a páginas que venden;
//   · mapa del sitio con todas las páginas y su fecha, y robots.txt con la ruta del mapa.
// Reglas de la auditoría del 13 de noviembre de 2026:
//   · el título principal se lee bien (sin palabras pegadas) y la calificación también («4.9 de 5 · 73 reseñas»);
//   · ningún encabezado (H2 o H3) repetido dentro de una página;
//   · descripción de 120 a 155 caracteres, terminada en punto (no cortada);
//   · ninguna pregunta frecuente repetida en dos páginas (la lista completa vive en /preguntas-frecuentes);
//   · los temas del blog con menos de 3 artículos van con noindex y fuera del mapa del sitio;
//   · el mapa del sitio no trae páginas con noindex ni direcciones redirigidas;
//   · los minutos a las Grutas, a Xenpal y a Monterrey coinciden con los datos del hotel (dist, en hoteles.ts).
//   · todo precio por noche o «desde $…» que diga una página o un artículo es uno de los precios del hotel (habs, en
//     hoteles.ts): si cambia un precio y un artículo se queda con el viejo, falla y dice dónde.
// Uso: node scripts/seo.mjs [qa|la] [--detalle]   (sin argumento revisa los dos). Sale con error si algo falla.
import { RAIZ } from './_raiz.mjs';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
const R = RAIZ, arg = process.argv.slice(2), DETALLE = arg.includes('--detalle');
const SITIO = { qa: 'https://hotelquintaazul.com', la: 'https://www.hotelarcosinn.com' };
const PROHIBIDAS = { qa: ['palapa techada', 'jardín para eventos', 'bautizo', 'primera comunión', 'primeras comuniones', 'reunión familiar', 'reuniones familiares'], la: ['renta de palapa', 'palapa para fiestas', 'fiesta con alberca', 'carne asada', 'posada'] };
const GENERICOS = /^(ver|más|ver más|explorar|conoce más|leer más|saber más|aquí|clic aquí|detalles)$/i;
// Minutos en auto que el sitio puede decir de cada lugar: los de «dist» en src/data/hoteles.ts (el primero es el de
// Quinta Azul, el segundo el de Los Arcos). A Monterrey se admite además 45, el tiempo medido desde la Macroplaza,
// mientras el hotel decide con cuál se queda.
const dist = [...readFileSync(R + 'src/data/hoteles.ts', 'utf8').matchAll(/dist: \{ monterrey: (\d+), grutas: (\d+), grutasKm: ([\d.]+), xenpal: (\d+) \}/g)].map((m) => ({ monterrey: +m[1], grutas: +m[2], xenpal: +m[4] }));
// Precios por noche de cada hotel, leídos de «habs» en src/data/hoteles.ts (primero Quinta Azul, después Los Arcos)
const PRECIOS = (() => { const d = readFileSync(R + 'src/data/hoteles.ts', 'utf8'), ini = [...d.matchAll(/\n  habs: \[/g)].map((m) => m.index); return Object.fromEntries(['qa', 'la'].map((k, i) => [k, [...d.slice(ini[i], ini[i + 1] ?? d.length).split('\n  ],')[0].matchAll(/precio: (\d+)/g)].map((m) => +m[1])])); })();
const PRECIO_EN_TEXTO = [/desde \$([\d,]+)/gi, /\$([\d,]+)(?: por| la| \/) ?noche/gi, /(?:cuesta|cuestan|empiezan en) \$([\d,]+)/gi, /y la doble,? \$([\d,]+)/gi, /con cocina, en \$([\d,]+)/gi];
const pesos = (n) => String.fromCharCode(36) + n.toLocaleString('es-MX');
const PERMITIDO = Object.fromEntries(['qa', 'la'].map((k, i) => [k, { 'las Grutas': [dist[i].grutas], Xenpal: [dist[i].xenpal], Monterrey: [dist[i].monterrey, 45] }]));
const DISTANCIAS = [[/(?:[Aa]|[Uu]nos|≈|[Ss]on) (\d+) min(?:utos)?(?: en auto)?,? (?:de|del|a) (?:las |la entrada de las )?Grutas/g, 'las Grutas'], [/(?:[Aa]|[Uu]nos|≈) (\d+) min(?:utos)?(?: en auto)? (?:de|a) Xenpal/g, 'Xenpal'], [/Xenpal[^.|]{0,40}?(?:a|unos|≈) (\d+) min/g, 'Xenpal'], [/(?:[Aa]|[Uu]nos|≈) (\d+) min(?:utos)?(?: en auto)? de (?:Monterrey|la Macroplaza)/g, 'Monterrey'], [/Desde (?:Monterrey|la Macroplaza)[^.|]{0,40}?(?:≈|unos|alrededor de) (\d+) min/g, 'Monterrey']];
const REDIRIGE = JSON.parse(readFileSync(R + 'src/data/redirecciones.json', 'utf8'));
const VENDEN = /^\/(hospedaje|habitaciones|celebraciones|palapa|departamentos|empresas|ubicacion|contacto)(#.*)?$/;
const lista = (d, b = '') => readdirSync(d).flatMap((f) => { const p = d + '/' + f; return statSync(p).isDirectory() ? (f === '_astro' ? [] : lista(p, b + f + '/')) : f.endsWith('.html') ? [b + f] : []; });
const texto = (s) => s.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const at = (h, re) => (h.match(re) || [])[1] || '';
const tipos = (o, s = new Set()) => { if (Array.isArray(o)) o.forEach((x) => tipos(x, s)); else if (o && typeof o === 'object') { if (o['@type']) [].concat(o['@type']).forEach((t) => s.add(t)); Object.values(o).forEach((x) => tipos(x, s)); } return s; };
let fallasTotales = 0;
for (const h of ['qa', 'la'].filter((x) => !arg.some((a) => a === 'qa' || a === 'la') || arg.includes(x))) {
  const D = R + 'dist-' + h, fallas = [], avisos = [], titulos = new Map(), descs = new Map(), preguntas = new Map(); let paginas = 0, fotos = 0, enlaces = 0;
  const existe = (ruta) => { const r = ruta.split('#')[0].split('?')[0]; if (r === '/' || r === '') return true; const p = D + decodeURI(r); return existsSync(p) || existsSync(p + '.html') || existsSync(p + '/index.html'); };
  const sm = existsSync(D + '/sitemap-0.xml') ? readFileSync(D + '/sitemap-0.xml', 'utf8') : '';
  const enMapa = new Map([...sm.matchAll(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?/g)].map((m) => [m[1].replace(SITIO[h], '') || '/', m[2]]));
  for (const f of lista(D).sort()) {
    const ruta = '/' + f.replace(/index\.html$/, '').replace(/\.html$/, ''), html = readFileSync(D + '/' + f, 'utf8'), cuerpo = html.slice(html.indexOf('<body')), main = (cuerpo.match(/<main[\s\S]*?<\/main>/) || [cuerpo])[0];
    const robots = at(html, /<meta name="robots" content="([^"]*)"/), interna = /noindex/.test(robots);
    const mal = (m) => fallas.push(ruta + ' · ' + m), ojo = (m) => avisos.push(ruta + ' · ' + m);
    paginas++;
    const titulo = texto(at(html, /<title>([\s\S]*?)<\/title>/)), desc = at(html, /<meta name="description" content="([^"]*)"/).replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    if (!titulo) mal('sin título'); else if (titulo.length > 60 && !interna) mal(`título de ${titulo.length} caracteres (máximo 60): «${titulo}»`);
    if (!interna) { if (titulos.has(titulo)) mal('título repetido con ' + titulos.get(titulo)); titulos.set(titulo, ruta); }
    if (!desc) mal('sin descripción'); else if (!interna && (desc.length < 120 || desc.length > 155)) mal(`descripción de ${desc.length} caracteres (debe medir de 120 a 155)`); else if (!/[.?!]$/.test(desc)) mal('descripción que no termina en punto (¿cortada?): «…' + desc.slice(-30) + '»');
    if (!interna && desc) { if (descs.has(desc)) mal('descripción repetida con ' + descs.get(desc)); descs.set(desc, ruta); }
    const h1 = [...cuerpo.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => texto(m[1])); if (h1.length !== 1) mal(`tiene ${h1.length} títulos principales (H1)`);
    { const pegado = [...cuerpo.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => m[1].replace(/<[^>]+>/g, '')).find((t) => /[a-záéíóúñ][A-ZÁÉÍÓÚÑ¿¡]/.test(t)); if (pegado) mal('título principal con palabras pegadas: «' + pegado.slice(0, 70) + '»'); }
    { const visibles = cuerpo.replace(/<(span|div|ul|p|svg)\b[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/\1>/g, ''); const hs = [...visibles.matchAll(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/g)].map((m) => texto(m[1])).filter(Boolean); const rep = [...new Set(hs.filter((x, i) => hs.indexOf(x) !== i))]; if (rep.length) mal('encabezados repetidos en la página: ' + rep.map((x) => '«' + x.slice(0, 40) + '»').join(', ')); }
    { const junto = main.replace(/<[^>]+>/g, ''); const cal = junto.match(/\d\.\d\d+ ?rese/); if (cal) mal('calificación pegada al número de reseñas: «' + cal[0] + '»'); }
    for (const m of main.matchAll(/<div class="faq-texto">([\s\S]*?)<\/div>/g)) for (const q of m[1].matchAll(/<b>([\s\S]*?)<\/b>/g)) { const k = texto(q[1]); preguntas.set(k, [...(preguntas.get(k) || []), ruta]); }
    if (/^\/blog\/tema\//.test(ruta)) { const arts = new Set([...main.matchAll(/href="(\/blog\/(?!tema\/|pagina\/)[^"\/#]+)"/g)].map((m) => m[1])); if (arts.size < 3 && !interna) mal(`tema con ${arts.size} artículos sin noindex (mínimo 3 para indexarse)`); }
    if (interna && enMapa.has(ruta)) mal('lleva noindex y está en el mapa del sitio');
    for (const re of PRECIO_EN_TEXTO) for (const m of texto(main).matchAll(re)) { const n = +m[1].replace(/,/g, ''); if (n >= 300 && !PRECIOS[h].includes(n)) mal('dice ' + pesos(n) + ' y los precios del hotel son ' + PRECIOS[h].map(pesos).join(', ') + ': «' + m[0].slice(0, 50) + '»'); }
    for (const [re, lugar] of DISTANCIAS) for (const m of texto(main).matchAll(re)) { const n = +m[1]; if (!PERMITIDO[h][lugar].includes(n)) mal(`dice ${n} minutos a ${lugar} y los datos del hotel dicen ${PERMITIDO[h][lugar].join(' o ')}: «${m[0].slice(0, 60)}»`); }
    const canon = at(html, /<link rel="canonical" href="([^"]*)"/), espera = SITIO[h] + (ruta === '/' ? '/' : ruta);
    if (canon !== espera) mal(`canónica «${canon}», se esperaba «${espera}»`);
    if (at(html, /<meta property="og:url" content="([^"]*)"/) !== canon) mal('og:url distinta de la canónica');
    for (const p of ['og:title', 'og:description', 'og:image', 'og:image:width', 'og:type', 'og:site_name', 'og:locale']) if (!new RegExp('<meta property="' + p + '" content="[^"]+"').test(html)) mal('falta ' + p);
    if (!/<meta name="twitter:card" content="summary_large_image"/.test(html)) mal('falta twitter:card');
    if (!/^https:\/\//.test(at(html, /<meta property="og:image" content="([^"]*)"/))) mal('og:image sin dirección completa');
    if (!/<html lang="es-MX"/.test(html)) mal('falta lang="es-MX"');
    // datos estructurados
    const bloques = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => { try { return JSON.parse(m[1]); } catch (e) { mal('datos estructurados que no se pueden leer (JSON inválido)'); return null; } }).filter(Boolean);
    const T = tipos(bloques); if (!T.has('Hotel')) mal('sin datos estructurados de Hotel');
    if (T.has('AggregateRating')) mal('marca reseñas propias (aggregateRating): Google no lo permite');
    // fotos
    for (const m of cuerpo.matchAll(/<img\b[^>]*>/g)) { fotos++; const i = m[0]; if (!/\balt(=|\s|>|\/)/.test(i)) mal('foto sin texto alternativo: ' + at(i, /src="([^"]{0,70})/)); if (/\bsrc=/.test(i) && (!/\bwidth=/.test(i) || !/\bheight=/.test(i))) ojo('foto sin medidas: ' + at(i, /src="([^"]{0,70})/)); }
    // enlaces
    for (const m of cuerpo.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)) { const u = m[1], t = texto(m[2]); if (!u.startsWith('/') || u.startsWith('//')) continue; enlaces++; if (!existe(u)) mal(`enlace roto a ${u} («${t.slice(0, 40)}»)`); if (GENERICOS.test(t)) mal(`enlace con texto genérico «${t}» a ${u}`); }
    // palabras del otro hotel en lo que más pesa: título, descripción, encabezados y texto de los enlaces internos
    if (!interna) { const peso = [titulo, desc, ...h1, ...[...cuerpo.matchAll(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/g)].map((m) => texto(m[1])), ...[...main.matchAll(/<a\b[^>]*href="\/[^"]*"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => texto(m[1]))].join(' | ').toLowerCase();
      const cruzadas = PROHIBIDAS[h].filter((p) => peso.includes(p)); if (cruzadas.length) mal('usa palabras del otro hotel en títulos o enlaces: ' + cruzadas.join(', ')); }
    // artículos del blog
    if (/^\/blog\/[^/]+$/.test(ruta)) { const art = (cuerpo.match(/<article[\s\S]*?<\/article>/) || [''])[0];
      if (!T.has('BlogPosting')) mal('artículo sin datos estructurados de BlogPosting');
      if (!/<time datetime="\d{4}-\d{2}-\d{2}"/.test(cuerpo)) mal('artículo sin fecha visible');
      const venden = [...art.matchAll(/<a\b[^>]*href="([^"]*)"/g)].map((m) => m[1]).filter((u) => VENDEN.test(u)); if (new Set(venden).size < 2) mal(`artículo con ${new Set(venden).size} enlaces a páginas que venden (mínimo 2)`);
      if (!/property="article:published_time"/.test(html)) mal('artículo sin article:published_time'); }
    // mapa del sitio
    if (!interna && !/^\/(404|estandar)$/.test(ruta)) { if (!enMapa.has(ruta === '/' ? '/' : ruta)) mal('no está en el mapa del sitio'); else if (!enMapa.get(ruta === '/' ? '/' : ruta)) ojo('en el mapa del sitio sin fecha (lastmod)'); }
  }
  for (const [q, donde] of preguntas) if (new Set(donde).size > 1) fallas.push('pregunta repetida en ' + [...new Set(donde)].join(' y ') + ': «' + q.slice(0, 50) + '»');
  for (const [de] of REDIRIGE[h] || []) { if (enMapa.has(de)) fallas.push(de + ' · está redirigida y sigue en el mapa del sitio'); if (existe(de)) fallas.push(de + ' · está redirigida y la página todavía existe'); }
  if (PERMITIDO[h].Monterrey.length > 1) avisos.push('Monterrey: el sitio dice ' + PERMITIDO[h].Monterrey[0] + ' minutos (dato del hotel) y 45 desde la Macroplaza (medido); falta que el hotel decida una sola versión');
  const rb = existsSync(D + '/robots.txt') ? readFileSync(D + '/robots.txt', 'utf8') : ''; if (!/Sitemap: https:\/\//.test(rb)) fallas.push('robots.txt · sin la ruta del mapa del sitio'); if (/Disallow: \/\s*$/m.test(rb)) fallas.push('robots.txt · cierra todo el sitio');
  for (const x of ['llms.txt', 'blog/rss.xml']) if (!existsSync(D + '/' + x)) avisos.push('falta /' + x);
  console.log(`\n${h.toUpperCase()} · ${paginas} páginas · ${fotos} fotos · ${enlaces} enlaces internos · ${enMapa.size} direcciones en el mapa del sitio`);
  console.log(fallas.length ? `  ✗ ${fallas.length} fallas:\n` + fallas.map((x) => '    - ' + x).join('\n') : '  ✓ sin fallas');
  if (avisos.length) console.log(`  ! ${avisos.length} avisos` + (DETALLE ? ':\n' + avisos.map((x) => '    - ' + x).join('\n') : ' (usa --detalle para verlos)'));
  fallasTotales += fallas.length;
}
process.exit(fallasTotales ? 1 : 0);
