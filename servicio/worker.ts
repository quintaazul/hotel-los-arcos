/**
 * Worker del sitio NUEVO (los dos hoteles usan este mismo archivo).
 *
 * Sale del que hoy esta publicado en quintaazul/hotel-quinta-azul y quintaazul/hotel-los-arcos, con tres cambios:
 *   - el aviso al hotel lo arma servicio/correo.ts (con formato, botones para responder y version de solo texto);
 *   - el formulario manda la llegada y la salida aparte (AAAA-MM-DD) ademas del texto de siempre;
 *   - acepta los cuatro tipos de habitacion (antes solo sencilla y doble).
 * La base de datos no cambia. A que hotel pertenece lo dice la variable HOTEL ("qa" o "la") de wrangler.jsonc; si
 * falta, se deduce del remitente.
 *
 * Hace dos cosas:
 *
 *   1. POST /api/contacto  ->  recibe una solicitud de reserva
 *   2. cualquier otra ruta ->  entrega el sitio estatico
 *
 * Regla que manda sobre todas las demas: **una solicitud valida NUNCA se
 * pierde**. Primero se guarda en la base de datos y despues se intenta el
 * correo. Si el correo falla, la solicitud ya esta a salvo y el fallo queda
 * registrado para poder recuperarla.
 */

import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage, Mailbox } from 'mimetext';
import { armarCorreo, HOTELES, type Hotel, type Solicitud } from './correo';
import { porTramos } from './tramos';
import { conSeguridad, mismoSitio } from './seguridad';

/** Lo que puede llegar del formulario, antes de validar. */
interface CamposCrudos {
  nombre?: string;
  contacto?: string;
  fechas?: string;
  llegada?: string;
  salida?: string;
  personas?: string;
  habitacion?: string;
  motivo?: string;
  mensaje?: string;
  privacidad?: string;
}

/** Limites de tamano. Evitan que alguien mande un cuerpo enorme. */
const LIMITES = {
  cuerpo: 32 * 1024, // 32 KB de formulario es de sobra
  nombre: 120,
  contacto: 160,
  fechas: 120,
  mensaje: 5000,
  token: 2048,
  personasMax: 200,
} as const;

const HABITACIONES = new Set(['sencilla', 'doble', 'triple', 'departamento']);
const esFechaIso = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d\d-\d\d$/.test(v);
const MOTIVOS = new Set(['hospedaje', 'celebracion', 'negocios', 'otro-motivo', 'consulta', 'otro']);

const registrar = (nivel: 'info' | 'error', evento: string, datos: Record<string, unknown> = {}) => {
  // JSON estructurado: se puede filtrar en los registros de Cloudflare.
  console[nivel === 'error' ? 'error' : 'log'](JSON.stringify({ nivel, evento, ...datos }));
};

const json = (datos: unknown, status = 200) =>
  conSeguridad(
    new Response(JSON.stringify(datos), {
      status,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
    }),
    true
  );

const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/**
 * Claves de prueba publicadas por Cloudflare para desarrollo. Solo sirven en
 * local: no ejecutan el desafio de verdad.
 * https://developers.cloudflare.com/turnstile/troubleshooting/testing/
 */
const SECRETOS_DE_PRUEBA = new Set([
  '1x0000000000000000000000000000000AA', // siempre aprueba
  '2x0000000000000000000000000000000AA', // siempre bloquea
  '3x0000000000000000000000000000000AA', // token ya usado
]);
const esClaveDePrueba = (secreto: string | undefined) => !!secreto && SECRETOS_DE_PRUEBA.has(secreto);

/** Comprobacion conservadora: sin espacios, un solo @, y dominio con punto. */
const esCorreoValido = (v: string) => /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[A-Za-z]{2,}$/.test(v) && v.length <= 254;

/**
 * Comprueba el token de Turnstile contra Cloudflare. Falla cerrado: ante
 * cualquier duda (red caida, respuesta rara, accion que no cuadra), rechaza.
 */
async function verificarTurnstile(
  token: string,
  ip: string | null,
  env: Env
): Promise<{ ok: true } | { ok: false; motivo: string }> {
  if (!token || token.length > LIMITES.token) return { ok: false, motivo: 'token-ausente-o-enorme' };
  if (!env.TURNSTILE_SECRET) return { ok: false, motivo: 'falta-el-secreto-en-el-servidor' };

  const permitidos = new Set(
    (env.TURNSTILE_HOSTNAMES ?? '')
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean)
  );
  if (permitidos.size === 0) return { ok: false, motivo: 'sin-hostnames-permitidos' };

  let resultado: { success?: boolean; action?: string; hostname?: string; 'error-codes'?: string[] };
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(10_000),
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET,
        response: token,
        ...(ip ? { remoteip: ip } : {}),
      }),
    });
    if (!r.ok) throw new Error(`siteverify respondio ${r.status}`);
    resultado = await r.json();
  } catch (e) {
    registrar('error', 'turnstile_inalcanzable', { detalle: String(e) });
    return { ok: false, motivo: 'no-se-pudo-verificar' };
  }

  if (!resultado.success) return { ok: false, motivo: (resultado['error-codes'] ?? []).join(',') || 'rechazado' };

  // Las claves de PRUEBA de Cloudflare no ejecutan el desafio real: devuelven
  // success sin `action` ni `hostname`, asi que las dos comprobaciones de abajo
  // nunca podrian pasar en desarrollo.
  //
  // Relajarlas se ata a que el secreto sea una clave de prueba conocida, no a
  // una variable de entorno. Asi es imposible debilitar produccion por error de
  // configuracion: con el secreto real, las tres comprobaciones se aplican
  // siempre. Y si alguien dejara una clave de prueba en produccion, queda el
  // aviso en los registros.
  if (esClaveDePrueba(env.TURNSTILE_SECRET)) {
    registrar('error', 'turnstile_en_modo_prueba', {
      aviso: 'Se esta usando una clave de prueba: el formulario NO esta protegido.',
    });
    return { ok: true };
  }

  if (resultado.action !== 'contacto') return { ok: false, motivo: `accion-inesperada:${resultado.action}` };
  if (!resultado.hostname || !permitidos.has(resultado.hostname)) {
    return { ok: false, motivo: `hostname-no-permitido:${resultado.hostname}` };
  }
  return { ok: true };
}

/**
 * Arma y envia el aviso al hotel. Como se ve lo decide servicio/correo.ts.
 * Devuelve el error en vez de lanzarlo.
 */
async function avisarPorCorreo(solicitud: Solicitud, hotel: Hotel, env: Env): Promise<string | null> {
  try {
    const c = armarCorreo(solicitud, hotel);
    const m = createMimeMessage();
    m.setSender({ addr: env.CORREO_ORIGEN, name: hotel.nombre });
    m.setRecipient(env.CORREO_DESTINO);
    m.setSubject(c.asunto);

    // Si la persona dejo un correo, va como Reply-To: asi el hotel responde
    // desde Gmail y le llega directo a ella. Tiene que ser un Mailbox y una
    // direccion valida (armarCorreo ya lo comprobo): con otra cosa, mimetext
    // lanza MIMETEXT_INVALID_HEADER_VALUE y el aviso no sale.
    if (c.responderA) m.setHeader('Reply-To', new Mailbox({ addr: c.responderA }));

    // Dos versiones del mismo aviso; el programa de correo muestra la que sabe.
    m.addMessage({ contentType: 'text/plain', data: c.texto });
    m.addMessage({ contentType: 'text/html', data: c.html });

    await env.CORREO.send(new EmailMessage(env.CORREO_ORIGEN, env.CORREO_DESTINO, m.asRaw()));
    return null;
  } catch (e) {
    return String(e).slice(0, 500);
  }
}

/**
 * El formulario solo se acepta desde el propio sitio. El navegador dice de donde
 * sale cada pedido (Origin y Sec-Fetch-Site) y una pagina ajena no puede
 * falsificarlo: asi otro sitio no puede hacer que sus visitantes manden
 * solicitudes sin saberlo. Turnstile sigue siendo la defensa principal; esto es
 * una segunda llave. Si el navegador no manda ninguno de los dos datos (los muy
 * viejos), se deja pasar y decide Turnstile.
 */
function vieneDelSitio(request: Request, env: Env): boolean {
  const propios = (env.TURNSTILE_HOSTNAMES ?? '').split(',').map((h) => h.trim()).filter(Boolean);
  return mismoSitio(request, propios);
}

async function recibirSolicitud(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (!vieneDelSitio(request, env)) {
    registrar('info', 'solicitud_de_otro_origen', { origen: request.headers.get('origin'), ip_pais: request.cf?.country });
    return json({ ok: false, error: 'Esta solicitud no viene del sitio del hotel.' }, 403);
  }
  if (!/^(multipart\/form-data|application\/x-www-form-urlencoded)\b/i.test(request.headers.get('content-type') ?? '')) {
    return json({ ok: false, error: 'Formato de solicitud no admitido.' }, 415);
  }
  const largo = Number(request.headers.get('content-length') ?? '0');
  if (largo > LIMITES.cuerpo) return json({ ok: false, error: 'La solicitud es demasiado grande.' }, 413);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: 'No pudimos leer el formulario.' }, 400);
  }

  const crudo = Object.fromEntries(form) as CamposCrudos;
  const ip = request.headers.get('cf-connecting-ip');

  // 1. Antes que nada, comprobar que no es un robot.
  const verificacion = await verificarTurnstile(String(form.get('cf-turnstile-response') ?? ''), ip, env);
  if (!verificacion.ok) {
    registrar('info', 'solicitud_rechazada', { motivo: verificacion.motivo, ip_pais: request.cf?.country });
    return json({ ok: false, error: 'No pudimos verificar que eres una persona. Recarga la página e inténtalo de nuevo.' }, 403);
  }

  // 2. Validar y normalizar. Los campos obligatorios son los que el
  //    formulario ya marcaba como obligatorios en Webflow.
  const nombre = texto(crudo.nombre, LIMITES.nombre);
  const contacto = texto(crudo.contacto, LIMITES.contacto);
  const fechas = texto(crudo.fechas, LIMITES.fechas);
  const mensaje = texto(crudo.mensaje, LIMITES.mensaje);

  const faltan: string[] = [];
  if (!nombre) faltan.push('nombre');
  if (!contacto) faltan.push('teléfono o correo');
  if (!fechas) faltan.push('fechas');
  if (!mensaje) faltan.push('mensaje');
  if (crudo.privacidad !== 'si') faltan.push('aviso de privacidad');
  if (faltan.length) {
    return json({ ok: false, error: `Falta completar: ${faltan.join(', ')}.` }, 400);
  }

  const nPersonas = Number.parseInt(texto(crudo.personas, 8), 10);
  const personas = Number.isFinite(nPersonas) && nPersonas > 0 && nPersonas <= LIMITES.personasMax ? nPersonas : null;

  const habitacion = HABITACIONES.has(String(crudo.habitacion)) ? String(crudo.habitacion) : '';
  // Llegada y salida aparte: solo sirven para que el aviso las muestre bien. Si
  // no vienen o no son fechas, el aviso usa el texto de `fechas`.
  const llegada = esFechaIso(crudo.llegada) ? crudo.llegada : undefined;
  const salida = llegada && esFechaIso(crudo.salida) && crudo.salida > llegada ? crudo.salida : undefined;
  const hotel = HOTELES[env.HOTEL === 'la' || (!env.HOTEL && /arcos/i.test(env.CORREO_ORIGEN)) ? 'la' : 'qa'];
  const motivo = MOTIVOS.has(String(crudo.motivo)) ? String(crudo.motivo) : '';
  const recibida_en = new Date().toISOString();

  // 3. Guardar PRIMERO. Si esto falla, se avisa a la persona: es preferible
  //    que reintente a que crea que reservo y nadie tenga su solicitud.
  let id: number | null = null;
  try {
    const r = await env.DB.prepare(
      `INSERT INTO solicitudes
         (recibida_en, nombre, contacto, fechas, personas, habitacion, motivo, mensaje, ip_pais, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING id`
    )
      .bind(
        recibida_en,
        nombre,
        contacto,
        fechas,
        personas,
        habitacion,
        motivo,
        mensaje,
        (request.cf?.country as string) ?? null,
        (request.headers.get('user-agent') ?? '').slice(0, 300)
      )
      .first<{ id: number }>();
    id = r?.id ?? null;
    registrar('info', 'solicitud_guardada', { id, ip_pais: request.cf?.country });
  } catch (e) {
    registrar('error', 'fallo_al_guardar', { detalle: String(e) });
    return json({ ok: false, error: 'Hubo un error al enviar. Intenta de nuevo o escríbenos por WhatsApp.' }, 500);
  }

  // 4. El correo va despues y NO bloquea la respuesta: la solicitud ya esta
  //    guardada, asi que la persona puede seguir con su vida.
  ctx.waitUntil(
    (async () => {
      const error = await avisarPorCorreo(
        { id, nombre, contacto, fechas, llegada, salida, personas, habitacion, motivo, mensaje, recibida_en },
        hotel,
        env
      );
      try {
        await env.DB.prepare('UPDATE solicitudes SET correo_ok = ?, correo_error = ? WHERE id = ?')
          .bind(error ? 0 : 1, error, id)
          .run();
      } catch (e) {
        registrar('error', 'fallo_al_marcar_correo', { id, detalle: String(e) });
      }
      registrar(error ? 'error' : 'info', error ? 'correo_fallido' : 'correo_enviado', { id, detalle: error });
    })()
  );

  return json({ ok: true, mensaje: '¡Gracias! Nos pondremos en contacto pronto.' });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/contacto') {
      if (request.method !== 'POST') {
        return json({ ok: false, error: "Método no permitido." }, 405);
      }
      return recibirSolicitud(request, env, ctx);
    }

    // Los videos se entregan por tramos (el servicio de archivos no lo hace): ver
    // tramos.ts. Necesita "run_worker_first": ["/video/*"] en wrangler.jsonc.
    if (url.pathname.startsWith('/video/')) return conSeguridad(await porTramos(request, env.ASSETS));

    // Webflow servia el indice en /sitemap.xml y el robots.txt viejo de Los
    // Arcos lo declaraba asi. Astro lo genera como /sitemap-index.xml, de modo
    // que la URL antigua quedaba en 404 despues de la migracion.
    if (url.pathname === '/sitemap.xml') {
      return Response.redirect(new URL('/sitemap-index.xml', url).href, 301);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
