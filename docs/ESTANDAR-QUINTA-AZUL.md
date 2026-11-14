# Estándar visual · Hotel Quinta Azul

Este documento es el estándar de **Hotel Quinta Azul**. El otro hotel tiene el suyo: comparten las medidas y los controles, pero cada uno tiene su color y su carácter, y pueden cambiar por separado.

- **Se ve en vivo:** página `/estandar` del sitio (no aparece en buscadores).
- **Se genera solo:** `node scripts/estandar.mjs`. No se edita a mano.
- **Dónde vive cada cosa:**
  - Color de este hotel: `src/styles/marca-qa.css`, generado por `scripts/paleta.mjs`.
  - Medidas, letra y movimiento: `src/styles/sistema.css` y `src/scripts/ritmo.ts`.
  - Controles: `src/styles/controles.css`, `src/scripts/controles.ts` y `src/components/controles/`.

## 0. Identidad

- **Carácter:** Fresco, claro y tranquilo. Azul de fachada sobre arena cálida, con el turquesa de la alberca como respiro.
- **Voz:** Cercana y directa, de tú. Frases cortas, datos concretos (precio, hora, minutos).
- **Motivos que se repiten:**
  - Frase en serif dentro de un óvalo dibujado a mano
  - El arco como marco de foto
  - Fotos reales del hotel, sin filtros fuertes
- **Letra:** Poppins para títulos y texto; DM Serif Display para la frase del óvalo, cifras y nombres.

## 1. Controles

Regla: nada usa el menú, el calendario ni los avisos del navegador. Todos los controles son propios y se ven igual en cualquier navegador. En celular, lo que flota sube como una hoja desde abajo.

| Pieza | Componente | Cómo se comporta |
| --- | --- | --- |
| Campo de texto | Campo.astro | Etiqueta arriba, caja de 56 px, ayuda y error debajo. El error es nuestro, no el globo del navegador. |
| Área de texto | Campo.astro (area) | Crece con lo que se escribe. Mínimo 128 px. |
| Desplegable | Desplegable.astro | Botón que abre una lista propia. Flechas, Inicio, Fin, letras y Enter. En celular sube como hoja. |
| Fecha | Fecha.astro | Calendario propio de un mes. La salida no puede quedar antes de la llegada. |
| Rango de fechas | Reserva.astro | Dos meses en computadora, uno en celular. Marca llegada, salida y las noches de en medio. |
| Número | Contador.astro | Botones − y +. Respeta mínimo y máximo. |
| Una entre pocas | Opciones.astro | Pastillas. La elegida toma el color de acción. |
| Casilla | Casilla.astro | Cuadro de 24 px dibujado por nosotros. |
| Botón | .boton | Píldora de 52 px. Variantes: principal, blanco, contorno y chico. |

**Estados de un campo**

| Estado | Cómo se ve |
| --- | --- |
| Normal | Borde suave |
| Hover | Borde más oscuro (solo con ratón) |
| Foco | Borde del color de foco y aro de 3 px |
| Lleno | Texto en color principal |
| Vacío | Texto de ejemplo en gris |
| Error | Borde rojo y mensaje debajo |
| Apagado | Fondo gris, sin interacción |

**Medidas**

| Variable | Valor | Uso |
| --- | --- | --- |
| `--ctrl-s` | 2.5rem | Botones chicos y redondos |
| `--ctrl-m` | 3rem | Controles en celular |
| `--ctrl-l` | 3.5rem | Campos y botones principales |
| `--toque` | 2.75rem | Mínimo para tocar con el dedo |

**Accesibilidad**

- Todo se puede usar con teclado: Tab, flechas, Enter, Esc.
- El foco siempre se ve y vuelve al botón que abrió la ventana.
- Cada campo tiene su etiqueta visible; el error se anuncia al lector de pantalla.
- Debajo del desplegable hay un `<select>` real: si el JavaScript no carga, el formulario sigue funcionando.

## 2. Color

La paleta tiene dos capas. Los componentes solo usan la segunda.

1. **Colores:** 8 familias de 11 tonos (del 50, el más claro, al 950, el más oscuro). Están hechas en OKLCH: un mismo número pesa igual en todas las familias.
2. **Papeles:** nombres por función (`--c-fondo`, `--c-texto`, `--c-accion`…). Si mañana cambia el color de marca, se cambia el papel y todo el sitio lo sigue.

### 2.1 Familias

**azul** · Primario. El azul de la fachada y del logo. Acciones, enlaces y secciones de marca.

| 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `#F4F7FF` | `#E6ECFF` | `#CFDCFF` | `#AEC2FF` | `#8AA3F5` | `#6B84DD` | `#5167BD` | `#3B4E9C` | `#2B3A7C` | `#1D295A` | `#10183B` |

**agua** · Secundario. El turquesa de la alberca. Detalles frescos e ilustraciones.

| 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `#ECFAFE` | `#D8F2FA` | `#B6E6F4` | `#86D1E7` | `#4EB7D3` | `#009BB8` | `#007C94` | `#006175` | `#004959` | `#003440` | `#002028` |

**sol** · Acento. Dorado de atardecer. Estrellas y realces pequeños, nunca fondos grandes.

| 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `#FFF5E7` | `#FCEACF` | `#F7D7A7` | `#EBBB70` | `#D79B2A` | `#B67F00` | `#926500` | `#734F00` | `#573B00` | `#3F2900` | `#281800` |

**arena** · Neutros. De arena cálida (fondos) a tinta azul noche (textos).

| 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `#F8F5F0` | `#EFEBE2` | `#E1DCD1` | `#CCC7BC` | `#AAA39D` | `#867E7E` | `#686067` | `#4A4755` | `#333243` | `#212133` | `#151527` |

**exito** · Estado: correcto. Confirmaciones.

| 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `#EEFBF0` | `#DCF4E1` | `#BEE9C8` | `#93D7A5` | `#64BE80` | `#38A25E` | `#078543` | `#006933` | `#004F25` | `#003818` | `#00230D` |

**aviso** · Estado: atención. Avisos que no bloquean.

| 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `#FFF5E9` | `#FEE9D1` | `#F9D6AB` | `#EEB976` | `#DB9838` | `#BC7B00` | `#976200` | `#774C00` | `#5B3900` | `#412800` | `#291700` |

**error** · Estado: error. Campos mal llenados y fallas.

| 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `#FFF4F2` | `#FFE6E3` | `#FFCFC9` | `#FFABA1` | `#FF796D` | `#E74F46` | `#C52C2A` | `#A30D14` | `#7F0009` | `#5D0005` | `#3C0002` |

**info** · Estado: información. Notas neutras.

| 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `#F0F8FF` | `#DEEFFF` | `#BFE1FF` | `#96CAF7` | `#6AAFE7` | `#4391CE` | `#2274AF` | `#045B91` | `#00446F` | `#003051` | `#001D34` |

### 2.2 Papeles

| Papel | Viene de | Color |
| --- | --- | --- |
| `--c-fondo` | arena-50 | `#F8F5F0` |
| `--c-fondo-2` | arena-100 | `#EFEBE2` |
| `--c-fondo-3` | arena-200 | `#E1DCD1` |
| `--c-superficie` | #FFFFFF | `#FFFFFF` |
| `--c-fondo-oscuro` | arena-950 | `#151527` |
| `--c-fondo-oscuro-2` | arena-900 | `#212133` |
| `--c-texto` | arena-950 | `#151527` |
| `--c-texto-2` | arena-700 | `#4A4755` |
| `--c-texto-3` | arena-600 | `#686067` |
| `--c-texto-apagado` | arena-500 | `#867E7E` |
| `--c-borde` | arena-200 | `#E1DCD1` |
| `--c-borde-fuerte` | arena-300 | `#CCC7BC` |
| `--c-borde-control` | arena-500 | `#867E7E` |
| `--c-blanco` | #FFFFFF | `#FFFFFF` |
| `--c-sobre-accion` | #FFFFFF | `#FFFFFF` |
| `--c-sobre-oscuro` | arena-50 | `#F8F5F0` |
| `--c-sobre-oscuro-2` | arena-300 | `#CCC7BC` |
| `--c-marca` | azul-700 | `#3B4E9C` |
| `--c-accion` | azul-700 | `#3B4E9C` |
| `--c-accion-hover` | azul-800 | `#2B3A7C` |
| `--c-accion-activa` | azul-900 | `#1D295A` |
| `--c-texto-marca` | azul-700 | `#3B4E9C` |
| `--c-marca-hondo` | azul-900 | `#1D295A` |
| `--c-marca-suave` | azul-100 | `#E6ECFF` |
| `--c-marca-suave-2` | azul-200 | `#CFDCFF` |
| `--c-foco` | azul-600 | `#5167BD` |
| `--c-secundario` | agua-600 | `#007C94` |
| `--c-secundario-suave` | agua-100 | `#D8F2FA` |
| `--c-acento` | sol-500 | `#B67F00` |
| `--c-estrella` | sol-400 | `#D79B2A` |
| `--c-exito` | exito-600 | `#078543` |
| `--c-exito-texto` | exito-700 | `#006933` |
| `--c-exito-fondo` | exito-50 | `#EEFBF0` |
| `--c-exito-borde` | exito-300 | `#93D7A5` |
| `--c-aviso` | aviso-600 | `#976200` |
| `--c-aviso-texto` | aviso-700 | `#774C00` |
| `--c-aviso-fondo` | aviso-50 | `#FFF5E9` |
| `--c-aviso-borde` | aviso-300 | `#EEB976` |
| `--c-error` | error-600 | `#C52C2A` |
| `--c-error-texto` | error-700 | `#A30D14` |
| `--c-error-fondo` | error-50 | `#FFF4F2` |
| `--c-error-borde` | error-300 | `#FFABA1` |
| `--c-info` | info-600 | `#2274AF` |
| `--c-info-texto` | info-700 | `#045B91` |
| `--c-info-fondo` | info-50 | `#F0F8FF` |
| `--c-info-borde` | info-300 | `#96CAF7` |

### 2.3 Parejas comprobadas

Contraste según WCAG. Texto normal pide 4.5; piezas grandes y bordes de control, 3.

| Texto | Fondo | Contraste | Mínimo | ¿Pasa? |
| --- | --- | --- | --- | --- |
| texto | fondo | 16.53 : 1 | 4.5 | Sí |
| texto | fondo-2 | 15.11 : 1 | 4.5 | Sí |
| texto | superficie | 17.97 : 1 | 4.5 | Sí |
| texto-2 | fondo | 8.31 : 1 | 4.5 | Sí |
| texto-2 | fondo-2 | 7.6 : 1 | 4.5 | Sí |
| texto-2 | superficie | 9.04 : 1 | 4.5 | Sí |
| texto-3 | superficie | 6.07 : 1 | 4.5 | Sí |
| texto-3 | fondo | 5.58 : 1 | 4.5 | Sí |
| texto-marca | fondo | 7.01 : 1 | 4.5 | Sí |
| texto-marca | superficie | 7.62 : 1 | 4.5 | Sí |
| texto-marca | marca-suave | 6.46 : 1 | 4.5 | Sí |
| sobre-accion | accion | 7.62 : 1 | 4.5 | Sí |
| sobre-accion | accion-hover | 10.51 : 1 | 4.5 | Sí |
| blanco | marca-hondo | 13.84 : 1 | 4.5 | Sí |
| blanco | fondo-oscuro | 17.97 : 1 | 4.5 | Sí |
| borde-control | superficie | 3.96 : 1 | 3 | Sí |
| foco | fondo | 4.8 : 1 | 3 | Sí |
| foco | superficie | 5.22 : 1 | 3 | Sí |
| exito-texto | exito-fondo | 6.42 : 1 | 4.5 | Sí |
| aviso-texto | aviso-fondo | 6.92 : 1 | 4.5 | Sí |
| error-texto | error-fondo | 7.42 : 1 | 4.5 | Sí |
| info-texto | info-fondo | 6.73 : 1 | 4.5 | Sí |
| error-texto | superficie | 8 : 1 | 4.5 | Sí |

### 2.4 Cómo se reparte

- **60 % neutros:** fondos `arena` claros y texto `arena` oscuro.
- **30 % marca:** `azul` en secciones de marca, botones y enlaces.
- **10 % acento:** `sol` solo en estrellas y realces chicos; `agua` para detalles.
- Rojo, ámbar y verde se reservan para estados (error, aviso, correcto).
- Sobre foto, el texto va en blanco con una sombra del color `--c-noche`.

## 3. Movimiento

- Solo se animan posición, tamaño, opacidad y recorte. Nunca ancho, alto ni márgenes.
- No hay librerías de animación ni scroll con inercia: el scroll es el del navegador y responde al instante.
- Lo que aparece al bajar lo anima el navegador con CSS (`movimiento.css`); el código solo marca con «visto» lo que entra a la pantalla.
- El contenido nunca espera un aviso del navegador para aparecer. Nada visible depende de `IntersectionObserver`, `requestAnimationFrame` ni `ResizeObserver` (se retrasan o se detienen con el equipo ocupado o con extensiones pesadas): se mide la posición real de cada pieza con el scroll, con un reloj cada 250 ms y al cargar.
- El código de movimiento va escrito dentro de cada página, no en un archivo aparte: ninguna descarga lo puede retrasar ni bloquear.
- Al bajar casi no se escribe nada en la página: solo clases, una vez por pieza. Hay extensiones de navegador que vigilan cada cambio de la página y se saturan si se escriben estilos en cada cuadro.
- Lo que va atado al scroll (paralaje, portada, mapa, galería) lo mueve el navegador desde el CSS, sin código por cuadro. Donde el navegador no lo soporta, esas piezas quedan quietas.
- Lo que aparece sube 28 px y entra en 600 ms; las piezas hermanas entran con 60 ms de diferencia.
- La portada queda quieta en menos de 1 segundo. Al llegar desde otra página del sitio, en la mitad.
- Ninguna sección retiene el scroll. El arco es un marco fijo: su foto se descubre al entrar y se mueve un poco más lento que la página; debajo va el resumen «De un vistazo». (La versión que crecía hasta llenar la pantalla se probó y se retiró el 10 de noviembre de 2026.)
- Mientras espera su turno, una pieza se oculta con opacidad, nunca con recorte: una pieza recortada del todo no cuenta como visible y nunca entraría.
- Al presionar, los botones se achican a 97 %. El hover solo existe con ratón.
- Con «reducir movimiento» activado no se anima nada y la página se ve completa. Si el código de movimiento falla o no da señal, medio segundo después de cargar todo se muestra de una vez, sin animación: el contenido va primero.
- Efectos del catálogo motion-prompt (`efectos.css`, con su número de catálogo): puntos sobre la foto de la palapa en Celebraciones (163), la línea que une los pasos de «Cómo llegar» y se dibuja al bajar (145), la vista previa del índice de planes que viaja y se convierte en la foto de la guía (161) y la barra de avance de lectura en las guías (079).
- Un efecto no puede costar carga: lo que necesita otra foto no la pide hasta que hace falta.
- Lo que responde al ratón responde también al dedo y al teclado: los puntos de la palapa se abren al tocarlos o con Tab y se cierran con Esc, y su texto está siempre en la página para buscadores y lectores de pantalla.
- Probado y descartado: letras con una foto adentro (catálogo, n.º 133) en el nombre gigante del pie. No gustó; el nombre del pie va liso.

**Tiempos**

| Variable | Valor | Uso |
| --- | --- | --- |
| `--d-instante` | 100ms | Respuesta al presionar |
| `--d-rapido` | 160ms | Hover y cambios de color |
| `--d-ui` | 240ms | Menús, ventanas flotantes, estados |
| `--d-medio` | 360ms | Cabecera, velos, fundidos |
| `--d-lento` | 520ms | Hojas, cajones, menú a pantalla completa |
| `--d-entrada` | 600ms | Contenido que aparece al bajar |
| `--d-escena` | 800ms | Títulos, óvalos y cortinas entre fotos |
| `--d-revela` | 1000ms | Fotos que se descubren con cortina |
| `--d-ambiente` | 1300ms | Foto que se asienta, cifras que cuentan |

**Curvas**

| Variable | Valor | Uso |
| --- | --- | --- |
| `--curva-salida` | `cubic-bezier(.22,1,.36,1)` | Lo que entra o responde: arranca rápido y frena suave |
| `--curva-expo` | `cubic-bezier(.16,1,.3,1)` | Entradas grandes: títulos y máscaras |
| `--curva-vaiven` | `cubic-bezier(.76,0,.24,1)` | Lo que va de un lugar a otro |
| `--curva-suave` | `cubic-bezier(.33,1,.68,1)` | Fotos que se asientan |
| `--curva-cajon` | `cubic-bezier(.32,.72,0,1)` | Hojas y cajones |
| `--curva-entrada` | `cubic-bezier(.55,.055,.675,.19)` | Lo que se va |

**Distancias y ritmo**

| Variable | Valor | Uso |
| --- | --- | --- |
| `--mov-s` | .5rem | Ventanas flotantes |
| `--mov-m` | 1.125rem | Carga de la portada |
| `--mov-l` | 1.75rem | Contenido que aparece al bajar |
| `--paso` | 60ms | Retraso entre piezas hermanas |

Las animaciones viven en `src/styles/movimiento.css`. El poco código que necesita esperar a que terminen toma los mismos tiempos de `src/scripts/ritmo.ts` (`D` duraciones, `MOV` distancias, `PASO`).

## 4. Espacios, tamaños y letra

### 4.1 Escala de espacios

Base de 4 px. El número de la variable es «cuántos cuartos de 16»: `--e-4` son 16 px.

| Variable | Valor | Uso típico |
| --- | --- | --- |
| `--e-05` | 2px | Ajustes ópticos mínimos |
| `--e-1` | .25rem | Entre etiqueta y valor dentro de un botón |
| `--e-15` | .375rem | Entre ícono chico y texto |
| `--e-2` | .5rem | Entre etiqueta y campo; entre pastillas |
| `--e-25` | .625rem | Relleno vertical de celdas compactas |
| `--e-3` | .75rem | Entre líneas de una tarjeta |
| `--e-35` | .875rem | Relleno vertical de áreas de texto |
| `--e-4` | 1rem | Relleno lateral de un campo |
| `--e-5` | 1.25rem | Relleno de ventanas flotantes; entre columnas de un formulario |
| `--e-6` | 1.5rem | Entre filas de un formulario; relleno de tarjetas |
| `--e-7` | 1.75rem | Entre título y párrafo |
| `--e-8` | 2rem | Entre meses del calendario |
| `--e-10` | 2.5rem | Entre bloques dentro de una sección |
| `--e-12` | 3rem | Separación grande dentro de una sección |
| `--e-14` | 3.5rem | — |
| `--e-16` | 4rem | Aire arriba de portadas cortas |
| `--e-18` | 4.5rem | — |
| `--e-20` | 5rem | Aire bajo el resumen del arco en celular |
| `--e-24` | 6rem | — |
| `--e-32` | 8rem | — |
| `--e-40` | 10rem | — |

### 4.2 Espacios de página

Crecen con la pantalla.

| Variable | Valor | Uso |
| --- | --- | --- |
| `--margen` | `clamp(1.25rem, 3.4vw, 3.5rem)` | Borde lateral de toda la página |
| `--hueco` | `clamp(1rem, 2vw, 2rem)` | Separación entre columnas y entre tarjetas |
| `--seccion` | `clamp(5.5rem, 10vw, 10.5rem)` | Aire arriba y abajo de cada sección |
| `--seccion-s` | `clamp(3.5rem, 6vw, 6rem)` | Sección compacta, o segunda parte de una misma sección |
| `--bloque` | `clamp(2.5rem, 5vw, 5rem)` | Del título de la sección a su contenido |
| `--pila-s` | `.75rem` | Piezas apiladas, juntas |
| `--pila-m` | `1.5rem` | Piezas apiladas, normal |
| `--pila-l` | `2.5rem` | Piezas apiladas, separadas |

Rejilla de 12 columnas, ancho máximo de 105rem y párrafos de 60ch como máximo.

### 4.3 Letra

| Variable | Tamaño | Uso |
| --- | --- | --- |
| `--t-display` | `clamp(2.75rem, .55rem + 6.1vw, 6.5rem)` | Título de la portada |
| `--t-h1` | `clamp(2.125rem, 1.15rem + 3.5vw, 4.5rem)` | Título de sección |
| `--t-h2` | `clamp(1.375rem, 1rem + 1.5vw, 2.25rem)` | Frase destacada, fila del blog |
| `--t-h3` | `clamp(1.375rem, 1.2rem + .7vw, 1.75rem)` | Subtítulo |
| `--t-h4` | `1.25rem` | Título de tarjeta |
| `--t-cuerpo-l` | `clamp(1.0625rem, 1rem + .3vw, 1.25rem)` | Entradilla |
| `--t-cuerpo` | `clamp(1rem, .96rem + .18vw, 1.125rem)` | Párrafo |
| `--t-base` | `1rem` | Campos y botones |
| `--t-ui` | `.9375rem` | Menú, tablas, botones chicos |
| `--t-chico` | `.875rem` | Texto secundario |
| `--t-nota` | `.8125rem` | Etiqueta de campo, pie de foto |
| `--t-micro` | `.75rem` | Etiqueta mínima, créditos |

- Pesos: 400 normal, 500 medio, 600 fuerte.
- Interlineado: 1.02 títulos grandes, 1.15 títulos, 1.3 controles, 1.6 párrafos.

### 4.4 Formas, sombras y capas

| Variable | Valor | Uso |
| --- | --- | --- |
| `--r-media` | `.5rem` | Fotos y tarjetas con foto |
| `--r-control` | `.75rem` | Campos, botones cuadrados, celdas |
| `--r-tarjeta` | `1rem` | Tarjetas y paneles |
| `--r-flota` | `1.25rem` | Ventanas flotantes, barra de reservas, hojas |
| `--r-full` | `62.4375rem` | Botones y pastillas |
| `--s-1` | `0 0 0 1px rgb(var(--c-noche) / .06)` | Línea fina alrededor |
| `--s-2` | `0 1px 2px rgb(var(--c-noche) / .06), 0 .5rem 1.5rem -.75rem rgb(var(--c-noche) / .18)` | Tarjeta apenas levantada |
| `--s-3` | `0 0 0 1px rgb(var(--c-noche) / .06), 0 1.125rem 3rem -1.125rem rgb(var(--c-noche) / .30)` | Menú o lista flotante |
| `--s-4` | `0 0 0 1px rgb(var(--c-noche) / .06), 0 1.875rem 5rem -1.5rem rgb(var(--c-noche) / .40)` | Ventana flotante y barra de reservas |

### 4.5 Tamaños de pantalla

| Ancho | Qué cambia |
| --- | --- |
| hasta 760 px | Celular: una columna, ventanas flotantes como hojas desde abajo |
| 761 a 1024 px | Tablet: menú en hoja, habitaciones en tarjetas |
| 1025 a 1920 px | Computadora: rejilla de 12 columnas, escenas fijas con scroll |
| desde 1921 px | Pantalla grande: el contenido se centra en 1760 px |

## 5. Fotos y video

Regla: como los controles, las fotos y los videos se ven y se usan con piezas propias. El material original no vive en el proyecto; `scripts/material.mjs` lo prepara y deja escrito qué archivo salió de cuál.

### 5.1 Fotos

| Tema | Regla |
| --- | --- |
| Origen | Fotos tomadas en el hotel o en el lugar. Nada de bancos de imágenes ni fotos que prometan lo que no hay. |
| Estilo | La referencia son las fotos ajustadas por el diseñador de los posts (carpeta «Imagenes Ajustadas» del banco): las mismas escenas reales del hotel, con luz de atardecer y color ya trabajados, en vertical de 1856 × 2304. Entran sin revelado. Todo el sitio debe verse del mismo mundo que los posts. |
| Acabado común | Ninguna foto entra al sitio sin acabado. `scripts/acabado.mjs` guarda las recetas y la lista ACABADO de `scripts/material.mjs` dice cuál lleva cada foto. Interiores: todos al mismo blanco cálido (rojo/verde 1.06 y azul/verde 0.945 en Quinta Azul; 1.055 y 0.955 en Los Arcos); solo entibia, nunca enfría una foto de lámpara o de tarde. Exteriores de día sin acabado: van al día del diseñador (cielo azul hondo, color vivo, sombras con cuerpo). No cambia la escena: solo temperatura, exposición, contraste, viveza y el azul del cielo. |
| Una sola luz | El hotel se muestra con una sola luz: la de tarde (sol bajo, cielo de atardecer), que es la firma de los posts. Las fotos de día del propio hotel se reiluminaron con IA en la tercera ronda (`scripts/ronda3-retoque.mjs`); la hora del día no se cambia con un ajuste de color. Solo los lugares que se visitan de día (la sierra, Xenpal) se quedan con luz de día de cielo azul. Una foto nueva del hotel a mediodía no entra tal cual: o se reilumina o no se usa junto a las demás. |
| Auditoría | Después de cambiar fotos, `scripts/auditar-imagenes.mjs` entra a todas las páginas y lista cada imagen que se ve con su origen, y `scripts/hoja-auditoria.mjs` las junta para mirarlas a ojo. No debe quedar ninguna «sitio viejo» ni «banco (sin acabado)». `scripts/portadas.mjs` muestra la primera pantalla de todas las páginas: una foto con más píxeles no gana si su encuadre es peor (la portada de Los Arcos se quedó con el recorte del diseñador por eso). |
| Retoque con IA | Las fotos reales con luz plana se llevan al acabado del diseñador fuera del proyecto: `scripts/paquete-retoque.mjs` arma una carpeta por foto con la foto, la captura del lugar de la página donde va, sus referencias y la instrucción. Lo que regresa se compara con su original (`recibir-retoque.mjs`, `revision-retoque.mjs`) antes de entrar. Regla: que el huésped encuentre lo que vio; se vale luz, limpieza y utilería, no cambiar el lugar. Hubo tres rondas el 10 de noviembre de 2026 (retocar, ampliar con detalle real y pasar a luz de tarde); `scripts/material.mjs retocadas` las integra todas en orden. |
| Ampliación | Un archivo más grande no es una foto con más detalle. Toda foto ampliada se mide contra su original estirada de la forma normal (`scripts/medir-retoque.mjs`): si su nitidez no pasa de 1.25 veces, solo se estiró y no se usa. Pedirle a la IA «no cambies nada» da justo eso; hay que pedirle que reconstruya el detalle. Real-ESRGAN sobre fotos de WhatsApp se probó y se descartó: deja parches «pintados» en pasto y follaje. |
| Cabeceras | La portada de una página interior ocupa toda la pantalla. Cada foto de portada tiene su recorte ancho con el mismo nombre más «-cabecera»; las pantallas apaisadas reciben ese y los celulares la foto completa. |
| Fotos verticales | Una foto vertical en un espacio horizontal desperdicia más de la mitad de sus píxeles. La portada lleva además un recorte horizontal de la misma foto (`ancha`) para pantallas apaisadas; celulares y tablets de pie reciben la vertical. |
| Original | Se guarda en JPG con el nombre de lo que muestra y del hotel: hasta 2400 px por su lado largo las del banco, hasta 3200 las retocadas y 3840 la portada del inicio. Lo prepara `scripts/material.mjs` (con `--solo=texto` rehace una sola). |
| Revelado | Un ajuste corto y parejo de luz, color y contraste (lista REVELADO del script). Mejora la luz sin cambiar el lugar. |
| Tamaños | El sitio saca de cada original versiones de 480, 800, 1200, 1600 y 2000 px en AVIF y WebP; las portadas llegan además a 2560. El navegador pide la que le toca. |
| Carga | Solo la foto de portada carga de inmediato. Las demás se piden al acercarse. |
| Espacio reservado | Cada foto ocupa su lugar antes de cargar: proporción fija en tarjetas (4:3, 4:5, 9:16) y la forma original en el mosaico. |
| Texto alternativo | Dice qué se ve y de qué hotel es. Una foto de adorno lleva texto vacío. |
| Gente | Fotos y videos con personas, solo con su permiso por escrito. |

### 5.2 Video

| Tema | Regla |
| --- | --- |
| Formato | MP4 (H.264) con el arranque al inicio del archivo, para que empiece sin bajarlo completo. |
| Tamaño | Vertical 720 × 1280 con tope de 1.6 Mbps; horizontal 1280 de ancho con tope de 2 Mbps. Un minuto pesa unos 12 MB; nunca más de 25 MB por archivo. |
| Carga | El video no se pide hasta que la persona toca Reproducir. Antes solo se ve su portada, que es una foto. |
| Portada del sitio | Sin video de fondo. La portada es una foto. |
| Toma de ambiente | Clip corto, sin sonido, que corre solo cuando se ve en pantalla. Se detiene al salir, respeta «reducir movimiento» y el ahorro de datos, y siempre trae botón de pausa. |
| Uno a la vez | Al reproducir un video se pausan los demás. Un video que sale de la pantalla se detiene. |
| Buscadores | En la página donde el video es el contenido principal se publican sus datos (título, duración, portada y fecha). |

### 5.3 Piezas

| Pieza | Archivo | Qué hace |
| --- | --- | --- |
| Foto | `Foto.astro` | Foto con sus tamaños y formatos. Es la base de todas las demás. |
| Foto que se amplía | `FotoVisor.astro` | Al tocarla se abre en el visor junto con las de su grupo. Muestra una lupa al pasar el ratón. |
| Galería | `Galeria.astro` | Mosaico de 3 columnas (2 en tablet y celular). Cada foto conserva su forma. |
| Visor | `Base.astro + medios.ts` | Pantalla completa sobre fondo oscuro. Flechas, teclado (← → y Esc), deslizar con el dedo, contador y pie de foto. |
| Video | `Video.astro` | Reproductor propio: botón grande para empezar; al correr, avance que se arrastra, pausa, tiempo, volumen (deslizador al acercar el ratón; en celular, silenciar) y pantalla completa. Los controles se esconden a los 3 segundos. |
| Sección de videos | `EnVideo.astro` | Fila sobre fondo oscuro. El alto se calcula para que quepan todos, cada uno con su forma; en celular se desliza. |
| Tira de Instagram | `Instagram.astro` | Seis publicaciones reales en 4:5 que llevan al perfil. Son la única imagen con texto dentro que se permite. |
| Logo y favicon | `scripts/logos.mjs` | Los Arcos Inn lleva los tres arcos con «Los Arcos Inn», sin la palabra «Hotel» (desde el 10 de noviembre de 2026). El favicon de cada hotel es solo el símbolo, en blanco sobre el color de la marca. |

## 6. Pantallas de prueba

Todo cambio de diseño o de rendimiento se prueba en estas ocho. La lista vive en `scripts/pantallas.mjs` y la usan todas las herramientas.

| Pantalla | Tamaño | Qué cambia |
| --- | --- | --- |
| 4K | 3840 × 2160 | Todo crece 50 %: las medidas van en rem y la letra base sube con el ancho |
| 2K | 2560 × 1440 | Todo crece 10 % |
| 1080p | 1920 × 1080 | Tamaño de referencia del diseño de escritorio |
| 720p | 1280 × 720 | La portada se compacta para que la barra de reservas quepa |
| Tablet grande | 1024 × 1366 | Una columna con fotos grandes; menú en hoja |
| Tablet chica | 768 × 1024 | Igual que la grande, más apretada |
| Celular grande | 430 × 932 | Una columna; ventanas flotantes como hojas desde abajo |
| Celular chico | 360 × 640 | El tamaño más chico que se cuida |

## 7. Rendimiento

El sitio debe sentirse inmediato, no solo cargar rápido. Estas son las metas y cómo se miden.

### 7.1 Metas

| Qué se mide | Meta | Para qué |
| --- | --- | --- |
| Primera pintura | menos de 0.5 s en local | La página se ve casi al instante |
| Portada quieta | menos de 1.4 s | Las animaciones de entrada ya terminaron |
| Hilo trabado al cargar | menos de 300 ms, también en un celular 4 veces más lento | El teléfono no se congela al abrir |
| Scroll: cuadros perdidos | menos de 3 % en compu y menos de 1 % en táctil | Bajar se siente fluido |
| Scroll: frenado | menos de 200 ms | La página se detiene cuando sueltas la rueda |
| Cambio de página | menos de 0.9 s del clic a la página quieta | Navegar no hace esperar |
| Toques | menos de 100 ms en compu y 200 ms en celular lento | Cada control responde al momento |
| En reposo | menos de 1 % del procesador (hasta 1.5 % donde la cinta animada queda a la vista) | La página no trabaja si nadie la toca: con todo quieto, el código ni siquiera mide |
| JavaScript | menos de 20 KB comprimido | Poco código que bajar y ejecutar |

### 7.2 Herramientas

| Comando | Qué hace |
| --- | --- |
| `node scripts/rendimiento.mjs <url> <nombre>` | Banco completo en las 8 pantallas: carga, scroll, navegación y toques. Con `--comparar antes despues` enseña qué mejoró y qué empeoró. |
| `node scripts/revisar.mjs <url>` | Abre todas las páginas en las 8 pantallas: errores, desbordes, títulos, piezas que no aparecen y óvalos sin dibujar. Con `--motor=firefox` o `--motor=webkit` revisa en Firefox o Safari; con `--sin-avisos` simula un navegador que nunca avisa (el caso extremo). También comprueba que la foto de la cabecera cubra toda su franja al abrir. |
| `node scripts/edge-real.mjs <url>` | Abre el Edge de verdad, con ventana y perfil limpio, baja con la rueda y mide cuánto tarda cada pieza en aparecer. Con `--ext=carpeta` carga una extensión para ver qué le hace al sitio; con `--navegar` entra con clic desde el inicio. |
| `node scripts/motores.mjs <url>  y  hoja-motores.mjs` | Fotos de la misma escena en Chrome/Edge, Firefox y Safari, y una hoja para compararlas lado a lado. |
| `node scripts/pedidos.mjs <url>` | Cuántos archivos pide una página, de qué tipo, cuánto pesan y cuándo; avisa de fotos pedidas más de una vez. |
| `node scripts/recorrido.mjs <url> <carpeta>` | Hoja de fotos de la página completa (o de una sección) en las pantallas que se pidan. |
| `node scripts/foto.mjs <url> <salida> <pantalla>` | Una foto de la pantalla tal como se ve. |
| `node scripts/traza-carga.mjs <url>` | En qué se le va el tiempo al navegador al abrir la página y qué lo obliga a acomodar de nuevo. |
| `node scripts/perfil-scroll.mjs <url> <pantalla>` | Qué código y qué trabajo del navegador pesan mientras se baja. |
| `node scripts/calidad-fotos.mjs qa|la` | Tamaño y nitidez de cada foto del hotel; avisa cuáles se quedan cortas para 2K y 4K. |
| `node scripts/hoja-fotos.mjs  y  hoja-carpeta.mjs` | Hojas de contacto para elegir fotos a ojo: de una lista de fotos o de una carpeta entera del banco. |
| `node scripts/foto-seccion.mjs <url> <selector> <salida>` | Foto de una sección ya quieta, en las pantallas que se pidan, una junto a otra. |
| `node scripts/fotos-en-uso.mjs` | Qué fotos usa de verdad cada sitio, de dónde viene cada una y cuáles no tienen todavía el acabado del diseñador. |
| `node scripts/paquete-retoque.mjs  ·  recibir-retoque.mjs  ·  revision-retoque.mjs` | Ida y vuelta del retoque con IA: arma el paquete por foto, recibe lo devuelto y arma las hojas de antes y después. |
| `node scripts/medir-retoque.mjs` | Dice si cada foto devuelta ganó detalle de verdad o solo se estiró. |
| `node scripts/acabado.mjs medir <fotos>  ·  probar <receta> <entrada> <salida>` | Mide el blanco, la luz, el contraste y el color de una foto para compararla con las del diseñador, y prueba una receta de acabado sobre una foto suelta. |
| `node scripts/auditar-imagenes.mjs <url> qa|la  y  hoja-auditoria.mjs qa|la` | Todas las imágenes que se ven en el sitio, página por página, con su origen y su tamaño; y la hoja para mirarlas juntas. |
| `node scripts/portadas.mjs <url> qa|la [--ancho= --alto=]` | La primera pantalla de todas las páginas en una hoja, al tamaño que se pida. |
| `node scripts/hoja-lista.mjs <salida> <fotos>` | Hoja de miniaturas de cualquier lista de fotos, con rótulo propio por foto. |
| `node scripts/ronda3-retoque.mjs` | Arma la tercera ronda del retoque con IA: fotos de día que deben pasar a luz de tarde y recortes que faltan en alta. |
| `node scripts/probar-efectos.mjs` | Prueba de uso de los efectos en el sitio compilado: los puntos con dedo, ratón, índice y teclado, y que la segunda foto de las habitaciones no se pida en celular. |
| `node scripts/ver-secciones.mjs <url> qa|la [ancho] [alto]` | Foto de cada escena de las páginas interiores en la pantalla que se pida, juntas en una hoja. |
| `node scripts/pantallazos.mjs <url> <salida.jpg> [--ancho=1905 --alto=910]` | La página pantalla por pantalla, como la ve una persona: una captura por cada alto de pantalla, en una hoja. Para juzgar huecos y proporciones. |
| `node scripts/logos.mjs` | Rehace el logo de Los Arcos sin la palabra «Hotel» y los dos favicones (solo el símbolo, en blanco sobre el color de la marca). |
| `node scripts/legibilidad.mjs <url> [url2] [--pantallas=…] [--rutas=planes,contacto] [--todo] [--ajustar]` | Mide el contraste de cada renglón de texto de las portadas y del menú contra la foto que tiene detrás, en los ocho tamaños. Con `--ajustar` busca el sombreado mínimo de cada foto y lo guarda en `src/data/velos.json`. `--rutas` limita a unas páginas (sin la barra inicial: Git Bash la convierte en una ruta de Windows). |
| `node scripts/hover.mjs <url> qa|la` | Cada tipo de botón del sitio en reposo y con el ratón encima, lado a lado, en una hoja. |
| `node scripts/recortes.mjs <salida.png> <ancho> <alto> <margen> <url>::<selector>[::n] …` | Recortes de cerca de piezas concretas (un título, la barra de reservas, una tarjeta) para juzgar el detalle. |
| `node scripts/ovalos.mjs <url> qa|la [--ancho= --alto=]` | Todos los óvalos de los títulos del sitio, de cerca, en una hoja. |
| `node scripts/cabe-portada.mjs <url> [url2]` | Dice si la portada de cada página cabe en una pantalla en los tamaños apaisados, y por cuántos píxeles se pasa. |
| `node scripts/contraste.mjs <url> [--rutas=…]` | Contraste de todo el texto que va sobre fondo liso, en todas las páginas. Para comprobar un cambio de paleta. |
| `node scripts/logo-arcos.mjs [carpeta]` | Arma el logo provisional de Los Arcos con «Hotel» y deja sueltas sus piezas (arcos y nombre) para la cabecera. |
| `node scripts/mapa.mjs [prefijo-de-prueba] [--hotel=qa|la] [--formato=escritorio|celular]` | Dibuja el mapa de cada hotel (plano, claro, con edificios y lugares cercanos) en sus dos formatos, con el hotel en su punto fijo; dice qué lugares cupieron. Necesita internet solo al generarlo. Con un prefijo escribe pruebas sin tocar las imágenes del sitio. |
| `node scripts/paneles.mjs <url> qa|la` | Las fotos de los paneles tal como se ven (pasa el ratón por cada fila de las listas con vista previa), en una hoja. |
| `node scripts/mapa-capturas.mjs <url> <salida.jpg> [--ruta=ubicacion]` | La sección «Cómo llegar» tal como se ve en diez tamaños, en una hoja; dice si la imagen cubre la sección y cuánto de ella se ve. |

### 7.3 Trampas ya resueltas

- Dos piezas con el mismo nombre de clase se pisan: la lista del desplegable se llama `.desp-lista` porque `.lista` ya es la lista sin viñetas.
- El compactador de CSS mete `animation-timeline` dentro del atajo `animation` y lo vuelve inválido: el nombre de la línea de tiempo va en una variable.
- Abrir un `<dialog>` como modal recalcula el estilo de toda la página: el visor se abre sin modal y maneja él mismo el foco y la tecla Esc.
- Crear un formateador de fechas por cada fecha es lento: se crean una vez y se reutilizan.
- Los efectos de desenfoque de fondo se recalculan en cada cuadro del scroll: no se usan en piezas fijas ni en piezas que se repiten.
- Las medidas de alto `svh` no existen en navegadores anteriores a 2022: el compilador deja cada regla con `vh` y, dentro de una consulta, la versión exacta (`astro.config.mjs`).
- `content-visibility:auto` ahorra trabajo al cargar, pero medir una pieza que está dentro obliga al navegador a acomodar toda la sección: no se usa.
- Preparar la página siguiente por adelantado (prerender) carga páginas enteras con solo acercar el ratón: se quitó; queda la descarga anticipada del HTML, que sirve en todos los navegadores.
- El Edge de prueba inicia sesión solo con la cuenta de Windows y baja las extensiones y los datos de la persona: las pruebas lo abren con la sincronización apagada y borran su perfil al terminar.
- Si un componente importa las fotos de los dos hoteles, el compilador junta las que son idénticas y publica una sola con el primer nombre: el sitio de Los Arcos servía fotos llamadas «…-hotel-quinta-azul». Cada sitio importa solo su carpeta (alias `@fotos`).
- Una animación atada a la vista descuenta el margen de anclas de la página (`scroll-padding`, el alto de la cabecera fija) y arranca adelantada en lo que está pegado arriba: las cabeceras interiores abrían con la foto corrida 12 px y dejaban ver una franja del fondo. Toda línea de tiempo lleva `view-timeline-inset:0px`, escrito después del atajo `view-timeline` (el atajo lo devuelve a «auto»).
- La clase `.velo` ya es el fondo oscuro del menú y nace oculta: la portada con sombreado se llama `.sombreada` (llamarla `velo` la dejó invisible entera).
- Una regla de hover con la misma especificidad que la regla de marca que pinta el fondo pierde si va antes en la hoja: el hover de los filtros lleva `:root` delante.

## 8. Reglas que no se rompen

1. Ningún componente escribe un color, tamaño o tiempo suelto: todo sale de las variables.
2. Un solo título principal por página; los demás bajan en orden.
3. Cada sección tiene una sola idea y un solo botón principal.
4. El texto nunca va sobre foto sin una sombra que lo haga legible.
5. Todo lo que se toca mide al menos 44 px.
6. Antes de dar algo por bueno se revisa en las 8 pantallas: 4K, 2K, 1080p, 720p, tablet grande y chica, celular grande y chico.
7. Y en los tres motores de navegador: Chrome/Edge, Firefox y Safari. El sitio se prepara para todo lo publicado desde 2021; lo que un navegador no tenga se deja de usar ahí, pero nunca deja la página rota ni con contenido escondido.
8. El sitio debe verse completo aunque el navegador de la persona tenga extensiones que estorben (bloqueadores, grabadores, traductores). Se prueba en el Edge real con `scripts/edge-real.mjs`.
9. Ninguna foto ni video entra al sitio a mano: pasa por `scripts/material.mjs`, que le da tamaño, revelado y nombre.
10. Las medidas van en rem (1 rem = 16 px en una pantalla normal); solo las líneas finas van en píxeles. Así todo crece en proporción en pantallas muy grandes.
11. Las páginas interiores se arman con escenas, igual que el inicio: nada de cajitas sueltas, tarjetas iguales en fila, tablas sin contexto ni formularios chicos en mucho espacio vacío. Las piezas están en `interiores.css`: mosaico de fotos (Habitaciones), horario de entrada y salida en grande con su fila de reglas, escena partida con foto a sangre y sello, lista con foto que cambia (Celebraciones), formulario en tarjeta con los pasos al lado, distancias en cifras (Ubicación), vías de contacto en grande con el formulario montado sobre la cabecera, y guías destacadas con foto (Planes cerca).
12. Una foto no se repite dentro de la misma página: si ya salió en la cabecera o en la galería, la siguiente sección lleva otra.
13. Antes de dar por buena una página interior se mira completa, de arriba a abajo, junto al inicio (`scripts/recorrido.mjs`) y escena por escena en celular y en computadora (`scripts/ver-secciones.mjs`).
14. Cada página abre con una pantalla completa, como el inicio: foto a sangre, título, botones, una tarjeta con el dato clave y una barra útil abajo (la de reservas en Habitaciones, los datos de la palapa en Celebraciones, las distancias en Ubicación, el formulario dentro de la portada en Contacto, los datos «en corto» en cada guía). Las migas van dentro de la portada. Nunca una franja corta con media pantalla vacía debajo (`PortadaCorta.astro`).
15. La estética se revisa pantalla por pantalla y con el área visible real del navegador, no con la resolución del monitor: una pantalla 1080p deja unos 1905 × 910 px. Cada pantalla debe ser una composición completa: sin huecos y con las piezas en proporción (una foto o un video vertical nunca mide más que la pantalla; su alto se limita con `svh`). Se mira con `scripts/pantallazos.mjs` (una captura por cada alto de pantalla) y `scripts/portadas.mjs` (la primera pantalla de todas las páginas) en laptop, 1080p, 2K, tablet y celular.
16. El texto de toda portada tiene que leerse: 4.5 a 1 de contraste en texto normal y 3 a 1 en titulares (WCAG AA), medido contra la parte más clara de la foto que queda detrás de cada renglón, en los ocho tamaños. Cada foto lleva su propio sombreado, el mínimo que necesita (uno igual para todas apaga las fotos oscuras y no alcanza en las claras): lo busca `node scripts/legibilidad.mjs <urls> --ajustar` sobre el sitio armado y lo guarda en `src/data/velos.json`. Al cambiar una foto de portada o su texto: correr el ajuste, compilar y medir otra vez sin `--ajustar` hasta que dé 0. Los textos chicos de la portada (clave, bajada, migas, datos) van en blanco pleno, nunca translúcidos.
17. Los iconos son todos de contorno (Phosphor ligero), nunca rellenos: un icono relleno junto a los demás pesa el doble y desentona. La única excepción es la estrella de las calificaciones. El de WhatsApp es el globo de contorno con el auricular macizo (el de doble línea se veía sucio en chico). El grosor se refuerza medio píxel de pantalla en la regla `.ico`, así los iconos chicos no quedan débiles y los grandes siguen finos. Tamaños: 0.875rem en etiquetas, 1rem en notas, 1.125rem junto a texto de interfaz, 1.375rem en barras y menú, 2rem en listas de servicios.
18. Los recuadros que van sobre una foto (barra de reservas, tarjeta del dato clave, barra de datos, formulario de Contacto) son de vidrio: blanco al 85 % con la foto desenfocada y aclarada detrás, un filo claro y sombra. Nunca un bloque blanco opaco pegado sobre la foto, ni tan transparente que salga gris (al 78 % salía gris sobre fotos oscuras). Donde el navegador no sabe desenfocar quedan al 95 %. El texto de adentro también se mide con `scripts/legibilidad.mjs`.
19. El hover de un botón tiene que notarse sin buscarlo: el botón se levanta 2 px, proyecta sombra y cambia de color; el de contorno se rellena (blanco sobre foto u oscuro, tinta sobre fondo claro); el icono se inclina y la flecha avanza. Solo con ratón (`hover:hover` y `pointer:fine`). Se revisa con `node scripts/hover.mjs`.
20. El óvalo de los títulos es una elipse dibujada a mano (trazo irregular, doble línea arriba a la izquierda), no un lazo de esquinas redondas. La frase que rodea va alineada con su párrafo, nunca corrida para hacerle sitio: el óvalo se centra en la frase y sobresale a los dos lados. Lo dibuja el guion de `Base.astro` midiendo la tinta real de la primera y la última letra, para que ninguna toque el trazo; si no hay sitio a los lados (celular, frase larga) se le llenan un poco los hombros en vez de salirse de la pantalla.
21. La línea del óvalo lleva aire arriba y abajo: el trazo no debe tocar las colas de la línea de arriba ni el párrafo que sigue (en las portadas el aire de abajo lo da el espacio entre bloques). Todos los óvalos del sitio se revisan juntos con `node scripts/ovalos.mjs`, en computadora y en celular, antes de dar por bueno un cambio.
22. El color de marca de Los Arcos es #EA6C00 y toda su paleta sale de ahí (`scripts/paleta.mjs`). Ese naranja exacto es el color de los botones, con texto blanco encima: lo decidió el dueño el 10 de noviembre de 2026 (con café oscuro «se ve feo»), aunque da 3.2 a 1 y al resto del texto le pedimos 4.5. Ninguna pieza escribe un color fijo sobre el color de acción: toma el papel `--c-sobre-accion`. El hover de los botones usa `--c-accion-hover` (más oscuro). El texto corrido nunca va sobre el naranja: las tarjetas de marca usan el tono oscuro.
23. Cada portada tiene que caber en una pantalla también en laptops bajas (1366 × 650 y 1280 × 620): lo comprueba `node scripts/cabe-portada.mjs`. Si no cabe, se compacta en la regla de pantallas bajas (letra del título, alto de los controles del formulario), no se deja que la primera pantalla se corte.
24. El panel del dato clave de cada portada (calificación de Google en el inicio; capacidad, precio, etc. en las interiores) va en la misma fila que la barra de abajo: la barra a la izquierda, el panel a la derecha, del mismo alto y con el mismo vidrio. Nunca flotando a media altura.
25. En la cabecera de Quinta Azul va el símbolo del logo con el nombre escrito al lado («Hotel» en versalitas sobre «Quinta Azul» en la serif): dentro del logo original el nombre no se alcanzaba a leer. El símbolo suelto lo genera `scripts/logos.mjs`.
26. El logo de Los Arcos con la palabra «Hotel» es provisional (10 de noviembre de 2026): al dueño le están haciendo uno nuevo. Mientras llega, `scripts/logo-arcos.mjs` lo arma con los arcos y las letras «Los Arcos Inn» del original y «HOTEL» en versalitas espaciadas entre dos filetes. En la cabecera de los dos hoteles el logo va en horizontal: el símbolo y, al lado, «Hotel» sobre el nombre.
27. La sección «ventana» del inicio presenta el hotel con el texto a un lado y tres fotos al otro, sin huecos y sin líneas de contorno alrededor de los marcos. La forma de los marcos sale de cada hotel: en Los Arcos, tres arcos del mismo tamaño, como los de su logo; en Quinta Azul, cuadros (uno grande y dos chicos), como los vanos de su fachada.
28. Descartado por el dueño el 10 de noviembre de 2026, no volver a proponerlo: la banda grande «Reservar» al final de las páginas («no me gustó en ninguna presentación»), el nombre del hotel en letras gigantes al pie, y en el inicio la sección de videos «Míralo antes de venir» y la tira de Instagram.
29. Descartado por el dueño el 13 de noviembre de 2026, no volver a proponerlo: que la foto de una habitación cambie al pasar el ratón («no es funcional, no es práctico»).
30. Ninguna foto sale dos veces en la misma página, y menos en secciones vecinas: antes de dar una página por buena se cuenta cada archivo. Donde hay pocas fotos de un espacio (la palapa de Quinta Azul tiene cuatro), se reparten entre las piezas grandes y lo demás usa otras vistas del hotel.
31. Cada foto enseña lo que dice su texto: una ficha que habla de tres camas no abre con dos, y «Posadas» no lleva el edificio de habitaciones. Si la foto no existe, se pide; mientras tanto va la que menos contradiga y se anota como pendiente.
32. Un título nunca se encoge al ancho de su frase: ocupa toda su columna, para que el óvalo tenga sitio y no toque las letras.
33. La última pasada antes de publicar se hace pantalla por pantalla, en celular y en computadora, con todas las páginas en hojas: foto que no va con su texto, texto descentrado, cosas apretadas, botones partidos en dos renglones, datos escritos de dos maneras.
34. Las horas se escriben de una sola manera en todo el sitio: «7 AM a 11 PM», «10 PM».
35. Un botón no se parte en dos renglones en celular: si su rótulo no cabe, lleva uno corto para celular (`solo-pc` / `solo-cel`).
36. Cuando dos tarifas son la misma habitación (sencilla y doble en Quinta Azul), se dice así en el texto y cada ficha abre con un ángulo distinto: la misma foto dos veces se ve poco profesional.
37. Las portadas se comparan en celular entre los dos hoteles: mismo aire y mismos renglones. El renglón más largo del título cabe en una línea (su letra se ajusta con `--largo`) y la nota del estimado va en una sola línea desde 360 px de ancho.
38. El título principal (h1) de cada página es solo la frase que la gente busca; el lema grande de la portada va como párrafo. En los artículos y en el blog, el título principal es el del artículo y el tema queda fuera, como rótulo.
39. Las secciones de preguntas enseñan tres o cuatro preguntas propias de su página (`FAQ_DE` en `textos.ts`); ninguna pregunta sale en dos páginas y la lista completa vive solo en /preguntas-frecuentes.
40. El mapa completo, con todas las distancias, va solo en Ubicación. En Inicio y en Contacto va la versión corta, con su propio título y un enlace a la ruta.
41. Los minutos a Monterrey, a las Grutas y a Xenpal se escriben en un solo lugar (`dist`, en `hoteles.ts`) y `scripts/seo.mjs` falla si alguna página dice otro número.
42. Un tema del blog con menos de tres artículos va con noindex y fuera del mapa del sitio hasta que los tenga. Una dirección que cambia se anota en `src/data/redirecciones.json` y sale como redirección 301 al compilar.
43. El pie cierra con el logo y las redes del hotel (Instagram, Facebook y WhatsApp), cada una con su icono de contorno dentro de un círculo y su enlace. Donde se habla de las reseñas va el logo de Google a colores: la «G» de contorno no se reconocía como Google.
44. En el inicio, los planes cerca del hotel van en versión corta (`PlanesCorto.astro`): un título, una línea y cuatro portadas que se abren en abanico al llegar a ellas, con un botón a /planes. La serie completa, con su índice, vive solo en su menú.
45. En Quinta Azul no se usa ningún arco, ni en el inicio ni en los submenús («no tiene sentido»; su edificio son cuadros). Los marcos que en Los Arcos son un arco (foto de la palapa, vista previa de los planes, foto de celebrar) van rectos en Quinta Azul: lo hace una sola regla al final de `detalles.css`. Cualquier marco nuevo en arco tiene que sumarse a esa regla.
46. En Los Arcos, lo que va en color de marca a tamaño grande (la frase del óvalo en los títulos, las cifras, los iconos) usa el naranja exacto de la marca, #EA6C00, el mismo de los botones: papel `--c-marca`. El texto chico de color (enlaces dentro de un párrafo, foco del teclado) sigue en el tono oscuro, `--c-texto-marca`, para que se lea. En Quinta Azul los dos papeles son el mismo azul.
47. El mapa de «Cómo llegar» es una imagen fija (no un mapa interactivo), plana, clara y en los tonos de cada hotel: calles con su nombre, edificios dibujados y los lugares cercanos que le sirven a un huésped (dónde comer, plaza, museos, farmacia, abarrotes), cada uno con su icono. El dueño probó dos versiones en 3D (la sierra en relieve y una oscura con edificios en volumen) y pidió volver a este mapa «normalito», pero con más calidad, más sitios y más bonito (11 de noviembre de 2026). Lo dibuja `node scripts/mapa.mjs`: dos imágenes por hotel (apaisada y vertical para celulares), con el hotel arriba y el centro del pueblo abajo. Los lugares salen de la lista hecha a mano de `src/data/lugares.json`; nunca van otros hoteles ni quintas de eventos. El hotel cae siempre en el mismo punto de cada imagen (`pin` y `pinCel` en `hoteles.ts`) y la sección lleva de fondo el tono del piso del mapa (`--c-mapa`). Crédito obligatorio: OpenStreetMap, OpenMapTiles, OpenFreeMap y Overture Maps.
48. Ninguna sección lleva de fondo una plancha de color con cuadrícula ni un gris que no sea el de la página: al dueño le «desentona» y lo ve «raro» (10 de noviembre de 2026). La página de planes abre con su portada de foto, como los demás menús, y la lista de guías va sobre el fondo de la página; los planes del inicio, también.
49. Las fotos de los paneles (vista previa de una lista, tarjetas, marcos de la «ventana») se revisan tal como se ven, con `node scripts/paneles.mjs`: una foto con media imagen de piso, cortada por la forma del marco o que no dice nada en su panel se reencuadra (`FOCOS` en `hoteles.ts`, que pone el punto de enfoque) o se cambia por otra.
50. Cada hotel habla con sus palabras: los textos de página viven en `src/data/textos.ts`, separados por hotel. Quinta Azul dice «palapa para fiestas» (cumpleaños, carne asada, posadas, fin de año); Los Arcos dice «palapa techada» (bautizos, primeras comuniones, reuniones familiares, convivios). Ningún título, encabezado ni enlace usa las palabras del otro hotel.
51. Antes de publicar, `node scripts/seo.mjs` debe decir «sin fallas» en los dos sitios: título único de hasta 60 caracteres, descripción única de 120 a 160, un solo título principal, dirección canónica, imagen para redes de 1200 × 630, datos estructurados legibles, fotos con medidas, ningún enlace roto ni genérico y cada artículo con fecha visible y al menos dos enlaces a páginas que venden.
52. El blog vive en `src/content/blog/<hotel>/`. Cada artículo trae título, descripción, tema, búsqueda principal, resumen, foto con su descripción, fechas y a qué página lleva. Los temas son páginas propias con enlaces reales (nunca filtros). Precios y horarios de terceros solo con la fecha en que se verificaron y su fuente.
53. Dato que no se puede confirmar (precio, horario, lugar, negocio) no se escribe: se deja «cotiza por WhatsApp» o se omite.
54. El formulario de reserva manda la solicitud a `/api/contacto` (la guarda y avisa al correo del hotel, como en los sitios publicados). Si el envío falla, ofrece mandarla por WhatsApp ya escrita: una reserva nunca se pierde.
55. El comparador de habitaciones responde a cada número de personas con una frase (qué conviene y cuánto suma por noche), no solo con una columna marcada.
56. El texto corrido no pasa de unos 70 caracteres por línea (artículos y páginas legales); fotos, tablas y video sí pueden usar todo el ancho.
57. Los nombres de clase no se reciclan entre piezas distintas: dos estilos llamados igual se pisan según el orden en que cargan (así se rompieron el mosaico de «incluido» y la marca «opcional» del formulario el 11 de noviembre).
58. En celular ningún botón ensancha la página: un texto largo parte en dos líneas. Los botones de la portada se ocultan en celular solo donde ya hay un botón flotante que hace lo mismo; en la 404 y en Contacto se quedan.
59. La foto de las habitaciones es siempre la de la ficha que está más cerca del centro de la pantalla.
60. Una foto que se recorta a otra proporción (carta vertical con foto apaisada) pide más ancho del que mide su caja: el `sizes` se calcula con el recorte, no con el ancho de la caja.
61. La copia de prueba se publica con `node scripts/publicar-prueba.mjs qa|la` (workers.dev, cerrada a buscadores). Los dominios reales no se tocan desde este proyecto.
62. Entre dos secciones seguidas del mismo color de fondo va un solo «aire de sección» (`--seccion`), nunca dos sumados ni menos de la mitad. Lo mide `node scripts/huecos.mjs <url> [--pantallas=…]` en todas las páginas; la fila «Sigue por aquí» lleva aire corto e igual a los dos lados.
63. WhatsApp: lo que la persona elige (fechas y huéspedes de su estancia en la barra, el comparador o Contacto; fecha, personas y motivo de su fiesta en Celebraciones) se guarda durante la visita y lo lleva TODO botón que escribe por WhatsApp, en renglones cortos debajo de la frase (`src/scripts/whatsapp.ts`). Lo que no eligió no se inventa: las fechas de muestra de la barra no cuentan hasta que las toca o consulta. Se comprueba con `node scripts/probar-whatsapp.mjs`.
64. Las frases de WhatsApp nombran al hotel con artículo («en el Hotel…», «del Hotel…») y a cada cuarto con el suyo («la habitación doble», «el departamento con cocina»).
65. El formulario de Contacto se manda por correo y NO abre WhatsApp al enviarse; WhatsApp es solo el respaldo si el envío falla.
66. El correo que recibe el hotel lo arma `servicio/correo.ts`: asunto con nombre, fechas y personas; arriba quién, cuándo y cuántos; botones para responder por WhatsApp, llamar o contestar por correo; el mensaje y el detalle con folio. Se ve sin enviarlo con `node scripts/correo-vista.mjs`. Todo lo que escribe la persona se escapa.
67. Una pieza que debe su forma a un giro (el pin del mapa es una gota girada 45°) conserva ese giro en todos los cuadros de su animación de entrada: si la animación escribe otro `transform`, la pieza aparece volteada y se acomoda de golpe al terminar. Lo comprueba `node scripts/probar-video.mjs` midiendo el giro cuadro por cuadro.
68. Reproductor de video: propio y sin librerías. Mientras el archivo llega se queda el cartel con un aro que gira; al correr, los controles van abajo sobre un degradado (arriba el avance, que se arrastra; abajo pausa, tiempo, volumen y pantalla completa) y se esconden a los tres segundos. El volumen es un deslizador vertical que sale al acercar el ratón al botón de sonido; en celular solo queda silenciar, porque ahí manda el botón del teléfono. Teclado: espacio o K, flechas, M y F. Nada de vidrio esmerilado sobre el video. Se prueba con `node scripts/probar-video.mjs`.
69. Los videos se publican en /video/ y pasan por el servicio (servicio/tramos.ts con run_worker_first «/video/*»): el servicio de archivos de Cloudflare devuelve siempre el archivo entero, y sin tramos no se puede saltar dentro del video ni reproducirlo bien en Safari. Solo para videos cortos (el tramo se recorta en memoria).
70. Seguridad: el sitio manda política de contenido (solo código propio; los guiones en línea se autorizan por su huella, calculada al compilar), solo HTTPS, sin marcos ajenos, sin adivinar tipos y con los permisos del navegador apagados. No pone cookies ni carga nada de otros dominios. Todo sale de `servicio/seguridad.ts` y `scripts/cabeceras.mjs`; se comprueba con `node scripts/seguridad.mjs <url>` (debe decir «todo bien») y, ya publicado, con securityheaders.com (meta: A+).
71. Nada de código en línea nuevo sin pasar por la compilación: un manejador escrito en el HTML (onclick="…") o un enlace javascript: lo bloquea la política de contenido, y `scripts/cabeceras.mjs` detiene la compilación si encuentra uno.
72. Las fotos que van juntas miden lo mismo y arrancan a la misma altura (galerías, filas de tarjetas, carruseles). En celular no hay filas escalonadas: se leen como «unas más grandes que otras». Solo se salen de la regla los mosaicos hechos a propósito (una grande y varias chicas iguales). Lo mide `node scripts/fotos-parejas.mjs <url>`.

## Cómo cambiar algo

- **Un color de este hotel:** edita su bloque en `scripts/paleta.mjs` y corre `npm run paleta`. Si una pareja queda por debajo del contraste mínimo, el comando falla y dice cuál.
- **Un espacio, tamaño o tiempo:** cambia la variable en `src/styles/sistema.css` (y su espejo en `src/scripts/ritmo.ts` si es de movimiento).
- **Una foto o un video:** cambia su renglón en `scripts/material.mjs` y corre `node scripts/material.mjs`. El estilo está en `src/styles/medios.css` y el comportamiento en `src/scripts/medios.ts`.
- **Después de cualquier cambio:** `node scripts/estandar.mjs` vuelve a escribir este documento.
