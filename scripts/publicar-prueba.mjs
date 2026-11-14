// Publica el sitio ya compilado de un hotel en una dirección de PRUEBA de Cloudflare (workers.dev), para enseñarlo y
// pedir opiniones. No toca los sitios reales: es otro Worker, con otro nombre, sin dominio propio.
// A la copia que se sube se le agrega la orden de no aparecer en buscadores (encabezado X-Robots-Tag y robots.txt
// cerrado) y se le quitan el mapa del sitio y el llms.txt, que apuntan al dominio real.
// El formulario de reserva responde con scripts/prueba-worker.js: acepta la solicitud y avisa que no se envió al hotel.
// Antes hay que compilar (node scripts/build.mjs qa|la): sube lo que haya en dist-<hotel>, tal como está.
// Usa la sesión de Cloudflare guardada en esta computadora (wrangler). Uso: node scripts/publicar-prueba.mjs qa|la
import { RAIZ } from './_raiz.mjs';
import { cpSync, rmSync, writeFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
const R = RAIZ, h = process.argv[2];
if (!['qa', 'la'].includes(h)) { console.error('Uso: node scripts/publicar-prueba.mjs qa|la'); process.exit(1); }
const NOMBRE = { qa: 'prueba-quinta-azul', la: 'prueba-los-arcos' }[h], origen = R + 'dist-' + h, copia = R + 'prueba/' + h;
if (!existsSync(origen + '/index.html')) { console.error('No hay sitio compilado en ' + origen); process.exit(1); }
mkdirSync(R + 'prueba', { recursive: true }); rmSync(copia, { recursive: true, force: true }); cpSync(origen, copia, { recursive: true });
for (const f of readdirSync(copia)) if (/^sitemap.*\.xml$|^llms\.txt$/.test(f)) rmSync(copia + '/' + f);
writeFileSync(copia + '/robots.txt', 'User-agent: *\nDisallow: /\n');
// a las cabeceras de seguridad que ya trae el sitio compilado se les suma la orden de no aparecer en buscadores
if (!existsSync(copia + '/_headers')) { console.error('Falta ' + origen + '/_headers: compila con node scripts/build.mjs ' + h); process.exit(1); }
writeFileSync(copia + '/_headers', readFileSync(copia + '/_headers', 'utf8').replace('/*\n', '/*\n  X-Robots-Tag: noindex, nofollow\n'));
// el servicio se toma de scripts/prueba-worker.js tal cual (así resuelve sus importaciones de servicio/)
const conf = R + 'prueba/wrangler-' + h + '.jsonc';
writeFileSync(conf, JSON.stringify({ name: NOMBRE, main: '../scripts/prueba-worker.js', compatibility_date: '2026-11-01', workers_dev: true, preview_urls: false,
  assets: { directory: './' + h, binding: 'ASSETS', not_found_handling: '404-page', html_handling: 'auto-trailing-slash', run_worker_first: true } }, null, 2) + '\n');
console.log('Subiendo ' + NOMBRE + '…');
execSync('npx --yes wrangler@4 deploy -c "' + conf + '"', { cwd: R + 'prueba', stdio: 'inherit' });
