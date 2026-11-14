# Hoteles Quinta Azul y Los Arcos Inn · rediseño de las dos webs

Instrucciones para quien trabaje en este proyecto, sea una persona o un asistente. Léelas antes de cambiar nada.

## Contexto: dónde vive este código (léelo primero)

- Esto es la rama **`rediseno`** de los dos repositorios de los hoteles: `quintaazul/hotel-quinta-azul` y `quintaazul/hotel-los-arcos`. Es el mismo proyecto en los dos, porque un solo código produce los dos sitios. Las dos ramas se mantienen idénticas.
- La rama **`main`** de cada repositorio es otra cosa: el sitio que está publicado hoy en el dominio real (hotelquintaazul.com y www.hotelarcosinn.com). `main` y `rediseno` no comparten historial y **no se mezclan**: nada de merge ni rebase entre ellas.
- El rediseño **todavía no está publicado** en los dominios reales (al 14 de noviembre de 2026). Se puede ver en las copias de prueba, que van cerradas a buscadores: https://prueba-quinta-azul.bijuu-nexo.workers.dev y https://prueba-los-arcos.bijuu-nexo.workers.dev
- Subir cambios a GitHub **no publica nada**: ningún repositorio tiene publicación automática. Un sitio solo cambia cuando alguien ejecuta a mano la orden de publicar.
- Para guardar un cambio del rediseño: commit en `rediseno` y subirlo a **los dos** repositorios. Si existe el remoto `hoteles` (apunta a los dos), basta `git push hoteles rediseno`; si no, un push a cada repositorio.
- El día que el rediseño pase a los dominios reales, los pasos están en `servicio/LEEME.md` y en la sección 12 de `docs/LISTA-DEL-BRIEF.md`. Se hace solo cuando el dueño lo pida.

## Qué es

- Un solo código (Astro, sitio estático) que produce **dos sitios**: Hotel Quinta Azul (`qa`, azul, hotelquintaazul.com) y Hotel Los Arcos Inn (`la`, naranja, www.hotelarcosinn.com), los dos en García, Nuevo León. El hotel se elige con `HOTEL=qa|la`; lo ponen los guiones, no hay que escribirlo a mano.
- Es el **rediseño**. El sitio publicado hoy está en la rama `main` de cada repositorio y desde aquí no se toca.
- Se trabaja y se responde **en español**. Todo lo que lee el dueño va en español, sin tecnicismos.

## Para empezar

```
npm install
npm run dev:qa     taller con recarga al guardar      http://127.0.0.1:4311   (dev:la → 4312)
npm run build:qa   compila a dist-qa/                                         (build:la → dist-la/)
npm run ver:qa     sirve lo compilado, como publicado  http://127.0.0.1:4321   (ver:la → 4322)
```

Hecho y probado con Node 24. Los guiones de revisión necesitan Playwright (una vez: `npm i -D playwright`; detalle en `scripts/_pw.mjs`) y Edge o Chrome instalados.

El dueño mira el sitio **compilado** (4321 y 4322). Lo visual se itera en el taller o con capturas, y se compila cuando ya está revisado: no dejar a medias lo que él ve.

## Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Datos de cada hotel: teléfono, WhatsApp, dirección, coordenadas, habitaciones con precio y fotos, palapa, distancias, videos, galería | `src/data/hoteles.ts` |
| Textos de cada página por hotel: títulos y descripciones para buscadores, encabezados, preguntas frecuentes | `src/data/textos.ts` |
| Blog: configuración y artículos | `src/data/blog.ts`, `src/content/blog/<hotel>/*.md` |
| Reglas de diseño (72) y su documento por hotel | `src/data/estandar.json` → `docs/ESTANDAR-*.md` (`node scripts/estandar.mjs`) |
| Sistema de diseño: variables de color, letra, espacio, radios, sombras, tiempos | `src/styles/sistema.css`; colores de cada hotel en `marca-qa.css` y `marca-la.css` |
| Fotos, ya con el acabado común | `src/assets/<hotel>/` |
| Sombreado de cada foto de portada | `src/data/velos.json` (lo calcula `scripts/legibilidad.mjs --ajustar`) |
| Direcciones que cambiaron (redirección 301) | `src/data/redirecciones.json` |
| Lugares del mapa | `src/data/lugares.json` |
| Páginas, piezas y plantilla | `src/pages`, `src/components`, `src/layouts/Base.astro` |
| Interacción: WhatsApp, formulario, movimiento | `src/scripts` |
| Servicio del formulario para producción | `servicio/` (pasos en `servicio/LEEME.md`) |
| Compilar, revisar y medir | `scripts/` |
| Copias de prueba en Cloudflare | `prueba/` y `scripts/publicar-prueba.mjs` |
| Pendientes y preguntas para el hotel | `docs/LISTA-DEL-BRIEF.md`, `docs/PREGUNTAS-Y-CONTENIDO-PENDIENTE.md` |

## Cambios típicos

**Regla de oro: cada dato se escribe en un solo lugar.** Antes de cambiar un dato, búscalo en todo `src/` para ver dónde aparece.

- **Precio de una habitación.** `precio` dentro de `habs`, en `hoteles.ts`. Los títulos, las descripciones, los enlaces y las preguntas lo toman de ahí (`DESDE` y `precioDe()` en `textos.ts`): no escribir «$900» a mano en un texto. Los artículos del blog sí llevan el número escrito; `node scripts/seo.mjs` dice cuáles quedaron con el precio viejo.
- **Teléfono o WhatsApp.** `tel`, `telLink` y `wa` en `hoteles.ts`.
- **Minutos a las Grutas, a Xenpal o a Monterrey.** `dist` en `hoteles.ts`. `seo.mjs` falla si una página dice otro número.
- **Horarios, capacidad de la palapa, anticipo, reglas.** Están escritos en varios textos. Busca el valor viejo en todo `src/` y cámbialo en todas partes: `hoteles.ts`, `textos.ts` (incluye las preguntas frecuentes), los artículos y las páginas legales.
- **Una pregunta frecuente.** Lista `FAQ` en `textos.ts`, con `id` único. Para que salga en una página, su `id` va en `FAQ_DE`. Ninguna pregunta sale en dos páginas; la lista completa vive en /preguntas-frecuentes.
- **Texto de una sección.** `T.<página>` en `textos.ts`. Los títulos llevan un renglón normal (`l`) y una frase corta dentro del óvalo (`o`).
- **Artículo nuevo.** Un `.md` en `src/content/blog/<hotel>/` con la misma cabecera que los existentes (el esquema está en `src/content.config.ts`). Quinta Azul escribe de qué hacer en García, fiestas en la palapa y escapadas; Los Arcos, de las Grutas, Xenpal, departamentos y reuniones familiares. Ninguno publica sobre el tema del otro.
- **Foto nueva.** A `src/assets/<hotel>/`, con nombre descriptivo terminado en `-hotel-quinta-azul.jpg` o `-hotel-los-arcos-inn.jpg`, con el mismo acabado que las demás (`scripts/acabado.mjs`) y la luz de tarde. Si va en una portada, medir la legibilidad (abajo).
- **Tipo de habitación que se agrega o se quita.** `habs` en `hoteles.ts`: las fichas, la tabla, el formulario y los datos para Google salen de ahí. Revisar también `TIPOS` en `textos.ts`.

## Antes de dar algo por terminado

1. Compilar **los dos** hoteles, porque el código es compartido: `node scripts/build.mjs qa` y `node scripts/build.mjs la`.
2. `node scripts/seo.mjs` debe decir «sin fallas» en los dos.
3. Con los dos sitios servidos (`npm run ver:qa` y `npm run ver:la`): `node scripts/revisar.mjs http://127.0.0.1:4321 http://127.0.0.1:4322`. Revisa 8 pantallas, de 4K a celular chico; `--pantallas=celular-chico,720p` para una pasada rápida.
4. Si cambió una portada o su foto: `node scripts/legibilidad.mjs <las dos direcciones>` (0 textos por debajo de la meta; con `--ajustar` recalcula el sombreado y hay que volver a compilar) y `node scripts/cabe-portada.mjs <las dos direcciones>`.
5. Si cambió un título con óvalo: `node scripts/ovalos.mjs http://127.0.0.1:4321 qa` y mirar la hoja que genera.
6. Si cambió WhatsApp o el formulario: `node scripts/probar-whatsapp.mjs <las dos direcciones>`. Al probar **nunca** se envían mensajes, correos ni formularios de verdad: se comprueba lo que se armaría.
7. Si cambió algo que se ve: mirar las páginas pantalla por pantalla, en celular y en computadora (`node scripts/hojas-todas.mjs cel` y `pc`; las hojas salen en `.capturas/hojas`). Buscar: foto que no va con su texto, foto repetida en la página, texto descentrado, cosas apretadas, botones partidos en dos renglones.

## Reglas que no se rompen

- **Solo datos confirmados.** Lo que no se puede confirmar (un precio, un horario, un negocio cercano) no se publica; se anota como pregunta para el hotel.
- **El diseño sigue el estándar** (`docs/ESTANDAR-QUINTA-AZUL.md` y `docs/ESTANDAR-LOS-ARCOS.md`). Todo valor sale de las variables de `sistema.css`; si falta uno, se agrega al sistema y se regenera el estándar. Un cambio de diseño se revisa en las 8 pantallas.
- **Decisiones del dueño que no se reabren:**
  - Nada de cambiar la foto de una habitación al pasar el ratón.
  - Quinta Azul no lleva arcos; el arco es de Los Arcos.
  - Sin banda ni botón final de «Reservar».
  - El bloque de la palapa va solo en Inicio y en Celebraciones.
  - Mapa plano y claro, sin 3D.
  - El texto blanco sobre el naranja de Los Arcos se queda.
  - Todas las fotos con una sola luz (la de tarde) y el mismo acabado. Ninguna foto repetida dentro de una página.
  - Animaciones en CSS y scroll nativo; sin librerías de animación.
  - La portada y las animaciones actuales le gustan: no se cambian sin preguntarle.
- **Las dos portadas se comparan en celular**: mismos renglones y mismo aire en los dos hoteles.
- **Rendimiento y accesibilidad se cuidan en cada cambio**: no agregar librerías ni pedir nada a otros dominios; cada foto con su texto alternativo; contraste medido.
- **Producción no se toca.** Nada de publicar en los dominios reales ni de cambiar la rama `main` sin que el dueño lo pida. Los repositorios son públicos: nunca llevan datos personales de huéspedes, claves ni notas sobre debilidades de seguridad de los sitios.

## Publicar

- **Copia de prueba** (para enseñar y pedir opiniones; va cerrada a buscadores): compilar y después `node scripts/publicar-prueba.mjs qa|la`. Usa la sesión de Cloudflare del equipo (`npx wrangler login`); los nombres están en `prueba/wrangler-*.jsonc`. En noviembre de 2026 quedaron en https://prueba-quinta-azul.bijuu-nexo.workers.dev y https://prueba-los-arcos.bijuu-nexo.workers.dev.
- **Producción**: los pasos están en `servicio/LEEME.md` y en la sección 12 de `docs/LISTA-DEL-BRIEF.md`. Se hace solo cuando el dueño lo pida.

## Qué falta

- `docs/PREGUNTAS-Y-CONTENIDO-PENDIENTE.md`: preguntas para el hotel, fotos que faltan y textos por escribir, cada una con su clave.
- `docs/LISTA-DEL-BRIEF.md`: todo lo hecho y lo pendiente, por fecha.
