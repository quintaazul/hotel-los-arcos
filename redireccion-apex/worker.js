/**
 * Manda hotelarcosinn.com (sin www) a https://www.hotelarcosinn.com con un
 * 301, conservando la ruta y los parametros. El sitio vive en el www, igual
 * que en Webflow.
 *
 * Es un Worker aparte y no parte del sitio porque el sitio son archivos
 * estaticos: Cloudflare los entrega sin ejecutar el codigo del Worker, asi que
 * ahi no hay forma de mirar el hostname. Hacerlo en el Worker principal
 * obligaria a ejecutarlo en CADA visita (run_worker_first), y dejarian de ser
 * gratis e ilimitadas.
 */
export default {
  fetch(request) {
    const url = new URL(request.url);
    url.protocol = 'https:';
    url.hostname = 'www.hotelarcosinn.com';
    url.port = '';
    return Response.redirect(url.href, 301);
  },
};
