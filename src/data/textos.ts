// Los textos de cada sitio. Cada hotel tiene los suyos: mismas piezas, palabras distintas.
// Reglas del plan SEO (documento «Rediseño web…», 10 de noviembre de 2026):
//   · título de hasta 60 caracteres, descripción de 120 a 160 y un solo H1 por página, con el texto del plan;
//   · cada búsqueda tiene un solo dueño. En títulos, encabezados y enlaces las palabras de un hotel no se cruzan
//     con las del otro;
//   · los enlaces dicen a dónde llevan («Ver habitaciones desde $900»), nunca «Ver» o «Más».
// Textos del documento «Cambios para el desarrollador» (17 de noviembre de 2026): cada título termina en
// «| Hotel Quinta Azul» o «| Hotel Los Arcos Inn»; los precios se dicen «desde $X + IVA»; Quinta Azul tiene nueve
// habitaciones iguales, de 1 a 4 personas; en Los Arcos la palapa es solo para huéspedes (no se rentan eventos).
// Solo datos confirmados: lo que no se sabe (precio de la palapa, tarifa por semana) se manda a cotizar por WhatsApp.
import { H, dinero } from './hoteles';

// Precios y teléfono se escriben UNA sola vez, en hoteles.ts. Aquí salen de ahí: al cambiar un precio cambian solos
// los títulos, las descripciones, los enlaces y las preguntas que lo mencionan. No escribir «$900» a mano en un texto.
// (Los artículos del blog sí llevan el número escrito: scripts/seo.mjs avisa si alguno se queda con un precio viejo.)
/** Precio de un tipo de habitación, ya con formato: precioDe('depa') → «$2,000» */
export const precioDe = (id: string) => dinero(H.habs.find((x) => x.id === id)?.precio ?? 0);
/** El precio más bajo del hotel, para los «desde $…» */
export const DESDE = dinero(Math.min(...H.habs.map((x) => x.precio ?? Infinity)));
/** «$900\u00A0+\u00A0IVA»: así se dice siempre un precio en el sitio */
/** El teléfono escrito dentro de un texto: con espacios duros, para que no se parta entre renglones */
const TEL_TXT = H.tel.replace(/ /g, '\u00A0');
export const DESDE_IVA = DESDE + '\u00A0+\u00A0IVA';

export type Seo = { title: string; description: string; h1: string };
type Cab = { l: string; o: string; texto?: string };
type MapaTxt = { titulo: string; texto?: string; filas: [string, string][]; enlace?: string };
type Enlace = [string, string];   // texto del enlace, dirección
// Una sección de texto de Ubicación: título (l + óvalo), párrafo, lista opcional y fuente opcional
type SeccionTxt = { id: string; l: string; o: string; texto?: string; lista?: [string, string][]; fuente?: [string, string]; lang?: string };
export type Pregunta = { id: string; q: string; a: string };
export type GrupoFaq = { id: string; nombre: string; items: Pregunta[] };

const esQA = H.id === 'qa';
// Distancias y tipos de habitación salen de los datos del hotel (hoteles.ts): aquí no se escriben a mano.
const D = H.dist;
const PLURAL: Record<string, string> = { sencilla: 'sencillas', doble: 'dobles', triple: 'triples' };
const junta = (l: string[], y: string) => (l.length > 1 ? l.slice(0, -1).join(', ') + ' ' + y + ' ' + l[l.length - 1] : l[0] ?? '');
const tipos = H.habs.map((x) => PLURAL[x.id]).filter(Boolean);
export const TIPOS = junta(tipos, 'y');     // «sencillas y triples»: los tipos que de verdad se venden
export const TIPOS_O = junta(tipos, 'o');
const rutaPalapa = '/' + H.rutaPalapa;

// ── Título, descripción y H1 de cada página ──
const SEO_QA = {
  inicio: { title: 'Hotel con alberca y palapa en García | Hotel Quinta Azul', description: 'Hotel en el centro de García, N.L., a dos cuadras de la plaza: 9 habitaciones con vista a la sierra, alberca hasta las 10 PM y palapa con asador.', h1: 'Hotel en el centro de García, Nuevo León, con alberca y palapa' },
  habitaciones: { title: 'Habitaciones en García, hasta 4 personas | Hotel Quinta Azul', description: 'Habitaciones en García, N.L., para hasta 4 personas: aire acondicionado, frigobar, microondas y agua caliente a toda hora. Desde ' + DESDE_IVA + ' por noche.', h1: 'Habitaciones en García, N.L., para 1 a 4 personas' },
  celebraciones: { title: 'Palapa con alberca en García | Hotel Quinta Azul', description: 'Palapa con asador para hasta 60 personas junto a la alberca en García, N.L. Tus invitados pueden quedarse a dormir en el mismo hotel.', h1: 'Palapa con alberca en García para reuniones de hasta 60 personas' },
  ubicacion: { title: 'Cómo llegar a García desde Monterrey | Hotel Quinta Azul', description: 'Cómo llegar a Hotel Quinta Azul en el centro de García, N.L., desde Monterrey. Qué ver cerca: el templo, el Parián, las huertas y las Grutas.', h1: 'Cómo llegar al Hotel Quinta Azul en el centro de García' },
  contacto: { title: 'Reserva por WhatsApp en García, N.L. | Hotel Quinta Azul', description: 'Reserva en Hotel Quinta Azul por WhatsApp o al ' + TEL_TXT + ', o envía el formulario. Te respondemos todos los días de 7 AM a 11 PM.', h1: 'Reservaciones en Hotel Quinta Azul' },
  faq: { title: 'Preguntas frecuentes antes de reservar | Hotel Quinta Azul', description: 'Respuestas sobre reservas, anticipo, habitaciones, alberca, la palapa con asador, reglas y cómo llegar al Hotel Quinta Azul en García, N.L.', h1: 'Preguntas frecuentes del Hotel Quinta Azul' },
  aviso: { title: 'Aviso de privacidad | Hotel Quinta Azul', description: 'Aviso de privacidad del Hotel Quinta Azul: qué datos pedimos al reservar, para qué los usamos, con quién se comparten y cómo ejercer tus derechos ARCO.', h1: 'Aviso de privacidad' },
  politicas: { title: 'Políticas de reservación | Hotel Quinta Azul', description: 'Políticas de reservación del Hotel Quinta Azul, en García, N.L.: anticipo, cancelaciones, horarios de entrada y salida, alberca, palapa y reglas.', h1: 'Políticas de reservación y estancia' },
  terminos: { title: 'Términos y condiciones | Hotel Quinta Azul', description: 'Términos y condiciones de uso del sitio del Hotel Quinta Azul, en García, N.L.: información, precios, solicitudes de reserva, enlaces externos y contacto.', h1: 'Términos y condiciones del sitio' },
  noEncontrada: { title: 'Página no encontrada | Hotel Quinta Azul', description: 'Esta página no existe. Vuelve al inicio del Hotel Quinta Azul, mira las habitaciones desde ' + DESDE_IVA + ' o la palapa, o escríbenos por WhatsApp.', h1: 'Error 404' },
};
const SEO_LA = {
  inicio: { title: 'Hotel con jardín en García, N.L. | Hotel Los Arcos Inn', description: 'Hotel con jardín en el centro de García, N.L.: sencillas, triples y departamentos con cocina, palapa con asador y las Grutas a ' + D.grutas + ' minutos.', h1: 'Hotel con jardín y alberca en el centro de García, Nuevo León' },
  habitaciones: { title: 'Habitaciones en García, 1 a 6 personas | Hotel Los Arcos Inn', description: 'Habitaciones en García, N.L., para 1 a 6 personas y departamentos para hasta 8. Jardín, estacionamiento y las Grutas a ' + D.grutas + ' minutos. Desde ' + DESDE_IVA + '.', h1: 'Habitaciones en García, N.L., para 1 a 6 personas' },
  departamentos: { title: 'Departamento por semana en García | Hotel Los Arcos Inn', description: 'Departamentos con 2 recámaras, sala y cocina en el centro de García, N.L., para 4 a 8 personas. Ideales para estancias de una semana o más.', h1: 'Departamento amueblado con cocina en García, N.L.' },
  empresas: { title: 'Hospedaje para trabajadores en García | Hotel Los Arcos Inn', description: 'Hospedaje con factura para equipos de trabajo en García, N.L.: habitaciones por noche y departamentos para estancias largas, con estacionamiento y WiFi.', h1: 'Hospedaje para trabajadores y empresas en García' },
  celebraciones: { title: 'Palapa con asador para huéspedes | Hotel Los Arcos Inn', description: 'Palapa techada con asador, parrilla de gas, televisión y mesa grande, solo para los huéspedes de Hotel Los Arcos Inn en García, N.L.', h1: 'Palapa techada con asador para los huéspedes de Los Arcos Inn' },
  ubicacion: { title: 'Ubicación en el centro de García | Hotel Los Arcos Inn', description: 'Hotel Los Arcos Inn está en Mariano Escobedo 105-A, centro de García, N.L.: a 3 minutos de la plaza, ' + D.xenpal + ' de Xenpal y ' + D.grutas + ' de las Grutas.', h1: 'Cómo llegar al Hotel Los Arcos Inn en García' },
  contacto: { title: 'Reserva por WhatsApp en García | Hotel Los Arcos Inn', description: 'Reserva en Hotel Los Arcos Inn por WhatsApp o al ' + TEL_TXT + ', o envía el formulario. Te respondemos todos los días de 7 AM a 11 PM.', h1: 'Reservaciones en Hotel Los Arcos Inn' },
  faq: { title: 'Preguntas frecuentes antes de reservar | Hotel Los Arcos Inn', description: 'Respuestas sobre reservas, anticipo, habitaciones, departamentos, alberca, palapa techada, reglas y cómo llegar a Hotel Los Arcos Inn en García.', h1: 'Preguntas frecuentes de Hotel Los Arcos Inn' },
  aviso: { title: 'Aviso de privacidad | Hotel Los Arcos Inn', description: 'Aviso de privacidad del Hotel Los Arcos Inn: qué datos pedimos al reservar, para qué los usamos, con quién se comparten y cómo ejercer tus derechos ARCO.', h1: 'Aviso de privacidad' },
  politicas: { title: 'Políticas de reservación | Hotel Los Arcos Inn', description: 'Políticas de reservación del Hotel Los Arcos Inn, en García, N.L.: anticipo, cancelaciones, horarios, formas de pago, alberca, palapa techada y reglas.', h1: 'Políticas de reservación y estancia' },
  terminos: { title: 'Términos y condiciones | Hotel Los Arcos Inn', description: 'Términos y condiciones de uso del sitio del Hotel Los Arcos Inn, en García, N.L.: información, precios, solicitudes de reserva, enlaces y contacto.', h1: 'Términos y condiciones del sitio' },
  noEncontrada: { title: 'Página no encontrada | Hotel Los Arcos Inn', description: 'Esta página no existe. Vuelve al inicio del Hotel Los Arcos Inn, mira las habitaciones y los departamentos con cocina, o escríbenos por WhatsApp.', h1: 'Error 404' },
};
export const SEO: Record<string, Seo> = esQA ? SEO_QA : SEO_LA;

// ── Textos de las secciones ──
const QA = {
  palapa: 'palapa con asador',
  inicio: {
    cinta: ['Alberca hasta las 10\u00A0PM', 'Palapa con asador para 60 personas', 'A dos cuadras de la plaza', 'A ' + D.monterrey + ' minutos de Monterrey', 'Reserva directo por WhatsApp'],
    habs: { l: 'Habitaciones con vista a la sierra,', o: 'hasta 4 personas', texto: 'Una habitación para descansar de verdad: aire acondicionado, televisión, frigobar y microondas para lo que traigas del camino, y un baño con agua caliente que los huéspedes mencionan una y otra vez. Caben hasta cuatro, así que el viaje en pareja, con los niños o con los amigos cabe en el mismo cuarto. Desde ' + DESDE_IVA + ' por noche, según cuántos se quedan.' },
    comparar: { l: '¿Cuántos', o: 'se quedan?', texto: 'Caben hasta cuatro en una habitación. Dinos cuántos son y te damos el total exacto.' },
    directo: { t: 'Por qué reservar directo', razones: [['mano', 'Tratas con el hotel', 'Sin plataformas de por medio ni sus comisiones.'], ['wa', 'Respuesta por WhatsApp', 'Todos los días, de 7\u00A0AM a 11\u00A0PM.'], ['factura', 'Facturamos sin problema', 'Pide tu factura al reservar o al llegar.']] as [string, string, string][] },
    incluido: { l: 'Alberca con chapoteadero, abierta', o: 'hasta las 10 de la noche', texto: 'Muchos de los mejores ratos de la estancia pasan aquí. Los niños en el chapoteadero, los grandes en el agua después de las Grutas y la plática que sigue en la orilla con la sierra de fondo. Como la alberca está abierta hasta las diez, todavía cabe el último chapuzón después de cenar.' },
    resenas: { l: H.rating + ' en Google', o: 'con ' + H.resenas + ' reseñas', texto: 'Lo que más se repite en las reseñas no es un adjetivo de folleto: es que aquí se descansa. Limpio, tranquilo, seguro, «como en casa». Muchos huéspedes ya volvieron más de una vez, y eso dice más que cualquier promesa.' },
    blog: { mini: 'Del blog', l: 'Planes', o: 'cerca del hotel', texto: 'Planes a pocos minutos del hotel, ideas para tu reunión en la palapa y escapadas de fin de semana.' },
    faq: { l: 'Preguntas antes', o: 'de reservar' },
    verHabs: 'Ver habitaciones desde ' + DESDE_IVA,
  },
  palapaBloque: { cotizar: 'Cotizar mi fecha', ver: 'Palapa con alberca en García', waMsg: 'quiero cotizar una fecha en la palapa' },
  mapa: {
    completo: { titulo: 'Dirección y mapa', filas: [['Desde Monterrey', '≈ ' + D.monterrey + ' min'], ['A las Grutas de García', '≈ ' + D.grutas + ' min'], ['A Xenpal', '≈ ' + D.xenpal + ' min'], ['A la plaza principal', 'Dos cuadras']] },
    inicio: { titulo: 'A dos cuadras de la plaza de García', texto: 'Salir a caminar es parte de quedarse aquí. En la plaza, el reloj de cuatro caras del templo de San Juan Bautista lleva más de un siglo marcando la hora del pueblo. Es buen lugar para sentarse un rato, tomarse la foto frente al templo y decidir dónde cenar: Los Primos, El Casco Antiguo o La Mexicana. De regreso, la calle ya está en calma.', filas: [['Desde Monterrey', '≈ ' + D.monterrey + ' min'], ['Atención', '7 AM a 11 PM']], enlace: 'La ruta paso a paso' },
    contacto: { titulo: 'Datos del hotel', filas: [['Atención', 'Todos los días, 7 AM a 11 PM'], ['Estacionamiento', 'Dentro del hotel']], enlace: 'Cómo llegar al hotel' },
  } as Record<'completo' | 'inicio' | 'contacto', MapaTxt>,
  habitaciones: {
    portada: { l: 'Habitaciones', o: 'desde ' + DESDE_IVA, texto: 'Un viaje a García puede ser muchas cosas. Todos terminan igual: en una habitación tranquila donde se duerme bien.' },
    lista: { l: 'Precio según', o: 'cuántos se quedan', texto: 'Las nueve habitaciones son iguales, así que no tienes que escoger tipo: solo dinos cuántos son. Para una persona, desde ' + DESDE_IVA + ' por noche, y el precio cambia con cada persona, hasta cuatro. Escríbenos y te damos el total exacto.' },
    galeria: { l: 'Míralas', o: 'por dentro', texto: 'Fotos tomadas en el hotel. Toca cualquiera para verla en grande.' },
    reglas: { l: 'Reglas', o: 'de la casa', texto: 'Son pocas, y son para que todos descansen. Entrada a partir de las 2\u00A0PM, salida a las 11\u00A0AM. Atendemos de 7 de la mañana a 11 de la noche, todos los días.', incluye: 'Qué trae cada habitación', notiene: 'Lo que no tenemos: desayuno, restaurante ni lavandería. A cambio, el centro de García está a dos cuadras.' },
    grupos: { l: 'Descuento si te quedas', o: 'más de tres días', texto: 'Si te quedas más de tres días, el precio por noche baja: por ejemplo, una habitación de $1,200\u00A0+\u00A0IVA queda en $1,100\u00A0+\u00A0IVA. Para grupos de tres habitaciones o más, el precio depende de cuántas personas se quedan y cuántas habitaciones ocupan; escríbenos y te lo cotizamos. Las empresas con grupos de más de tres personas tienen 2\u00A0% de descuento.', boton: 'Preguntar por el descuento' },
    blog: { l: 'Para planear', o: 'tu visita', texto: 'Dos lecturas cortas antes de venir.' },
    enlaces: [['Palapa con alberca en García', rutaPalapa], ['Todas las preguntas frecuentes', '/preguntas-frecuentes'], ['Cómo llegar al hotel', '/ubicacion']] as Enlace[],
  },
  celebraciones: {
    portada: { l: 'Palapa con', o: 'alberca', texto: 'En Nuevo León lo importante se celebra alrededor del asador: la carne asada es tradición regia y desde 2023 es patrimonio cultural del estado.' },
    cotizarBtn: 'Cotizar mi fecha', verBtn: 'Ver la palapa', tarjeta: 'Se aparta por fecha. Cotízala por WhatsApp.',
    bloque: { l: 'Qué incluye', o: 'la palapa', texto: 'En la palapa del Hotel Quinta Azul caben el cumpleaños de la abuela, la posada de la oficina o la reunión de primos que no se ven desde hace años: la familia completa, la alberca a un lado y nadie con prisa por irse. Ustedes traen la comida; lo demás ya está aquí. En los bancos se cena, se platica y se ve el partido en la televisión mientras sale la carne asada. La música alta se permite hasta las 8 de la noche; después ya no se hace ruido, porque hay huéspedes descansando.' },
    puntos: { l: 'La palapa,', o: 'punto por punto' },
    alberca: { l: 'Alberca y chapoteadero', o: 'para los niños', texto: 'Mientras los grandes están en el asador, los niños están en el agua, a la vista de todos: la alberca y el chapoteadero quedan junto a la palapa.' } as Cab | null,
    tiposCab: { l: 'Qué puedes', o: 'celebrar aquí', texto: 'Elige tu reunión y te abrimos WhatsApp con el mensaje listo para cotizar.' },
    tipos: [['Cumpleaños', 'Asador listo, espacio abierto y la alberca a un paso.', 'un cumpleaños'], ['Carne asada', 'Asador de carbón y refrigerador para la carne.', 'una carne asada'], ['Posadas', 'Piñata, ponche y cena bajo techo, en diciembre.', 'una posada'], ['Fin de año', 'Recibe el año con los tuyos, sin manejar de regreso.', 'una fiesta de fin de año']] as [string, string, string][],
    cotiza: { l: 'Cómo apartar', o: 'la fecha', texto: 'Escríbenos por WhatsApp con la fecha y cuántos invitados vienen. Te confirmamos disponibilidad, el precio y lo que necesitas para apartar.' },
    apartar: [['Escríbenos', 'con la fecha y cuántos invitados vienen.'], ['Te confirmamos', 'la disponibilidad, el precio y lo que necesitas para apartar.'], ['Llega y celebra:', 'ustedes traen la comida; lo demás ya está aquí.']] as [string, string][],
    opciones: ['Cumpleaños', 'Carne asada', 'Posada', 'Fin de año', 'Otra reunión'], etiquetaOpc: 'Qué celebran',
    invitados: { l: 'Hospedaje para', o: 'los invitados', texto: 'Es lo que una quinta no puede darte: cuartos. Los abuelos se retiran a descansar cuando quieren, los que vienen de fuera no manejan de noche y al día siguiente la reunión sigue en el desayuno, en el centro.', enlace: 'Habitaciones para tus invitados', href: '/hospedaje' },
    reglasUso: null as Cab | null,
    blog: { l: 'Ideas para', o: 'tu reunión', texto: 'Cómo organizarla, qué llevar y cómo apartar la palapa.', tema: 'fiestas-en-la-palapa' },
    enlaces: [['Habitaciones para tus invitados', '/hospedaje'], ['Cómo organizar una posada en palapa', '/blog/posada-navidena-en-palapa'], ['Cómo llegar al hotel', '/ubicacion']] as Enlace[],
    waBase: 'en la palapa del ',
  },
  ubicacion: {
    portada: { l: 'A ' + D.monterrey + ' minutos', o: 'de Monterrey', texto: 'Bernardo Reyes esquina con Garza Ayala, en el centro de García, a dos cuadras de la plaza.' },
    intro: 'García está a unos 38\u00A0km del centro de Monterrey y a 25 de Cumbres, pero llegar se siente como cambiar de ritmo: calles de pueblo, huertas de granada y un centro con más de cuatro siglos de historia que se recorre a pie. Hotel Quinta Azul está justo ahí, y de aquí salen los planes del día.',
    llegar: { l: 'Desde Monterrey por la avenida Lincoln', o: 'o la carretera a García', texto: 'Desde Cumbres son unos 25\u00A0km por la avenida Abraham Lincoln. Desde el centro de Monterrey, unos 38\u00A0km por la carretera a García (NL 65). En hora pico el camino puede tomar cerca de una hora; fuera de ella, bastante menos. Al reservar te mandamos la ubicación exacta por WhatsApp.' },
    extras: [] as { titulo: string; texto: string }[],
    secciones: [
      { id: 'plaza', l: 'A dos cuadras de', o: 'la parroquia y la plaza', texto: 'García empezó en 1583 como Pesquería Grande, un punto del camino entre Saltillo y los Ojos de Santa Lucía, donde nacería Monterrey. En 1851 se convirtió en villa y tomó el nombre de Joaquín García, dos veces gobernador del estado. Lo que queda de esa historia está a unos pasos del hotel:',
        lista: [['Templo de San Juan Bautista', 'frente a la plaza, reconstruido después del incendio de 1883, con su reloj de 1911.'], ['El Antiguo Parián', 'mercado de adobe que en 1915 fue cuartel carrancista y hoy es espacio cultural.'], ['Las huertas', 'alrededor de cien, con granada, aguacate, nuez e higo. La granada es la fruta del pueblo.']],
        fuente: ['garcia.gob.mx/historia', 'https://garcia.gob.mx/historia'] },
      { id: 'cerca', l: 'Qué hay cerca: Grutas,', o: 'Xenpal y Los Faisanes', texto: 'Un día bien aprovechado empieza temprano en las Grutas de García, a unos ' + D.grutas + ' minutos en carro. Se descubrieron en 1843; se sube en teleférico o por la vereda, y el recorrido dentro de la cueva es de esos que los niños cuentan al regresar. En el mismo camino están Xenpal y Los Faisanes, para ver animales de cerca. En la tarde, de vuelta a la alberca; en la noche, a cenar al centro.' },
      { id: 'comer', l: 'Dónde comer', o: 'en el centro', texto: 'Tres lugares del centro, a pocos minutos a pie:',
        lista: [['Los Primos', 'cocina mexicana que abre temprano, buena para desayunar antes de las Grutas. Lo más pedido es la arrachera.'], ['Casco Antiguo', 'taquería del centro para una comida sencilla.'], ['La Mexicana', 'cocina mexicana que cierra tarde, para cenar después de la alberca.']] },
    ] as SeccionTxt[],
    ingles: { id: 'in-english', l: 'In', o: 'English', lang: 'en', texto: 'Hotel Quinta Azul is in downtown García, two blocks from the main square, about 38\u00A0km (24 miles) from downtown Monterrey and 15 minutes from the García Caves. Nine rooms for up to four guests, a pool open until 10\u00A0PM and on-site parking. Check‑in 2\u00A0PM, check-out 11\u00A0AM. Book by WhatsApp: +52\u00A081\u00A02921\u00A08643.' } as SeccionTxt,
    alLlegar: { l: 'Lo que encuentras', o: 'al llegar', items: [['alberca', 'Alberca abierta hasta las 10\u00A0PM, con chapoteadero'], ['fiesta', 'Palapa con asador para hasta 60 personas'], ['auto', 'Estacionamiento dentro del hotel']] as [string, string][] },
    blog: { l: 'Planes a', o: 'pocos minutos', texto: 'Guías del blog, con sus distancias desde el hotel.', tema: ['planes-en-garcia', 'escapadas'] },
    enlaces: [['Habitaciones desde ' + DESDE_IVA, '/hospedaje'], ['Qué hacer en García', '/blog/que-hacer-en-garcia'], ['Reserva directo', '/contacto']] as Enlace[],
  },
  contacto: {
    portada: { l: 'Reserva', o: 'directo', texto: 'Por WhatsApp, por teléfono o con el formulario. Sin comisiones de plataformas.' },
    form: 'Formulario de reserva', motivos: [['hospedaje', 'Descanso'], ['celebracion', 'Reunión en la palapa'], ['negocios', 'Trabajo'], ['otro', 'Otro']] as [string, string][],
    enlaces: [['Ver habitaciones desde ' + DESDE_IVA, '/hospedaje'], ['Palapa con alberca en García', rutaPalapa], ['Todas las preguntas frecuentes', '/preguntas-frecuentes']] as Enlace[],
  },
  noEncontrada: { l: 'Esta página', o: 'se nos escapó', enlaces: [['Volver al inicio', '/'], ['Ver habitaciones desde ' + DESDE_IVA, '/hospedaje'], ['Palapa con alberca en García', rutaPalapa]] as Enlace[] },
  pie: { s: 'Te esperamos', o: 'en García' },
  sigue: 'Sigue por aquí',
};
const LA: typeof QA = {
  palapa: 'palapa techada',
  inicio: {
    cinta: ['Jardín, alberca y chapoteadero', 'Departamentos con cocina', 'Palapa techada para huéspedes', 'A ' + D.grutas + ' minutos de las Grutas', 'Aparta por WhatsApp'],
    habs: { l: 'Sencillas, triples y', o: 'departamentos con cocina', texto: 'Aquí cabe la familia completa, sin repartirla en tres hoteles. Hay habitaciones sencillas para una o dos personas, triples para tres a seis y dos departamentos con dos recámaras, sala y cocina para hasta ocho. Desde ' + DESDE_IVA + ' por noche; el departamento, desde ' + precioDe('depa') + ' + IVA.' },
    comparar: { l: '¿Cuántos', o: 'viajan?', texto: 'Dinos cuántos son y te señalamos la opción que mejor les queda.' },
    directo: { t: 'Por qué apartar con el hotel', razones: [['mano', 'Sin intermediarios', 'Apartas con nosotros y no pagas comisiones de plataformas.'], ['tel', 'Te contestamos nosotros', 'Por WhatsApp o por teléfono, de 7\u00A0AM a 11\u00A0PM.'], ['factura', 'Con factura', 'Dinos al apartar que la necesitas y la preparamos.']] as [string, string, string][] },
    incluido: { l: 'Áreas verdes,', o: 'alberca y chapoteadero', texto: 'En la ciudad, los niños casi nunca tienen pasto donde correr. Aquí sí. El jardín de Los Arcos es para jugar y tirarse a la sombra; los chiquitos se mojan en el chapoteadero y los grandes en la alberca, mientras los papás platican cerca. También es un buen lugar para la foto de familia.' },
    resenas: { l: H.rating + ' en Google', o: 'con ' + H.resenas + ' reseñas', texto: 'Quienes se han quedado hablan de lo mismo: el trato, la limpieza, habitaciones amplias y la tranquilidad de dejar el carro seguro. Varios ya volvieron con la familia.' },
    blog: { mini: 'Del blog', tema: 'grutas-y-alrededores', l: 'Guía de', o: 'las Grutas', texto: 'Horarios y precios de las Grutas, paseos para ir con niños y consejos para estancias de semanas.' },
    faq: { l: 'Preguntas antes', o: 'de reservar' },
    verHabs: 'Habitaciones ' + TIPOS,
  },
  palapaBloque: { cotizar: 'Reservar por WhatsApp', ver: 'Palapa techada para huéspedes', waMsg: 'quiero reservar y usar la palapa' },
  mapa: {
    completo: { titulo: 'Dirección y mapa', filas: [['A las Grutas de García', '≈ ' + D.grutas + ' min'], ['A Xenpal', '≈ ' + D.xenpal + ' min'], ['A la plaza principal', '3 min'], ['Desde Monterrey', '≈ ' + D.monterrey + ' min']] },
    inicio: { titulo: 'A tres minutos de la plaza de García', texto: 'Estamos en Mariano Escobedo 105-A, entre Bernardo Reyes y Morelos. Sobre Morelos está la capilla de San Elías, que un ganadero mandó construir entre 1808 y 1828 para cumplir una promesa. A tres minutos está la plaza, con el templo de San Juan Bautista. Es un centro tranquilo: los huéspedes lo describen como calles seguras, con el carro guardado dentro del hotel.', filas: [['A la plaza', '3 min'], ['A las Grutas de García', '≈ ' + D.grutas + ' min']], enlace: 'La ruta paso a paso' },
    contacto: { titulo: 'Datos del hotel', filas: [['Atención', 'Todos los días, 7 AM a 11 PM'], ['Estacionamiento', 'Dentro del hotel']], enlace: 'Cómo llegar al hotel' },
  } as Record<'completo' | 'inicio' | 'contacto', MapaTxt>,
  habitaciones: {
    portada: { l: 'Cuartos', o: 'desde ' + DESDE_IVA, texto: 'Las familias que vienen a García casi nunca son de dos. Por eso una triple recibe hasta seis personas: los papás, los niños y la abuela, juntos.' },
    lista: { l: 'Precio según', o: 'cuántos se quedan', texto: 'Desde ' + DESDE_IVA + ' por noche; el departamento, desde ' + precioDe('depa') + ' + IVA. El total depende de cuántas personas se quedan. Escríbenos y te lo damos exacto.' },
    galeria: { l: 'Así son', o: 'por dentro', texto: 'Todas las fotos se tomaron en el hotel. Tócalas para ampliarlas.' },
    reglas: { l: 'Reglas', o: 'de la casa', texto: 'Son pocas, y son para que todos descansen. Entrada a partir de las 2\u00A0PM, salida a las 11\u00A0AM.', incluye: 'Todas incluyen', notiene: '' },
    grupos: { l: '¿Son cuatro', o: 'o más?', texto: 'La triple recibe hasta seis personas, y para 4 a 8 hay departamentos con cocina, sala y dos recámaras. Si prefieren varios cuartos, desde 3 habitaciones hay tarifa de grupo.', boton: 'Cotizar para un grupo' },
    blog: { l: 'Antes de', o: 'subir a las Grutas', texto: 'Lo que conviene leer para armar el viaje.', tema: 'grutas-y-alrededores' },
    enlaces: [['Departamentos con cocina para 4 a 8 personas', '/departamentos'], ['Palapa techada para huéspedes', rutaPalapa], ['Preguntas frecuentes', '/preguntas-frecuentes']] as Enlace[],
  },
  // La página de la palapa: en Los Arcos es solo para huéspedes (no se renta para eventos ni se cotiza)
  celebraciones: {
    portada: { l: 'Palapa techada', o: 'en el jardín', texto: 'En el norte, la noche se arma alrededor del asador.' },
    cotizarBtn: 'Reservar por WhatsApp', verBtn: 'Ver la palapa techada', tarjeta: '',
    bloque: { l: 'Qué tiene', o: 'la palapa', texto: 'La palapa del Hotel Los Arcos Inn está en el jardín, techada y lista: llegan de pasear, prenden el carbón y la cena se hace entre todos, sin salir a buscar dónde.' },
    puntos: { l: 'Lo que hay', o: 'bajo la palapa' },
    alberca: null,
    tiposCab: { l: '', o: '', texto: '' },
    tipos: [],
    cotiza: { l: '', o: '', texto: '' },
    apartar: [],
    opciones: [], etiquetaOpc: '',
    invitados: { l: 'Para familias que', o: 'se hospedan juntas', texto: 'Cuando la familia ocupa varias habitaciones o un departamento, la palapa se vuelve su sala al aire libre. Los niños en el jardín, los grandes en la mesa.', enlace: 'Departamentos con cocina', href: '/departamentos' },
    reglasUso: { l: 'Reglas', o: 'de uso', texto: 'La palapa es solo para huéspedes; no se renta para eventos.' },
    blog: { l: 'Para planear', o: 'tu visita', texto: 'Dónde se queda la familia cuando viene a García.', tema: 'reuniones-en-familia' },
    enlaces: [['Departamentos con cocina para 4 a 8 personas', '/departamentos'], ['Habitaciones ' + TIPOS, '/habitaciones'], ['Cómo llegar al hotel', '/ubicacion']] as Enlace[],
    waBase: 'en el ',
  },
  ubicacion: {
    portada: { l: 'En el centro', o: 'de García', texto: 'Mariano Escobedo 105-A, a tres minutos de la plaza principal y a ' + D.grutas + ' minutos de las Grutas de García.' },
    intro: '',
    llegar: { l: 'En Mariano Escobedo\u00A0105\u2011A, entre Bernardo Reyes', o: 'y Morelos', texto: 'En pleno centro de García, a unos 38\u00A0km del centro de Monterrey y 25 de Cumbres. Al reservar te mandamos la ubicación por WhatsApp.' },
    extras: [],
    secciones: [
      { id: 'plaza', l: 'A 3 minutos', o: 'de la plaza', texto: 'Una caminata corta por Morelos te lleva frente a la capilla de San Elías y hasta la plaza, con el templo de San Juan Bautista y el Antiguo Parián. Buen plan para la tarde: sentarse en la plaza a ver pasar el pueblo antes de cenar.' },
      { id: 'xenpal', l: 'Xenpal', o: 'a ' + D.xenpal + ' minutos', texto: 'Ver animales de cerca suele ser el plan favorito de los niños, y está a solo ' + D.xenpal + ' minutos. Vayan en la mañana y regresen a comer al jardín.' },
      { id: 'grutas', l: 'Grutas de García y Los Faisanes', o: 'a ' + D.grutas + ' minutos', texto: 'La visita que no puede faltar. Las Grutas se descubrieron en 1843; se sube en teleférico o caminando por la vereda, y en el mismo camino está Los Faisanes. Con niños es un día completo, y de los que se recuerdan.' },
      { id: 'comer', l: 'Dónde comer cerca: Los Primos, Casco Antiguo', o: 'y La Mexicana',
        lista: [['Los Primos', 'cocina mexicana que abre temprano; para desayunar antes de salir a las Grutas. Lo más pedido es la arrachera.'], ['Casco Antiguo', 'taquería del centro, para una comida rápida.'], ['La Mexicana', 'cocina mexicana que cierra tarde, por si la familia regresa tarde de pasear.']] },
    ],
    ingles: { id: 'in-english', l: 'In', o: 'English', lang: 'en', texto: 'Hotel Los Arcos Inn is in downtown García, three minutes from the main square, 10 minutes from Xenpal and 15 from the García Caves. Rooms for up to six, two apartments with kitchen for up to eight, a garden, a pool and on-site parking. Check‑in 2\u00A0PM, check-out 11\u00A0AM. Book by WhatsApp: +52\u00A081\u00A02615\u00A05485.' },
    alLlegar: { l: 'Te esperan', o: 'al llegar', items: [['hoja', 'Jardín y alberca con chapoteadero'], ['asador', 'Palapa techada con asador para huéspedes'], ['auto', 'Estacionamiento dentro del hotel']] as [string, string][] },
    blog: { l: 'Paseos', o: 'a un paso', texto: 'Las Grutas y lo que hay sobre el mismo camino.', tema: 'grutas-y-alrededores' },
    enlaces: [['Guía de las Grutas de García', '/blog/grutas-de-garcia-horarios-y-precios'], ['Departamentos para una semana o más', '/departamentos'], ['Reserva directo', '/contacto']] as Enlace[],
  },
  contacto: {
    portada: { l: 'Aparta', o: 'tu lugar', texto: 'Escríbenos, llámanos o llena el formulario, y te confirmamos disponibilidad y precio.' },
    form: 'Solicitud de reserva', motivos: [['hospedaje', 'Descanso'], ['negocios', 'Trabajo'], ['otro', 'Otro']] as [string, string][],
    enlaces: [['Habitaciones ' + TIPOS, '/habitaciones'], ['Departamentos para una semana o más', '/departamentos'], ['Palapa techada para huéspedes', rutaPalapa]] as Enlace[],
  },
  noEncontrada: { l: 'Aquí no', o: 'hay nada', enlaces: [['Volver al inicio', '/'], ['Ver habitaciones desde ' + DESDE_IVA, '/habitaciones'], ['Palapa techada para huéspedes', rutaPalapa]] as Enlace[] },
  pie: { s: 'Nos vemos', o: 'en Los Arcos' },
  sigue: 'También te sirve',
};
export const T = esQA ? QA : LA;

// ── Preguntas frecuentes, por grupos (página /preguntas-frecuentes). Las secciones de preguntas de las demás
//    páginas toman de aquí las que les tocan, por su id. ──
const FAQ_QA: GrupoFaq[] = [
  { id: 'reservas', nombre: 'Reservas y pagos', items: [
    { id: 'apartar', q: '¿Cómo aparto?', a: 'Por WhatsApp, con el 50\u00A0% de anticipo (no reembolsable).' },
    { id: 'precio', q: '¿Cuánto cuesta una noche?', a: 'Desde ' + DESDE_IVA + ' por noche para una persona; el precio cambia con cada persona, hasta cuatro. Si te quedas más de tres días, el precio por noche baja.' },
    { id: 'cancelar', q: '¿Qué pasa si cancelo?', a: 'El anticipo no es reembolsable: si cancelas, no se devuelve.' },
    { id: 'directo', q: '¿Conviene reservar directo con el hotel?', a: 'Sí. Al reservar con nosotros no pagas comisiones de plataformas y te atendemos por WhatsApp.' },
    { id: 'factura', q: '¿Dan factura?', a: 'Sí, facturamos sin problema. Pídela al reservar o al llegar.' },
  ] },
  { id: 'habitaciones', nombre: 'Habitaciones', items: [
    { id: 'horarios', q: '¿A qué hora puedo llegar?', a: 'La entrada es a partir de las 2\u00A0PM y la salida a las 11\u00A0AM. Atendemos de 7\u00A0AM a 11\u00A0PM.' },
    { id: 'caben', q: '¿Cuántos caben por habitación?', a: 'Hasta cuatro personas. El precio cambia según cuántos sean.' },
    { id: 'incluye', q: '¿Qué trae cada habitación?', a: 'Vista a la sierra, aire acondicionado, televisión, frigobar, microondas y baño con agua caliente, toallas, shampoo y jabón.' },
    { id: 'camas', q: '¿Qué camas tienen las habitaciones?', a: 'Las nueve habitaciones son iguales, con dos camas queen.' },
    { id: 'grupo', q: '¿Hay descuento?', a: 'Sí. Si te quedas más de tres días, el precio por noche baja (por ejemplo, de $1,200 a $1,100\u00A0+\u00A0IVA). Para grupos de 3 habitaciones o más, el precio depende de cuántas personas y habitaciones son, y las empresas con grupos de más de tres personas tienen 2\u00A0% de descuento.' },
    { id: 'desayuno', q: '¿Hay desayuno o restaurante?', a: 'No. A dos cuadras, en el centro, hay dónde desayunar y cenar.' },
    { id: 'lavanderia', q: '¿Hay lavandería?', a: 'No tenemos lavandería, desayuno ni restaurante. A cambio, el centro de García está a dos cuadras.' },
    { id: 'traer', q: '¿Qué traigo?', a: 'Traje de baño, lo que quieras para el frigobar y, si vas a usar la palapa, la carne. La primera noche, la plaza está a dos cuadras para cenar; al día siguiente, sal temprano a las Grutas y regresa a la alberca en la tarde.' },
  ] },
  { id: 'alberca', nombre: 'Alberca', items: [
    { id: 'alberca-horario', q: '¿Hasta qué hora abre la alberca?', a: 'La alberca abre todos los días hasta las 10\u00A0PM.' },
    { id: 'alberca-ninos', q: '¿Hay alberca para niños?', a: 'Sí, hay chapoteadero junto a la alberca principal.' },
    { id: 'alberca-costo', q: '¿La alberca tiene costo extra?', a: 'No. Está incluida en tu estancia.' },
  ] },
  { id: 'palapa', nombre: 'La palapa', items: [
    { id: 'palapa-capacidad', q: '¿Cuántas personas caben en la palapa?', a: 'Hasta 60, junto a la alberca.' },
    { id: 'palapa-incluye', q: '¿Qué tiene la palapa?', a: 'Asador, bancos, televisión grande, refrigerador, microondas, abanicos y baños exteriores. Ustedes traen la comida; lo demás ya está aquí.' },
    { id: 'palapa-musica', q: '¿Se puede poner música?', a: 'Sí: la música alta se permite hasta las 8 de la noche. Después ya no se hace ruido, porque hay huéspedes descansando.' },
    { id: 'palapa-precio', q: '¿Cuánto cuesta rentar la palapa?', a: 'Depende de la fecha y del horario. Escríbenos por WhatsApp con el día y cuántas personas van y te mandamos la cotización.' },
    { id: 'palapa-hospedaje', q: '¿Mis invitados pueden quedarse a dormir?', a: 'Sí. Hay nueve habitaciones para hasta 4 personas cada una, desde ' + DESDE_IVA + ' por noche.' },
  ] },
  { id: 'reglas', nombre: 'Reglas', items: [
    { id: 'mascotas', q: '¿Puedo llevar a mi mascota?', a: 'No se admiten mascotas.' },
    { id: 'fumar', q: '¿Se puede fumar?', a: 'No se fuma dentro de las habitaciones.' },
    { id: 'edad', q: '¿Hay edad mínima para registrarse?', a: 'Sí: hay que ser mayor de 18 años y presentar identificación.' },
    { id: 'visitas', q: '¿Puedo recibir visitas?', a: 'Solo las personas registradas en la habitación pueden estar en las instalaciones.' },
  ] },
  { id: 'ubicacion', nombre: 'Ubicación', items: [
    { id: 'donde', q: '¿Dónde está el hotel?', a: 'En Bernardo Reyes esquina con Garza Ayala, Centro, García, Nuevo León, a dos cuadras de la plaza.' },
    { id: 'monterrey', q: '¿Qué tan lejos está de Monterrey?', a: 'Desde el centro de Monterrey son unos 38\u00A0km por la carretera a García; desde Cumbres, unos 25\u00A0km por la avenida Lincoln. En hora pico puede tomar cerca de una hora.' },
    { id: 'estacionamiento', q: '¿Hay estacionamiento?', a: 'Sí, dentro del hotel.' },
    { id: 'atencion', q: '¿En qué horario atienden?', a: 'Todos los días, de 7\u00A0AM a 11\u00A0PM, por WhatsApp y por teléfono.' },
    { id: 'grutas', q: '¿Qué tan cerca están las Grutas de García?', a: 'A unos ' + D.grutas + ' minutos en auto: son ' + D.grutasKm + ' km desde el centro de García.' },
  ] },
];
const FAQ_LA: GrupoFaq[] = [
  { id: 'reservas', nombre: 'Reservas y pagos', items: [
    { id: 'apartar', q: '¿Cómo reservo?', a: 'Por WhatsApp al ' + TEL_TXT + ', con el 50\u00A0% de anticipo (no reembolsable).' },
    { id: 'precio', q: '¿Desde cuánto cuesta hospedarse?', a: 'Desde ' + DESDE_IVA + ' por noche; el departamento, desde ' + precioDe('depa') + ' + IVA. El total depende de cuántas personas se quedan.' },
    { id: 'cancelar', q: '¿El anticipo se devuelve si cancelo?', a: 'No. El anticipo no es reembolsable.' },
    { id: 'pago', q: '¿Qué formas de pago aceptan?', a: 'Efectivo y tarjeta.' },
    { id: 'factura', q: '¿Facturan?', a: 'Sí. Dinos al reservar que necesitas factura y la preparamos.' },
  ] },
  { id: 'habitaciones', nombre: 'Habitaciones y departamentos', items: [
    { id: 'horarios', q: '¿A qué hora puedo llegar?', a: 'La entrada es a partir de las 2\u00A0PM y la salida a las 11\u00A0AM.' },
    { id: 'caben', q: '¿Cuántos caben?', a: 'De una a seis personas por habitación, y hasta ocho en un departamento.' },
    { id: 'incluye', q: '¿Qué tienen las habitaciones?', a: 'La sencilla: cama queen, aire acondicionado, televisión, frigobar, microondas y baño. La triple, en la planta alta: tres camas queen (una con sofá cama), aire acondicionado, televisión, microondas y baño. El departamento: cuatro camas, cocina, sala, comedor y baño.' },
    { id: 'depa', q: '¿Cómo son los departamentos?', a: 'Tienen cuatro camas en dos recámaras, cocina, sala, comedor y baño, para 4 a 8 personas, y están dentro del mismo hotel.' },
    { id: 'depa-semana', q: '¿Me puedo quedar una semana o más?', a: 'Sí. Escríbenos con tus fechas y te damos el total de tu estancia.' },
    { id: 'depa-contrato', q: '¿Hay que firmar contrato o dejar aval?', a: 'No es una renta de casa: es hospedaje dentro del hotel. Al cotizar te explicamos cómo se aparta.' },
    { id: 'grupo', q: '¿Tienen precio para grupos?', a: 'Sí, cuando reservan 3 habitaciones o más.' },
    { id: 'traer', q: '¿Qué traigo?', a: 'Traje de baño, la carne si quieren cenar en la palapa y, si vienen en departamento, lo del súper para la cocina.' },
  ] },
  { id: 'alberca', nombre: 'Alberca y jardín', items: [
    { id: 'alberca-horario', q: '¿Qué horario tiene la alberca?', a: 'La alberca y el chapoteadero están abiertos todos los días hasta las 10\u00A0PM.' },
    { id: 'alberca-ninos', q: '¿Los niños tienen dónde nadar?', a: 'Sí: hay chapoteadero, y la alberca tiene una cascada de piedra, en medio del jardín.' },
    { id: 'alberca-costo', q: '¿Se paga aparte por la alberca?', a: 'No. Es parte de tu hospedaje.' },
  ] },
  { id: 'palapa', nombre: 'La palapa techada', items: [
    { id: 'palapa-eventos', q: '¿Hacen eventos?', a: 'No. La palapa es solo para los huéspedes.' },
    { id: 'palapa-incluye', q: '¿Qué tiene la palapa?', a: 'Techo completo, asador y parrilla de gas, lavabo, televisión y mesa de jardín con sillas.' },
    { id: 'palapa-familia', q: '¿La podemos usar si venimos en varias habitaciones?', a: 'Sí. Cuando la familia ocupa varias habitaciones o un departamento, la palapa se vuelve su sala al aire libre.' },
  ] },
  { id: 'reglas', nombre: 'Reglas', items: [
    { id: 'mascotas', q: '¿Puedo llevar a mi mascota?', a: 'No se admiten mascotas.' },
    { id: 'edad', q: '¿Quién puede registrarse?', a: 'Personas mayores de 18 años, con identificación.' },
    { id: 'fumar', q: '¿Se puede fumar?', a: 'No se fuma dentro de las habitaciones.' },
    { id: 'visitas', q: '¿Puedo recibir visitas?', a: 'Solo las personas registradas en la habitación pueden estar en las instalaciones.' },
  ] },
  { id: 'ubicacion', nombre: 'Ubicación', items: [
    { id: 'donde', q: '¿Cuál es la dirección?', a: 'Mariano Escobedo 105-A, entre Bernardo Reyes y Morelos, Centro, García, Nuevo León.' },
    { id: 'grutas', q: '¿Qué tan lejos están las Grutas?', a: 'Unos ' + D.grutas + ' minutos en carro; Xenpal, unos ' + D.xenpal + '.' },
    { id: 'monterrey', q: '¿Cuánto se hace desde Monterrey?', a: 'Desde el centro de Monterrey son unos 38\u00A0km; desde Cumbres, unos 25. Al reservar te mandamos la ubicación por WhatsApp.' },
    { id: 'estacionamiento', q: '¿Hay estacionamiento?', a: 'Sí, dentro del hotel.' },
    { id: 'atencion', q: '¿A qué hora puedo llamar o escribir?', a: 'De 7\u00A0AM a 11\u00A0PM, todos los días.' },
  ] },
];
export const FAQ: GrupoFaq[] = esQA ? FAQ_QA : FAQ_LA;
export const pregunta = (id: string): Pregunta => FAQ.flatMap((g) => g.items).find((p) => p.id === id)!;

// Qué preguntas enseña cada página en su sección de preguntas. Regla de la auditoría SEO del 13 de noviembre de
// 2026: propias de esa página; ninguna sale en dos. La lista completa vive solo en /preguntas-frecuentes
// (scripts/seo.mjs comprueba que no se repitan). Las del inicio son las del documento de cambios del 17 de noviembre.
export const FAQ_DE: Record<string, string[]> = esQA
  ? { inicio: ['horarios', 'caben', 'estacionamiento', 'mascotas', 'desayuno', 'apartar', 'traer'], habitaciones: ['incluye', 'camas', 'grupo', 'lavanderia'], celebraciones: ['palapa-capacidad', 'palapa-incluye', 'palapa-musica', 'palapa-precio', 'palapa-hospedaje'], contacto: ['cancelar', 'directo', 'atencion', 'factura'] }
  : { inicio: ['horarios', 'caben', 'estacionamiento', 'mascotas', 'palapa-eventos', 'grutas', 'traer', 'apartar'], habitaciones: ['incluye', 'precio', 'alberca-ninos', 'visitas'], departamentos: ['depa', 'depa-semana', 'depa-contrato'], empresas: ['factura', 'pago', 'grupo'], celebraciones: ['palapa-incluye', 'palapa-familia', 'alberca-horario'], contacto: ['cancelar', 'atencion', 'donde'] };
export const FAQ_TIT: Record<string, Cab> = {
  habitaciones: { l: 'Preguntas sobre', o: 'las habitaciones' },
  celebraciones: esQA ? { l: 'Preguntas sobre', o: 'la palapa' } : { l: 'Preguntas sobre', o: 'la palapa techada' },
  contacto: { l: 'Antes de', o: 'escribirnos' },
  departamentos: { l: 'Preguntas sobre', o: 'el departamento' },
  empresas: { l: 'Preguntas', o: 'de empresas' },
};
