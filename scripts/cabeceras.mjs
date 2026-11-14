// Cabeceras de seguridad del sitio compilado. Escribe dist-<hotel>/_headers (lo lee el servicio de archivos de
// Cloudflare en cada respuesta) con:
//   · la política de contenido (CSP): el navegador solo ejecuta el código del propio sitio. Los guiones escritos
//     dentro de las páginas se autorizan uno por uno con su huella (sha256), que se calcula aquí al compilar; un
//     guion inyectado por un tercero no tiene huella y no corre. Nada de 'unsafe-inline' ni 'unsafe-eval' para código.
//   · HTTPS obligatorio un año (HSTS), no dejarse meter en marcos de otros sitios, no adivinar tipos de archivo,
//     no contar de dónde viene el visitante más que el dominio, y apagar cámara, micrófono, ubicación y demás.
// Corre solo al final de scripts/build.mjs. Uso: node scripts/cabeceras.mjs qa|la   (--ver solo imprime)
// Si una página trae un manejador en línea (onclick="…") o un enlace javascript:, falla: la política los bloquearía.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { CABECERAS } from '../servicio/seguridad.ts';
const h = process.argv[2], ver = process.argv.includes('--ver');
if (!['qa', 'la'].includes(h)) { console.error('Uso: node scripts/cabeceras.mjs qa|la [--ver]'); process.exit(1); }
const DIR = new URL('../dist-' + h + '/', import.meta.url);
const ruta = (u) => decodeURIComponent(u.pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const paginas = []; const anda = (d) => { for (const f of readdirSync(d, { withFileTypes: true })) { const q = join(d, f.name); if (f.isDirectory()) { if (!['_astro', 'video'].includes(f.name)) anda(q); } else if (f.name.endsWith('.html')) paginas.push(q); } };
anda(ruta(DIR));

const huellas = new Set(); const problemas = [];
for (const p of paginas) {
  const html = readFileSync(p, 'utf8');
  // guiones que el navegador ejecuta: los que no traen src y no son datos (JSON, JSON-LD, reglas de precarga)
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    const atr = m[1], cuerpo = m[2];
    if (/\bsrc=/.test(atr) || !cuerpo.trim()) continue;
    const tipo = (atr.match(/\btype="([^"]*)"/) || [])[1] || '';
    if (tipo && !/^(module|text\/javascript)$/.test(tipo)) continue;
    huellas.add("'sha256-" + createHash('sha256').update(cuerpo, 'utf8').digest('base64') + "'");
  }
  const cuerpoHtml = html.replace(/<script\b[\s\S]*?<\/script>/g, '').replace(/<style\b[\s\S]*?<\/style>/g, '');
  const enLinea = cuerpoHtml.match(/<[a-z][^>]*\son[a-z]+\s*=\s*["'][^>]*>/i); if (enLinea) problemas.push(p + ' · manejador en línea: ' + enLinea[0].slice(0, 90));
  if (/href\s*=\s*["']\s*javascript:/i.test(cuerpoHtml)) problemas.push(p + ' · enlace javascript:');
}
if (problemas.length) { console.error('La política de contenido bloquearía esto:\n  ' + problemas.join('\n  ')); process.exit(1); }

// Lo único de fuera es de Cloudflare: Turnstile (la verificación anti-robots del formulario: su guion y su marco) y
// su analítica sin cookies (un guion y a dónde manda el conteo), por si se enciende en el dominio real.
const TURNSTILE = 'https://challenges.cloudflare.com', ANALITICA = 'https://static.cloudflareinsights.com', CONTEO = 'https://cloudflareinsights.com';
const csp = [
  "default-src 'self'",
  "script-src 'self' " + [...huellas].sort().join(' ') + ' ' + TURNSTILE + ' ' + ANALITICA,
  // el CSS va escrito dentro de cada página (así pinta sin esperar otro archivo) y las piezas llevan variables en su
  // atributo style: por eso los estilos en línea se permiten. Un estilo no ejecuta código.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "media-src 'self'",
  "connect-src 'self' " + CONTEO,
  'frame-src ' + TURNSTILE,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "manifest-src 'self'",
  'upgrade-insecure-requests',
].join('; ');
const cabeceras = [['Content-Security-Policy', csp], ...CABECERAS];
const larga = cabeceras.find(([, v]) => v.length > 1900);
if (larga) { console.error('La cabecera ' + larga[0] + ' mide ' + larga[1].length + ' caracteres y Cloudflare admite 2000 por renglón.'); process.exit(1); }
const texto = '# Cabeceras de seguridad. Las escribe scripts/cabeceras.mjs al compilar: no editar a mano.\n/*\n' + cabeceras.map(([k, v]) => '  ' + k + ': ' + v).join('\n')
  + '\n\n# Archivos con huella en el nombre: no cambian nunca\n/_astro/*\n  Cache-Control: public, max-age=31536000, immutable\n';
if (ver) console.log(texto); else writeFileSync(new URL('_headers', DIR), texto);
console.log(`${h}: ${paginas.length} páginas · ${huellas.size} guiones en línea autorizados por su huella · política de ${csp.length} caracteres${ver ? '' : ' · escrito dist-' + h + '/_headers'}`);
// Dos archivos de cortesía que navegadores, robots y analizadores piden aunque ninguna página los enlace:
//   · /favicon.ico: el icono del sitio en el formato de siempre (sin él, cada pedido es un 404);
//   · /.well-known/security.txt: a dónde avisar si alguien encuentra un problema de seguridad (norma RFC 9116).
//     Vence al año de compilar: el sitio se vuelve a compilar con cada cambio, así que se renueva solo.
if (!ver) {
  const { default: sharp } = await import('sharp');
  const png = await sharp(ruta(new URL('favicon-' + h + '-256.png', DIR))).resize(48, 48).png({ compressionLevel: 9 }).toBuffer();
  const cab = Buffer.alloc(22); cab.writeUInt16LE(1, 2); cab.writeUInt16LE(1, 4); cab[6] = 48; cab[7] = 48; cab.writeUInt16LE(1, 10); cab.writeUInt16LE(32, 12); cab.writeUInt32LE(png.length, 14); cab.writeUInt32LE(22, 18);
  writeFileSync(new URL('favicon.ico', DIR), Buffer.concat([cab, png]));
  const origen = (readFileSync(new URL('index.html', DIR), 'utf8').match(/<link rel="canonical" href="(https:\/\/[^"\/]+)/) || [])[1];
  if (origen) {
    const vence = new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10) + 'T00:00:00.000Z';
    mkdirSync(new URL('.well-known/', DIR), { recursive: true });
    writeFileSync(new URL('.well-known/security.txt', DIR), ['# Para avisar de un problema de seguridad en este sitio', 'Contact: ' + origen + '/contacto', 'Expires: ' + vence, 'Preferred-Languages: es, en', 'Canonical: ' + origen + '/.well-known/security.txt', ''].join(String.fromCharCode(10)));
  }
}
// Direcciones que cambiaron (src/data/redirecciones.json): una por renglón, con 301, en _redirects
if (!ver) {
  const red = JSON.parse(readFileSync(new URL('../src/data/redirecciones.json', import.meta.url), 'utf8'))[h] || [];
  if (red.length) writeFileSync(new URL('_redirects', DIR), red.map(([de, a]) => de + ' ' + a + ' 301').join(String.fromCharCode(10)) + String.fromCharCode(10));
  console.log(h + ': ' + red.length + ' redirecciones');
}
// Direcciones que cambiaron (src/data/redirecciones.json): una por renglón, con 301, en _redirects
if (!ver) {
  const red = JSON.parse(readFileSync(new URL('../src/data/redirecciones.json', import.meta.url), 'utf8'))[h] || [];
  if (red.length) writeFileSync(new URL('_redirects', DIR), red.map(([de, a]) => de + ' ' + a + ' 301').join(String.fromCharCode(10)) + String.fromCharCode(10));
  console.log(h + ': ' + red.length + ' redirecciones');
}
// para los servicios (formulario y video), que responden sin pasar por _headers
if (!ver) writeFileSync(new URL('cabeceras.json', new URL('../servicio/', import.meta.url)), JSON.stringify(Object.fromEntries(cabeceras.filter(([k]) => k !== 'Content-Security-Policy')), null, 2) + '\n');
