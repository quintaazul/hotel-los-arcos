// Servicio mínimo de la COPIA DE PRUEBA (workers.dev) para el formulario de reserva. En los sitios reales, /api/contacto
// guarda la solicitud y avisa al correo del hotel (src/worker.ts de cada repo publicado). En la copia de prueba no hay
// correo ni base de datos: este servicio solo comprueba que lleguen los mismos campos y contesta que todo salió bien,
// diciendo claramente que la solicitud NO se envió al hotel. Lo sube scripts/publicar-prueba.mjs junto con el sitio.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/contacto') return env.ASSETS.fetch(request);
    const json = (cuerpo, estado = 200) => new Response(JSON.stringify(cuerpo), { status: estado, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
    if (request.method !== 'POST') return json({ ok: false, mensaje: 'Método no permitido.' }, 405);
    let datos;
    try { datos = await request.formData(); } catch (e) { return json({ ok: false, mensaje: 'No pudimos leer la solicitud.' }, 400); }
    const faltan = ['nombre', 'contacto', 'fechas', 'mensaje'].filter((k) => !String(datos.get(k) || '').trim());
    if (datos.get('privacidad') !== 'si') faltan.push('aviso de privacidad');
    if (faltan.length) return json({ ok: false, mensaje: 'Faltan datos: ' + faltan.join(', ') + '.' }, 400);
    return json({ ok: true, prueba: true, mensaje: 'Sitio de prueba: el formulario funciona, pero esta solicitud no se envió al hotel.' });
  },
};
