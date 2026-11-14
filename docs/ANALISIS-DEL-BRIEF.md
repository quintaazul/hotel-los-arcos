# Análisis del documento «Rediseño web de Quinta Azul y Los Arcos Inn»

Documento del 10 de noviembre de 2026 (8,400 palabras). Aquí se compara contra el prototipo que ya existe en este proyecto: qué cumple, qué choca, qué falta y qué datos no coinciden.

## Qué trae

Son tres partes:

1. **Brief de diseño.** Cómo es cada hotel, seis hoteles de referencia, la estructura (10 páginas en Quinta Azul, 12 en Los Arcos), qué lleva cada página y en qué orden, unos 20 componentes, las reglas, la lista de fotos y el orden de entrega.
2. **Plan SEO.** Dónde se compite, qué palabras clave son de cada hotel, el título, la descripción y el H1 de cada página, los enlaces internos y el calendario del blog hasta febrero de 2027.
3. **Diagnóstico de los sitios publicados.** Qué está bien y 14 problemas por corregir.

El brief está escrito para un diseñador que entregaría en Figma. Aquí el diseño se hace directo en código, así que el prototipo ya cubre parte de los entregables (sistema, componentes y estados).

## Lo que el prototipo ya cumple

- **Un sistema, dos temas.** Mismos componentes y medidas; cada hotel con su paleta. Hay un estándar escrito por hotel.
- **Contraste.** El blanco sobre el naranja de Los Arcos (2.99) quedó resuelto: los botones usan un terracota más oscuro y un comando comprueba 23 parejas de color por hotel.
- **Tipografía.** Dos familias y tres pesos, servidas desde el propio sitio.
- **Velocidad.** Solo la foto de portada carga de inmediato; nada salta al cargar (medido: 0) y el inicio pinta en 0.3 s en local.
- **Sin video de fondo en la portada.** Los videos no se descargan hasta tocar Reproducir.
- **Texto en HTML.** Títulos, precios y botones son texto. Un solo H1 por página (lo comprueba la revisión automática).
- **Mapa.** Imagen fija con botón a Google Maps.
- **Galería con visor.** Se abre, se cierra y se pasa con teclado y con el dedo.
- **Reducir movimiento.** Las animaciones se apagan si la persona lo pide.
- **Botones de 44 px o más** y foco visible.
- **WhatsApp como botón principal**, con mensaje distinto según de dónde se toca.
- **Fotos reales.** Nada de bancos de imágenes.

## Lo que choca con lo que pediste

Estas son decisiones tuyas; no cambié nada por mi cuenta.

1. **Animaciones (resuelto el 9 de noviembre).** El brief pide «sin librerías pesadas de animación» y tú pediste muchas animaciones. Ya no chocan: se quitaron las dos librerías (GSAP y el scroll con inercia) y las mismas animaciones las hace ahora el navegador con CSS. El JavaScript del sitio bajó de 64 KB a 12.5 KB comprimidos.
2. **Blog.** El brief lo quiere en `/blog`, con una página por tema (enlaces reales, sin filtros de JavaScript), paginación, autor con foto y puesto, y la caja «Hospédate cerca». El prototipo tiene la serie «Planes cerca» en `/planes`, con filtros de JavaScript y sin páginas por tema.
3. **Tira de Instagram.** Son imágenes con texto dentro, que el brief prohíbe para contenido. Aquí funcionan como enlace al perfil y llevan texto alternativo, pero si se quiere seguir el brief al pie de la letra, se quita.
4. **Toma de ambiente de la alberca (Los Arcos).** Corre sola y sin sonido en la sección de videos, no en la portada. Respeta el ahorro de datos y trae pausa. Si se prefiere, se deja con botón de Reproducir como las demás.
5. **Formulario.** El brief conserva el formulario actual con la verificación de Cloudflare y sus estados (enviando, enviado). El del prototipo abre WhatsApp con el mensaje armado.

## Lo que falta construir

**Páginas nuevas**

- Departamentos y Empresas (solo Los Arcos).
- Preguntas frecuentes, con 15 a 25 preguntas en grupos y un índice arriba. Hoy hay 10 preguntas en una sección.
- Políticas y Términos. El aviso de privacidad existe con texto de muestra.
- Blog: página principal, página por tema y artículo con las piezas que pide el brief.

**Componentes que no existen todavía**

- Bloque de palapa en versión grande y compacta, repetido en Inicio, Habitaciones, Departamentos, Empresas y Ubicación. Hoy solo está en Inicio y Celebraciones.
- Tabla de tarifas por noche, semana y mes.
- «Qué hay cerca» con kilómetros, minutos y enlace a cada guía.
- Tarjeta de artículo en tres tamaños, autor con fechas y caja «Hospédate cerca».
- «Por qué reservar directo» (3 razones) en el inicio.
- Plantilla de imagen para redes de 1200 × 630 por página. Hoy cada página usa una foto.

**Ajustes en lo que ya hay**

- La portada del inicio debe decir «desde $900» y dejar ver la alberca y la palapa. Hoy muestra la calificación y el botón, pero no el precio.
- El menú debe llevar Inicio, Habitaciones, Departamentos (Los Arcos), Celebraciones, Ubicación, Blog y Contacto.
- Títulos, descripciones y H1 del plan SEO: el del inicio de Quinta Azul ya coincide; los demás hay que cargarlos.
- Enlaces con texto que describa el destino («Ver habitaciones desde $900»).
- Vocabulario propio: «palapa para fiestas» en Quinta Azul y «palapa techada» en Los Arcos. Hoy los dos dicen «palapa para 60» con casi el mismo texto.
- Regla de palabras clave: cada una tiene un solo dueño. Hay que revisar los textos contra esa tabla. Por ejemplo, «carne asada» es de Quinta Azul y el prototipo de Los Arcos la menciona en su palapa.
- Orden de secciones del inicio según el brief.
- Formulario de Los Arcos: Sencilla, Triple y Departamento; el motivo «Fiesta en la palapa» o «Reunión en la palapa».

## Datos que no coinciden

Tres fuentes dicen cosas distintas: el brief, las publicaciones de redes y el prototipo. Hay que confirmarlos con los hoteles.

| Dato | Brief | Redes | Prototipo |
| --- | --- | --- | --- |
| Tipos de habitación en Los Arcos | Sencilla y triple, más departamentos | Sencilla, doble, triple y departamento | Los cuatro |
| Capacidad del departamento | De 4 a 8 personas | Para 4 personas | Hasta 6 |
| Precio del departamento | No lo dice | $2,000 | $2,000 (lo igualé a redes; antes $2,400 inventado) |
| Precio de la doble de Los Arcos | No existe | $1,200 | $1,200 (igualado a redes) |
| Camas de la triple de Los Arcos | No lo dice | 3 camas queen | 1 queen y 1 individual (inventado) |
| Quinta Azul a Monterrey | 20 minutos | 30 minutos | 30 minutos |
| Grutas desde los hoteles | Pendiente: 12 km o 9 km | 9 km, unos 15 min | 15 minutos |
| Unidades de Los Arcos | Pendiente: 8 o 9 | No lo dicen | 8 |
| Horario de atención | 7 a 23 h | 7 AM a 11 PM | 7:00 a 23:00 (coinciden los tres) |
| Reseñas | 4.9 con 73 y 4.5 con 105 | 4.9 | Igual que el brief |

## Fotos

El brief dice que las fotos actuales son provisionales y pide una sesión por hotel. El banco que llegó confirma el diagnóstico: cubre bien las habitaciones de Quinta Azul y los departamentos de Los Arcos, pero no trae palapa, fachada ni alberca en alta, ni las habitaciones sencilla y triple de Los Arcos. La comparación toma por toma está en `MATERIAL-AUDIOVISUAL.md`.

## Orden que propongo

1. Decidir los cuatro puntos que siguen abiertos de «Lo que choca» (blog, Instagram, toma de ambiente y formulario).
2. Cargar títulos, descripciones, H1 y vocabulario del plan SEO, y la portada con «desde $900».
3. Bloque de palapa y su repetición en las páginas.
4. Preguntas frecuentes y legales.
5. Departamentos y Empresas (Los Arcos).
6. Blog en `/blog` con temas, y pasar los artículos de «Planes cerca».
7. Fotos nuevas cuando haya sesión.

El calendario del blog marca como urgente la guía de posada navideña de Quinta Azul, para noviembre.
