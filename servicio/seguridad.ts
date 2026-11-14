// Cabeceras de seguridad, en un solo lugar.
//
// Las páginas y los archivos las reciben por el archivo _headers que escribe scripts/cabeceras.mjs al compilar (ahí
// se agrega además la política de contenido, que lleva las huellas de los guiones de cada compilación). Lo que
// responde el propio servicio (el formulario y los videos) no pasa por _headers: se las pone `conSeguridad`.

const PERMISOS_APAGADOS = ['accelerometer', 'camera', 'display-capture', 'encrypted-media', 'geolocation', 'gyroscope', 'magnetometer', 'microphone', 'midi', 'payment', 'usb', 'xr-spatial-tracking', 'browsing-topics', 'interest-cohort'];
// lo único que el sitio sí usa: pantalla completa y video en ventanita (reproductor), copiar el enlace del mapa, y que
// sus propios videos de ambiente puedan arrancar solos
const PERMISOS_PROPIOS = ['autoplay', 'fullscreen', 'clipboard-write', 'picture-in-picture'];

export const CABECERAS: [string, string][] = [
  // un año de «solo HTTPS», también en subdominios. Sin «preload»: eso es casi irreversible y no hace falta.
  ['Strict-Transport-Security', 'max-age=31536000; includeSubDomains'],
  // el navegador respeta el tipo de archivo que le decimos y no «adivina» otro
  ['X-Content-Type-Options', 'nosniff'],
  // nadie puede meter el sitio dentro de un marco en otra página (engaños de clic)
  ['X-Frame-Options', 'DENY'],
  // a otros sitios solo se les dice el dominio de donde viene el visitante, nunca la página
  ['Referrer-Policy', 'strict-origin-when-cross-origin'],
  ['Permissions-Policy', [...PERMISOS_APAGADOS.map((p) => p + '=()'), ...PERMISOS_PROPIOS.map((p) => p + '=(self)')].join(', ')],
  // Cross-Origin-Opener-Policy NO va, a propósito. Aísla la ventana de las que abran otros sitios, cosa que aquí no
  // protege nada (no hay sesiones ni ventanas emergentes propias), y en Firefox dejaba páginas a medio cargar al
  // abrir varias pestañas del sitio a la vez (medido el 12 nov 2026: 9 cuelgues con ella, 0 sin ella).
  ['X-Permitted-Cross-Domain-Policies', 'none'],
];

/** La respuesta de un servicio (JSON del formulario, tramo de video) con las cabeceras de seguridad puestas. */
export function conSeguridad(r: Response, esDatos = false): Response {
  const s = new Response(r.body, r);
  for (const [k, v] of CABECERAS) s.headers.set(k, v);
  // una respuesta de datos nunca debe poder pintarse como página ni cargar nada
  if (esDatos) s.headers.set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  return s;
}

/**
 * ¿El pedido sale del propio sitio? El navegador dice de dónde viene cada pedido (Origin y Sec-Fetch-Site) y una
 * página ajena no puede falsificarlo: así otro sitio no puede hacer que sus visitantes manden el formulario sin
 * saberlo. Si el navegador no manda ninguno de los dos datos (los muy viejos), se deja pasar y deciden las demás
 * defensas (Turnstile).
 */
export function mismoSitio(pedido: Request, propios: string[] = []): boolean {
  const sitio = pedido.headers.get('sec-fetch-site');
  if (sitio && sitio !== 'same-origin' && sitio !== 'none') return false;
  const origen = pedido.headers.get('origin');
  if (!origen) return true;
  let host = '';
  try { host = new URL(origen).hostname; } catch { return false; }
  return host === new URL(pedido.url).hostname || propios.includes(host);
}
