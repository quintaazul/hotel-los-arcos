# Datos por confirmar

Regla del proyecto desde el 11 de noviembre de 2026: **dato que no se puede confirmar, no se escribe**. Por eso ya no hay precios ni horarios inventados en las páginas ni en los artículos. Lo que queda aquí son datos que sí salen en el sitio y que conviene que el hotel confirme antes de publicar.

## Hotel Los Arcos Inn

| Dato | Qué dice el sitio | Dónde se cambia |
| --- | --- | --- |
| Camas y capacidad | Doble: 2 personas, 2 camas queen. Triple: 3 personas, 3 camas queen. Departamento: de 4 a 8 personas. Es lo que publican las redes del hotel | `src/data/hoteles.ts` (bloque `la`, `habs`) |
| Fotos de la sencilla y la doble | Son las recámaras de los departamentos: las carpetas de estas habitaciones llegaron vacías | igual (`fotos`) |
| Foto de la triple | Se repite una de la doble (su texto alternativo dice «foto de muestra») | igual |
| Departamento por semana y por mes | «Se cotiza»: no hay precio confirmado | `src/pages/[solo].astro` (tabla de tarifas) |
| Número de unidades | 8 | `src/data/hoteles.ts` |
| Ubicación exacta en el mapa | Punto calculado, sin confirmar | `src/data/hoteles.ts` (`lat`, `lng`, `pin`) |

## Hotel Quinta Azul

| Dato | Qué dice el sitio | Dónde se cambia |
| --- | --- | --- |
| Precio de la palapa | «Se cotiza por WhatsApp»: depende del día, del horario y de cuántos son | `src/pages/celebraciones.astro`, `src/data/textos.ts` |
| Qué presta la palapa y hasta qué hora hay música | No se dice: falta confirmarlo | — |

## Los dos hoteles

| Dato | Qué dice el sitio | Dónde se cambia |
| --- | --- | --- |
| Anticipo del 50 % (habitaciones y palapa) y que no se devuelve | Viene de los sitios publicados | `src/data/textos.ts` (`FAQ`), `src/pages/politicas.astro` |
| «A 30 minutos de Monterrey» | Es el dato del hotel. Desde la Macroplaza se midieron unos 38 km y 45 minutos; desde el poniente de la ciudad es menos. Las preguntas frecuentes y los artículos usan el dato medido | `src/data/hoteles.ts`, `src/data/textos.ts` |
| Distancia a las Grutas | 15 minutos y unos 9 km | `src/data/hoteles.ts` |
| Autor de los artículos | «Equipo del hotel», sin nombre de persona | `src/data/blog.ts` (`AUTOR`) |
| Aviso de privacidad, políticas y términos | Texto de trabajo completo; falta la razón social del hotel | `src/pages/aviso-de-privacidad.astro`, `politicas.astro`, `terminos.astro` |
| Fechas de la barra de reservas | El próximo fin de semana | `src/components/Reserva.astro` |
| Fecha de publicación de los videos | 15 y 20 de octubre de 2026, aproximadas | `src/data/hoteles.ts` (`videos`, `fecha`) |

## Ya no son datos de muestra

- Horarios y precios de las Grutas de García y de Xenpal: los artículos traen los verificados, con la fecha de verificación y la fuente (campos `verificado` y `fuentes` de cada artículo).
- Lugares del mapa: 17, todos confirmados con su fuente (`src/data/lugares.json`). Los que no se pudieron confirmar se quitaron.
- Precios de la doble ($1,200) y del departamento ($2,000) de Los Arcos: son los que publican las redes del hotel.
- Los artículos de «Planes cerca» que eran de muestra se sustituyeron por los del blog (`src/content/blog/`).
