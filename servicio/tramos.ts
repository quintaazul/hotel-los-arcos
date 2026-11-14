// Videos por tramos.
//
// El servicio de archivos de Cloudflare (Workers Static Assets) no atiende pedidos parciales: aunque el navegador pida
// «del byte tal al tal», devuelve el archivo entero. Con eso no se puede saltar a otro punto de un video hasta que
// bajó completo, y Safari (iPhone, iPad, Mac) puede negarse a reproducirlo. Es una limitación documentada:
// https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/#range-requests
//
// La salida que da la misma documentación es esta: los videos pasan primero por el Worker (run_worker_first con
// «/video/*»), que toma el archivo del servicio de archivos y devuelve solo el tramo pedido, con estado 206.
// Los videos se publican en /video/ para poder apartarlos con una sola regla (astro.config.mjs).
//
// El servicio de archivos entrega el video sin decir cuánto mide, así que para responder un tramo hay que leerlo
// entero en memoria y recortar. Sirve para videos cortos como los del sitio (unos 12 MB; el límite de memoria de un
// Worker es 128 MB). Un video de cientos de megas no debe ir por aquí: ese va en R2 o Stream.

interface Archivos { fetch(pedido: Request | string): Promise<Response> }

/** Responde un pedido de video, entero o por tramo. */
export async function porTramos(pedido: Request, archivos: Archivos): Promise<Response> {
  if (pedido.method !== 'GET' && pedido.method !== 'HEAD') return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
  const completo = await archivos.fetch(new Request(pedido.url, { method: 'GET' }));
  if (completo.status !== 200 || !completo.body) return completo;
  const cab = new Headers({ 'Content-Type': completo.headers.get('content-type') || 'video/mp4', 'Accept-Ranges': 'bytes', 'Cache-Control': 'public, max-age=31536000, immutable' });
  const marca = completo.headers.get('etag'); if (marca) cab.set('ETag', marca);
  const rango = /^bytes=(\d*)-(\d*)$/.exec((pedido.headers.get('range') || '').trim());

  // Sin tramo (o con uno que no entendemos): el archivo entero, tal como llega
  if (!rango || (rango[1] === '' && rango[2] === '')) {
    if (pedido.method === 'HEAD') { completo.body.cancel().catch(() => {}); return new Response(null, { status: 200, headers: cab }); }
    return new Response(completo.body, { status: 200, headers: cab });
  }

  // «bytes=100-199», «bytes=100-» (hasta el final) o «bytes=-500» (los últimos 500)
  const datos = await completo.arrayBuffer(), total = datos.byteLength;
  const inicio = rango[1] === '' ? Math.max(0, total - Number(rango[2])) : Number(rango[1]);
  const fin = rango[1] === '' || rango[2] === '' ? total - 1 : Math.min(Number(rango[2]), total - 1);
  if (inicio > fin || inicio >= total) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + total, 'Accept-Ranges': 'bytes' } });
  const largo = fin - inicio + 1;
  cab.set('Content-Range', 'bytes ' + inicio + '-' + fin + '/' + total); cab.set('Content-Length', String(largo));
  return new Response(pedido.method === 'HEAD' ? null : new Uint8Array(datos, inicio, largo), { status: 206, headers: cab });
}
