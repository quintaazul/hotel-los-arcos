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
