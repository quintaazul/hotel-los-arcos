// Publica el rediseño de un hotel en su dominio REAL. Los dos ya están publicados con el rediseño (19 nov 2026).
//
// Uso:  node scripts/publicar-produccion.mjs la|qa               revisa todo y se detiene antes de subir (no cambia nada)
//       node scripts/publicar-produccion.mjs la|qa --si-publicar  revisa todo y, si pasa, publica
//
// Necesita la sesión de wrangler de la cuenta de Cloudflare de los hoteles (npx wrangler login con esa cuenta).
// Antes de subir comprueba que esa cuenta es la dueña del Worker del hotel: si no lo encuentra, no publica.
// Volver al sitio anterior al instante:  npx --yes wrangler@4 rollback --name <worker> <versión que anota>
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { RAIZ } from './_raiz.mjs';

const h = process.argv[2], publicar = process.argv.includes('--si-publicar');
// rutas: lo que se comprueba en vivo al terminar (código esperado). Las direcciones del sitio anterior deben seguir vivas.
const HOTELES = {
  la: { worker: 'hotel-los-arcos', sitio: 'https://www.hotelarcosinn.com', conf: 'produccion/wrangler-la.jsonc', otro: 'https://hotelarcosinn.com/',
    rutas: [['/', 200], ['/habitaciones', 200], ['/departamentos', 200], ['/palapa', 200], ['/contacto', 200], ['/blog', 200], ['/celebraciones', 301]] },
  qa: { worker: 'hotel-quinta-azul', sitio: 'https://hotelquintaazul.com', conf: 'produccion/wrangler-qa.jsonc', otro: 'https://www.hotelquintaazul.com/',
    rutas: [['/', 200], ['/hospedaje', 200], ['/celebraciones', 200], ['/ubicacion', 200], ['/contacto', 200], ['/blog', 200], ['/preguntas-frecuentes', 200]] },
};
const c = HOTELES[h];
if (!c) { console.log('Uso: node scripts/publicar-produccion.mjs la|qa [--si-publicar]'); process.exit(1); }
const corre = (cmd, op = {}) => execSync(cmd, { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...op });
const paso = (t) => console.log('\n── ' + t);

paso('1. Compilar');
execSync('node scripts/build.mjs ' + h, { cwd: RAIZ, stdio: 'inherit' });

paso('2. Revisor de SEO');
const seo = corre('node scripts/seo.mjs');
if ((seo.match(/sin fallas/g) || []).length < 2) { console.log(seo); console.log('✗ El revisor de SEO encontró fallas: no se publica.'); process.exit(1); }
console.log('✓ sin fallas');

paso('3. Lo que va a subir');
const robots = readFileSync(RAIZ + 'dist-' + h + '/robots.txt', 'utf8');
const listo = !/Disallow:\s*\/\s*$/m.test(robots) && robots.includes(c.sitio + '/sitemap-index.xml') && existsSync(RAIZ + 'dist-' + h + '/sitemap-index.xml') && existsSync(RAIZ + 'dist-' + h + '/_headers');
if (!listo) { console.log('✗ robots.txt, mapa del sitio o cabeceras no están como deben para el dominio real.'); process.exit(1); }
console.log('✓ robots.txt abierto, mapa del sitio de ' + c.sitio + ' y cabeceras de seguridad');

paso('4. ¿La sesión de Cloudflare es la de los hoteles?');
let versiones = '';
try { versiones = corre('npx --yes wrangler@4 deployments list --name ' + c.worker + ' -c ' + c.conf); }
catch (e) { console.log(String(e.stderr || e.message).slice(-600)); console.log('✗ Esta sesión de wrangler no ve el Worker «' + c.worker + '». Inicia sesión con la cuenta de los hoteles (npx wrangler login) y vuelve a correr esto.'); process.exit(1); }
// la lista va de la más vieja a la más nueva: la versión publicada es la última que sirve al 100 %
const ultima = [...versiones.matchAll(/\(100%\)\s+([0-9a-f]{8}-[0-9a-f-]{27})/g)].map((m) => m[1]).pop();
console.log('✓ La sesión ve «' + c.worker + '». Versión publicada ahora (para volver atrás): ' + (ultima || 'ver «npx wrangler deployments list»'));

if (!publicar) { console.log('\nTodo listo. No se subió nada. Para publicar: node scripts/publicar-produccion.mjs ' + h + ' --si-publicar'); process.exit(0); }

paso('5. Publicar');
execSync('npx --yes wrangler@4 deploy -c ' + c.conf, { cwd: RAIZ, stdio: 'inherit' });

paso('6. Comprobar el sitio publicado');
// recién publicado, las páginas que no existían en el sitio anterior pueden dar 404 unos segundos mientras se reparte
await new Promise((r) => setTimeout(r, 20000));
const ver = async (ruta, esperado, metodo = 'GET') => {
  const r = await fetch(c.sitio + ruta, { method: metodo, redirect: 'manual', headers: { 'cache-control': 'no-cache' } });
  const ok = r.status === esperado; console.log((ok ? '  ✓ ' : '  ✗ ') + metodo + ' ' + ruta + ' → ' + r.status + (r.headers.get('location') ? ' ' + r.headers.get('location') : ''));
  return ok;
};
let bien = true;
for (const [ruta, cod] of [...c.rutas, ['/sitemap.xml', 301], ['/sitemap-index.xml', 200], ['/robots.txt', 200], ['/api/contacto', 405]]) bien = (await ver(ruta, cod)) && bien;
{ // el otro nombre del dominio (con o sin www) sigue llevando al sitio con un 301
  const o = await fetch(c.otro, { redirect: 'manual' }); const ok = o.status === 301 && (o.headers.get('location') || '').startsWith(c.sitio);
  console.log((ok ? '  ✓ ' : '  ✗ ') + c.otro + ' → ' + o.status + ' ' + (o.headers.get('location') || '')); bien = ok && bien;
}
const r = await fetch(c.sitio + '/', { headers: { 'cache-control': 'no-cache' } }); const html = await r.text();
const nuevo = html.includes('data-analitica') && !!r.headers.get('content-security-policy');
console.log((nuevo ? '  ✓ ' : '  ✗ ') + 'El inicio ya es el sitio nuevo, con sus cabeceras de seguridad');
console.log(bien && nuevo ? '\nPublicado y comprobado.' : '\nAlgo no quedó bien: revisa arriba. Para volver al sitio anterior: npx --yes wrangler@4 rollback --name ' + c.worker + (ultima ? ' ' + ultima : ''));
