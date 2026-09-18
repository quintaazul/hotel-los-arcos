# Verificacion — Hotel Los Arcos Inn (Fases 1 y 2)

Medido el 5-sep-2026 contra https://www.hotelarcosinn.com en vivo.

## Fidelidad visual

| Pagina        | Ancho  | Webflow | Astro  | Diferencia |
|---------------|--------|---------|--------|------------|
| home          | 1425px | 12504   | 12504  | 0          |
| home          | 753px  | 15119   | 15119  | 0          |
| home          | 375px  | 14664   | 14664  | 0          |

Las 12 secciones de la home coinciden una a una. Comparador estructural:
5/5 paginas sin diferencias en encabezados, texto, enlaces, imagenes,
secciones y metadatos.

Coincidio a la primera, sin ajustes, porque las dos lecciones de Quinta Azul
ya venian aplicadas: cargar las fuentes con la API v1 de Google Fonts y portar
el CSS que Webflow inyecta en linea.

## Defectos del original corregidos

Los tres vienen de copiar Quinta Azul sin actualizar:

1. **La pagina 404 mandaba al WhatsApp del OTRO hotel.** Su boton apuntaba a
   528129218643 (Quinta Azul) en lugar de 528126155485. Un cliente perdido en
   el sitio acababa escribiendole al hotel equivocado.
2. **Su boton "Ver habitaciones" apuntaba a /hospedaje**, ruta que en este
   sitio NO existe y devuelve 404. Una pagina de error con un enlace roto.
3. **Su foto de fondo era de Quinta Azul**, servida ademas desde el CDN del
   otro sitio.

Ademas, comunes a los dos hoteles:

4. Ninguna pagina declaraba idioma ni tenia `og:image`.
5. Los canonical apuntaban al apex, que hace 301 al www: una URL canonica que
   redirige. Ahora apuntan al www, que es donde vive el contenido.
6. Los campos del formulario tenian los nombres de la plantilla Relume.
7. El bloque "Tus fechas" era `type=email` con placeholder de fechas: imposible
   de enviar. Ahora abre WhatsApp con las fechas escritas.
8. El CSS pedia dos imagenes al CDN de Webflow (fondo de la 404 y flecha del
   desplegable) que habrian muerto al cancelar el plan.

## Imagenes

Las 15 que usa el sitio se compararon una a una contra el CDN: **todas
identicas** al juego rescatado en Downloads. No falto ninguna, a diferencia
de Quinta Azul.

## Accesibilidad (axe-core, WCAG 2.2 AA)

| Pagina         | Violaciones |
|----------------|-------------|
| /              | 1 (ver nota)|
| /habitaciones  | 0           |
| /celebraciones | 0           |
| /ubicacion     | 0           |
| /contacto      | 0           |
| 404            | 0           |

La unica alerta es el contraste del boton naranja de marca (blanco sobre
#e3791c = 2.99, el minimo es 4.5). **Es identica en Webflow**, asi que se
conserva tal cual: corregirla implica cambiar el color de marca, que es una
decision de diseno para la fase de rediseno, no de la migracion.

## Formulario

| Caso | Respuesta | Correcto |
|------|-----------|----------|
| Solicitud valida | 200, guardada, correo construido | si |
| Sin token de Turnstile | 403 | si |
| Campos obligatorios ausentes | 400 con la lista | si |
| Tipo de habitacion y motivo inventados | se descartan | si |
| 50000 personas | se descarta (tope 200) | si |
| Inyeccion SQL en el nombre | guardado como texto, tabla intacta | si |
| Envio real desde el navegador | 200 y mensaje de exito | si |

Base de datos D1: `los-arcos-solicitudes`
(`f3e2e6a9-f6f0-4db0-96e4-ba83cfbbfaf5`).

## Pendiente de decision (no es un fallo tecnico)

El desplegable "Tipo de habitacion" solo ofrece **Sencilla y Doble**, pero el
hotel promociona **Sencilla, Triple y Departamento con cocina** en la pagina de
habitaciones y en su schema. Quien quiera un departamento no puede pedirlo por
el formulario. Se dejo igual para no alterar lo que se ve; cambiarlo es una
decision del cliente.

## Limitaciones de la prueba local

Igual que en Quinta Azul: wrangler **simula** el envio de correo, y Turnstile
corre con claves de prueba que no ejecutan el desafio real. Ambas cosas solo se
pueden comprobar de verdad despues de desplegar.

---

# Auditoria previa a la Fase 3

Medido el 10-sep-2026 contra https://www.hotelarcosinn.com en vivo. Paginas:
home, habitaciones, celebraciones, ubicacion, contacto y 404. Anchos: 1920,
1440, 1366, 1024, 768, 430, 390, 375 y 360 px.

## Animaciones de Webflow: inventario y estado

Las interacciones (IX2) se extrajeron del JavaScript que publica Webflow. Son
las mismas que en Quinta Azul (el sitio es un duplicado):

| Donde | Animacion original | Pantallas | Antes de la auditoria | Ahora |
|-------|--------------------|-----------|-----------------------|-------|
| home, alberca | La foto pasa de 200% a 100% de ancho en 1.4 s al entrar en pantalla | desde 768 px | Sustituida por otra y activa tambien en celular | Igual que Webflow |
| habitaciones, tarjetas | Al pasar el raton: tarjeta 50% a 70%, velo 0.5 a 0.7, aparece el texto | desde 992 px | Perdida | Igual |
| contacto, titulo | "Tu reserva comienza / aquí mismo" entran desde los lados con el scroll | desde 480 px | Perdida | Igual |
| contacto y ubicacion, preguntas | Acordeon; el + gira 45 grados | todas | **Rota: las respuestas no se podian abrir** | Igual, y con teclado |
| menu movil | Baja desde la barra en 0.4 s | menos de 992 px | Aparecia de golpe | Igual |
| pestanas | Salida 0.1 s, entrada 0.3 s | todas | Cambio de golpe | Igual |

Probado en local: foto 1216 a 608 px, tarjetas 592/592 a 687/497 px y de
vuelta, acordeon 0 a 96 px y de vuelta, titulo en -20% al primer cuarto del
scroll (Webflow en vivo: -20%), pestanas con desvanecido.

## Menu movil abierto y orden del CSS

Aqui se detecto el problema (captura de Emilio en tablet): enlaces en una sola
linea, botones angostos y letra de 18 px en vez de 16. Causas y arreglo, igual
que en Quinta Azul: faltaban las marcas que Webflow pone al abrir el menu, y el
CSS se cargaba en otro orden que el original. Ahora el menu abierto mide lo
mismo que en Webflow: enlaces de 839x48 px uno debajo de otro, botones de
839x34 px, letra de 16 px.

## Comparacion completa: 6 paginas x 9 anchos

- **home, habitaciones, celebraciones, ubicacion y contacto:** identicas en los
  9 anchos (como mucho 1 px de redondeo en la altura total).
- **404:** la de Webflow no carga sus estilos en linea ni sus fuentes. La
  nuestra usa los del resto del sitio. Diferencia intencional.
- **Menu movil abierto:** identico en los 5 anchos menores de 992 px.

## Contraste del naranja de marca

axe marca 16 elementos por pagina (18 en contacto): texto blanco sobre el
naranja #e3791c (contraste 2.99; el minimo es 4.5, o 3 en titulos grandes).
Se comparo elemento por elemento con Webflow en vivo en la home y en contacto:
**es exactamente la misma lista**. No lo introdujo la migracion; corregirlo es
cambiar el color de marca, decision del cliente para el rediseno. (La tabla de
la Fase 1 decia "1" porque contaba reglas, no elementos.)

## Corregido en esta auditoria

1. Animaciones perdidas o cambiadas (tabla de arriba) y acordeon roto.
2. Menu movil abierto distinto del original y orden del CSS invertido.
3. La imagen para redes sociales (`og:image`) daba 404. Creada en `public/og/`
   (1200x630); el build ahora falla si falta.
4. Faltaba `robots.txt`. Creado, con la ruta del sitemap; el build lo exige.
5. La pagina de habitaciones todavia descargaba jQuery de un CDN externo.
   Eliminado; su efecto se reimplemento sin librerias.
6. La galeria de celebraciones tenia sus datos vacios en Webflow y al hacer
   clic la pagina saltaba al inicio. Ahora abre la foto en un visor.
7. La etiqueta "¿Cuál es tu motivo de visita?" ahora es de bloque, como el
   `<label>` original.
8. 3 errores de tipos de TypeScript heredados de la Fase 2 (0 ahora).
9. Faltaba el README del repositorio.

## Otras comprobaciones

- `astro check`: 0 errores, 0 advertencias.
- Verificacion SEO propia: pasa en todas; comparador estructural 5/5.
- Enlaces y recursos: 27 rutas internas, todas responden 200.
- Sin scroll horizontal en ningun ancho.
- Desplegado en https://hotel-los-arcos.hotel-quinta-azul.workers.dev, version
  `ea827a6e-4ac9-4389-90de-63bc065eb9aa`: mismos archivos que el build local,
  HTTPS, rutas 200, 404 real, robots, sitemap e imagen OG 200. Turnstile carga
  sin errores (en localhost da el error 110200 porque ese dominio no esta
  autorizado en el widget; es lo esperado).

---

# Fase 3: publicacion en www.hotelarcosinn.com

17-sep-2026. La zona se creo el 10-sep con copia exacta de los registros que
servian a Webflow y los nameservers ya apuntaban a Cloudflare, asi que el corte
de hoy fue solo mover los dos hostnames a sus Workers.

## Como quedo

- `www.hotelarcosinn.com` -> Worker del sitio (Custom Domain).
- `hotelarcosinn.com` -> Worker de `redireccion-apex/`, que hace 301 al www
  conservando ruta y parametros. En Webflow el apex tambien redirigia.
- Always Use HTTPS: el `http://` responde 301 al `https://`.
- Email Routing activo; `losarcos105@gmail.com` verificado el 16-sep-2026.
- Sin copia en `*.workers.dev`, y ese hostname salio del widget de Turnstile
  y de `TURNSTILE_HOSTNAMES`.

## Verificado en vivo

- Las 5 paginas 200; `/no-existe` 404 real; robots, sitemap e imagen OG 200.
- 27 enlaces y recursos internos, todos 200.
- `/api/contacto`: GET 405 y POST sin verificacion de Turnstile 403.
- Sin jQuery y sin recursos de Webflow.
- El canonical es exactamente la URL que se sirve (se corrigio el defecto que
  salio al publicar Quinta Azul: apuntaba a `/contacto.html`).
- El sitemap lista las 5 URLs del www, sin `.html`.
- Accesibilidad sobre el sitio publicado: solo el contraste del naranja de
  marca, identico a Webflow.
- 1.1.1.1, 8.8.8.8 y 9.9.9.9 ya entregan el sitio nuevo.

## Pendiente

- Envio real del formulario desde un telefono: Turnstile bloquea a los
  navegadores automatizados, asi que el correo no se puede probar sin una
  persona. La base de datos esta vacia: todavia no ha entrado ninguna.
- Web Analytics: falta dar de alta `www.hotelarcosinn.com` en el panel. El
  token se guarda en `hotel.json` (`analyticsToken`) y el fragmento ya esta en
  `Base.astro`; Cloudflare NO lo inyecta solo en sitios servidos por un Worker.

## Rendimiento y regresion de peso (17-sep-2026)

Misma regresion que en Quinta Azul: Webflow servia cada foto en cuatro tamanos
y al portar solo se copio el atributo `sizes`, sin los tamanos, asi que un
telefono bajaba la imagen completa.

| | Antes | Ahora |
|---|---|---|
| Rendimiento (Lighthouse movil) | 66 | 71 |
| LCP | 11.0 s | 5.5 s |
| Peso de la pagina | 2,091 KB | 766 KB |

Arreglado en `Foto.astro`. El comparador estructural sigue en 5/5 paginas
identicas. CLS 0 y bloqueo de hilo 0 ms.

## Web Analytics: por que no reportaba y como se arreglo

Igual que en Quinta Azul: el envio a `/cdn-cgi/rum` da 404 y el reintento
contra `cloudflareinsights.com` lo bloquea CORS. Falta cambiar el sitio a
**Enable with JS Snippet installation** en Manage Site y volver a comprobar.

**Resuelto el 17-sep-2026.** El sitio estaba dado de alta en modo
"instalacion automatica", pensado para paginas que inyecta el propio
Cloudflare; ahi el beacon reporta a  del mismo dominio, que en
nuestro caso da 404 porque el origen es un Worker, y el reintento contra
 lo bloqueaba CORS. Con el sitio en modo **Enable
with JS Snippet installation**, su token propio y el fragmento tal como lo
entrega Cloudflare, el envio sale sin errores de consola y las visitas ya
aparecen en la API de analitica.


## Formulario: casillas y opciones que no se veian marcadas (17-sep-2026)

Lo detecto Emilio probando el formulario. **Era una falla real de la
migracion.** En Webflow el input de verdad va oculto y lo que se ve es un
<div>; su JavaScript le anade la clase  al marcarlo.
Al quitar jQuery y webflow.js se perdio esa parte: la opcion SI se guardaba,
pero el circulo y la casilla no cambiaban, asi que el formulario parecia roto.
El CSS de esas clases ya estaba portado; solo faltaba ponerlas.

Reconstruido en , incluido el repintado del grupo entero de
opciones (al marcar una, las demas se desmarcan) y el aro de foco del teclado.
Medido contra la copia de Webflow, el resultado es identico: opcion marcada con
borde de 6 px en #07070a y fondo blanco; casilla en #07070a con su palomita.

Dos cosas mas que salieron de ahi:

- **El anti-spam quedaba pegado al boton Enviar** cuando se dibujaba. Ahora
  se le da aire solo en ese caso: se mide el widget y, si ocupa algo, se le
  ponen 16 px arriba y 8 abajo. Para quien no ve el desafio (casi todos) la
  pagina no cambia ni un pixel.
- **La palomita de la casilla se descargaba del CDN estatico de Webflow.** Era
  la ultima dependencia suya que quedaba y no habia salido en ninguna revision
  porque solo se ve al marcar la casilla. Ya vive en el repo.

Por que no lo vio la auditoria: comparaba las paginas en reposo y las
animaciones, pero nunca marco una opcion ni una casilla.
