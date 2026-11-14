// Sirve el sitio ya compilado, igual que quedaría publicado (comprimido y con caché).
// Uso: node scripts/ver.mjs qa|la   → http://127.0.0.1:4321 (qa) o :4322 (la)
// Si todavía no existe la carpeta compilada, la arma primero.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, createReadStream, readFileSync } from 'node:fs';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const hotel = process.argv[2] === 'la' ? 'la' : 'qa';
const puerto = +(process.argv[3] || (hotel === 'la' ? 4322 : 4321));
const raiz = fileURLToPath(new URL('../dist-' + hotel, import.meta.url));
if (!existsSync(join(raiz, 'index.html'))) {
  console.log('Compilando ' + hotel + '…');
  process.env.HOTEL = hotel;
  const { build } = await import('astro');
  await build({ root: fileURLToPath(new URL('..', import.meta.url)), outDir: './dist-' + hotel, logLevel: 'warn' });
}
const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.avif': 'image/avif', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json', '.mp4': 'video/mp4' };
const comprimidos = new Map();
// Las cabeceras de seguridad del sitio publicado (dist/_headers, bloque «/*») también se mandan aquí, para probar
// en local lo mismo que verá el navegador. Dos no aplican a http://127.0.0.1: «solo HTTPS» y «sube todo a HTTPS».
const deSeguridad = () => { try { const t = readFileSync(join(raiz, '_headers'), 'utf8').replace(/\r/g, ''); const bloque = (t.split(/\n(?=\/)/).find((b) => b.startsWith('/*\n')) || '').split('\n').slice(1);
  return bloque.map((l) => /^\s+([\w-]+):\s*(.+)$/.exec(l)).filter(Boolean).map((m) => [m[1].toLowerCase(), m[2]]).filter(([k]) => k !== 'strict-transport-security').map(([k, v]) => [k, k === 'content-security-policy' ? v.replace(/;\s*upgrade-insecure-requests/, '') : v]); } catch { return []; } };
// Si se recompila el sitio mientras está servido, un archivo puede desaparecer a media lectura: se responde
// «vuelve a intentar» y el servidor sigue vivo en lugar de caerse.
const atender = (f) => (q, r) => f(q, r).catch(() => { if (!r.headersSent) r.writeHead(503, { 'retry-after': '1' }); r.end(); });
createServer(atender(async (q, r) => {
  let ruta = decodeURIComponent(q.url.split('?')[0]);
  if (ruta.endsWith('/')) ruta += 'index.html'; else if (!extname(ruta)) ruta += '.html';
  let archivo = normalize(join(raiz, ruta));
  if (!archivo.startsWith(raiz)) { r.writeHead(403).end(); return; }
  let hecho = 0;
  try { hecho = (await stat(archivo)).mtimeMs; } catch { archivo = join(raiz, '404.html'); r.statusCode = 404; hecho = (await stat(archivo)).mtimeMs; }
  for (const [k, v] of deSeguridad()) r.setHeader(k, v);
  const ext = extname(archivo), tipo = tipos[ext] || 'application/octet-stream';
  r.setHeader('content-type', tipo);
  // Los archivos de /_astro llevan una huella en el nombre: se guardan un año. El HTML siempre se vuelve a pedir.
  r.setHeader('cache-control', /^\/(_astro|video)\//.test(ruta) ? 'public, max-age=31536000, immutable' : 'no-cache');
  // Video: se entrega por tramos, para poder adelantar sin bajar el archivo completo (igual que en Cloudflare).
  if (tipo.startsWith('video/')) {
    const total = (await stat(archivo)).size;
    const m = /bytes=(\d*)-(\d*)/.exec(q.headers.range || '');
    r.setHeader('accept-ranges', 'bytes');
    if (!m) { r.setHeader('content-length', total); createReadStream(archivo).on('error', () => r.destroy()).pipe(r); return; }
    const ini = m[1] ? +m[1] : Math.max(0, total - +m[2]);
    const fin = m[1] && m[2] ? Math.min(+m[2], total - 1) : total - 1;
    if (ini > fin || ini >= total) { r.writeHead(416, { 'content-range': 'bytes */' + total }).end(); return; }
    r.writeHead(206, { 'content-range': `bytes ${ini}-${fin}/${total}`, 'content-length': fin - ini + 1 });
    createReadStream(archivo, { start: ini, end: fin }).on('error', () => r.destroy()).pipe(r);
    return;
  }
  let cuerpo = await readFile(archivo);
  if (/text|javascript|xml|svg|json/.test(tipo)) {
    const br = /\bbr\b/.test(q.headers['accept-encoding'] || ''), llave = archivo + ':' + hecho + (br ? ':br' : ':gz');
    if (!comprimidos.has(llave)) comprimidos.set(llave, br ? brotliCompressSync(cuerpo) : gzipSync(cuerpo));
    cuerpo = comprimidos.get(llave); r.setHeader('content-encoding', br ? 'br' : 'gzip'); r.setHeader('vary', 'accept-encoding');
  }
  r.end(cuerpo);
})).listen(puerto, '127.0.0.1', () => console.log(`${hotel === 'qa' ? 'Hotel Quinta Azul' : 'Hotel Los Arcos Inn'} (compilado) en http://127.0.0.1:${puerto}`));
