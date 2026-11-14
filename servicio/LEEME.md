# Servicio del formulario de reserva (correo al hotel)

Aquí está, listo para usarse, el servicio que recibe el formulario de Contacto del sitio nuevo y le avisa al hotel por correo. **No está publicado**: los sitios reales siguen con el suyo hasta que se decida pasar el rediseño a producción.

## Qué hay

| Archivo | Para qué |
| --- | --- |
| `correo.ts` | Arma el correo: asunto, versión con formato y versión de solo texto. No manda nada. |
| `seguridad.ts` | Las cabeceras de seguridad (una sola lista para páginas y servicios) y la comprobación de que el formulario sale del propio sitio. |
| `tramos.ts` | Entrega los videos por tramos (para poder saltar dentro del video y para que Safari los reproduzca). |
| `worker.ts` | El servicio completo. Es el que hoy está publicado, con tres cambios: usa el correo nuevo, recibe la llegada y la salida aparte, y acepta los cuatro tipos de habitación. |

## Qué cambió del correo

- **Asunto** que ya dice todo en la bandeja: `Solicitud de reserva · Mariana Treviño · 13 al 15 nov · 2 personas`.
- **Arriba y en grande**: quién, llegada, salida, noches y personas.
- **Botones** para contestar con un toque: «Responder por WhatsApp» (abre el chat con un saludo ya escrito) y «Llamar» si dejó teléfono; «Responder por correo» si dejó correo.
- **Su mensaje** en un recuadro, y al final el detalle (habitación, motivo, hora en que llegó y folio).
- Va en dos versiones dentro del mismo correo (con formato y solo texto), así se lee bien en cualquier programa.
- Todo lo que escribe la persona se escapa: no puede meter código ni alterar el asunto.

## Verlo sin enviar nada

```bash
node scripts/correo-vista.mjs
```

Arma tres correos de ejemplo y los guarda en `.capturas/correo/` como página y como foto (computadora y celular).

## Qué falta probar

El envío real. No se probó a propósito: el correo le llega al hotel. Cuando se quiera probar, lo más seguro es cambiar un momento `CORREO_DESTINO` por un correo propio en una copia del servicio.

## Cómo pasarlo a producción (cuando se decida)

En cada repositorio (`quintaazul/hotel-quinta-azul` y `quintaazul/hotel-los-arcos`):

1. Copiar `servicio/worker.ts`, `servicio/correo.ts`, `servicio/tramos.ts` y `servicio/seguridad.ts` a `src/` (sustituye al `src/worker.ts` actual).
2. En `wrangler.jsonc`, dentro de `vars`, agregar `"HOTEL": "qa"` en Quinta Azul o `"HOTEL": "la"` en Los Arcos; y dentro de `assets`, agregar `"run_worker_first": ["/video/*"]`. Después correr `npx wrangler types`.
3. `npm run check`, `npm run build` y `npx wrangler deploy`.

**Por qué los videos pasan por el servicio:** el servicio de archivos de Cloudflare no entrega pedidos parciales (devuelve siempre el archivo entero). Sin `tramos.ts` no se puede saltar a otro punto del video hasta que bajó completo, y en iPhone puede no reproducir. Solo los videos pasan por el servicio (`/video/*`); fotos y páginas siguen saliendo directo y gratis.

La base de datos no cambia y `mimetext` ya está instalado en los dos repositorios. El formulario viejo sigue funcionando con el servicio nuevo (la llegada y la salida aparte son opcionales).

## Seguridad

Hoy los sitios publicados no mandan ninguna cabecera de seguridad (nota **F** en securityheaders.com). El sitio nuevo sí (nota **A+** en la copia de prueba):

- **Política de contenido (CSP):** el navegador solo ejecuta el código del propio sitio. Los tres guiones escritos dentro de las páginas se autorizan por su huella, que se calcula al compilar (`scripts/cabeceras.mjs`, lo llama `scripts/build.mjs`). De fuera solo se admite Cloudflare (Turnstile y su analítica sin cookies).
- **Solo HTTPS** durante un año (HSTS), sin dejarse meter en marcos de otros sitios, sin adivinar tipos de archivo, sin contar la página de origen a otros sitios, y con cámara, micrófono, ubicación y demás apagados.
- Todo va en `dist-<hotel>/_headers`, que el servicio de archivos de Cloudflare aplica solo. Lo que responde el servicio (formulario y video) lleva las mismas cabeceras desde `seguridad.ts`.
- **Formulario:** solo acepta envíos del propio sitio (`Origin` y `Sec-Fetch-Site`), solo formularios (no JSON), con límite de tamaño, Turnstile, consulta a la base con parámetros y correo con todo escapado.
- El sitio no pone cookies, no carga nada de otros dominios (las letras van en el propio sitio) y sus dependencias no tienen fallos conocidos (`npm audit`: 0).

Se comprueba con `node scripts/seguridad.mjs <url>` (cabeceras por tipo de respuesta, bloqueos de la política en todas las páginas, pedidos a otros dominios, cookies y el formulario).

**En el panel de Cloudflare de cada dominio** (no se toca desde este proyecto), conviene revisar al publicar:

- SSL/TLS → modo **Completo (estricto)**; **Versión mínima de TLS 1.2**; **TLS 1.3** encendido; **Usar siempre HTTPS** encendido (hoy ya redirige).
- Seguridad → **Bot Fight Mode** encendido. Ojo: en «Bots de IA», dejar **permitir** (si se bloquean, el sitio no sale en los buscadores con IA).
- WAF → una regla de **límite de peticiones** para `/api/contacto` (por ejemplo, 5 por minuto por visitante). El plan gratis incluye una.
- La cabecera HSTS dice «también subdominios»: antes de publicar, confirmar que no hay ningún subdominio del hotel que funcione solo sin cifrar.

### Cifrado mínimo (TLS 1.2): a quién deja fuera

TLS 1.0 y 1.1 son dos versiones de cifrado de 1999 y 2006 que ya están retiradas. Dejar el mínimo en 1.2 no afecta a ningún navegador en uso:

- Chrome, Edge, Firefox y Safari **quitaron** TLS 1.0 y 1.1 en 2020: desde entonces ninguno los usa aunque el sitio los ofrezca.
- TLS 1.2 existe desde Chrome 29, Firefox 27, Safari 7 / iOS 5, Android 4.4 e Internet Explorer 11 (todos de 2013 o antes).
- Los únicos equipos que solo saben usar 1.0 o 1.1 son: Android 4.0 a 4.3, Internet Explorer 7 a 10, Safari 5 y 6, Windows Phone 8 y programas con Java 7 u OpenSSL 0.9.8. Esos equipos tampoco pueden pintar el sitio (no entienden su código ni sus fotos).
- Google, Bing, WhatsApp y Facebook leen el sitio con TLS 1.2 o 1.3.

Para verlo con datos del propio dominio antes de cambiarlo: en el panel de Cloudflare, **SSL/TLS → Información general → «Tráfico servido por TLS»** muestra qué parte de las visitas usa cada versión.

Cambiarlo: **SSL/TLS → Certificados de borde → Versión mínima de TLS → TLS 1.2**. Es gratis y se revierte igual, al instante.

### Correo y DNS

- **DMARC:** revisar que cada dominio tenga su registro TXT en `_dmarc` (para empezar, `v=DMARC1; p=none; rua=mailto:<un correo del hotel>`; ya que se vea que todo llega bien, subir a `p=quarantine`).
- **DNSSEC:** firmar los dominios es opcional y gratis: se enciende en Cloudflare (DNS → Configuración) y se copia el registro DS en Porkbun. Hacerlo con calma: un DS mal copiado deja el dominio sin responder.

## Fotos del tamaño justo

`scripts/imagenes-de-mas.mjs` abre cada página en seis pantallas y compara el archivo que el navegador bajó con el que hacía falta. Tres ayudas de `Foto.astro` lo mantienen bien:

- `cubre={ancho / alto}`: la foto llena una caja de proporción fija; si es más apaisada que la caja, el tamaño declarado crece para que no llegue chica.
- `portada`: la foto llena la pantalla; se declara el ancho exacto al que se pinta (ancho de pantalla o alto × proporción de la foto).
- En pantallas de 3 puntos por píxel todo se pide al 68 % (queda a 2×): pesa cerca de la mitad y se ve igual.
