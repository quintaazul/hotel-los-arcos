// Los textos de cada sitio. Cada hotel tiene los suyos: mismas piezas, palabras distintas.
// Reglas del plan SEO (documento «Rediseño web…», 10 de noviembre de 2026):
//   · título de hasta 60 caracteres, descripción de 120 a 160 y un solo H1 por página, con el texto del plan;
//   · cada búsqueda tiene un solo dueño. Quinta Azul dice «palapa para fiestas» (cumpleaños, carne asada, posadas,
//     fin de año, fiesta con alberca). Los Arcos dice «palapa techada» (bautizos, primeras comuniones, reuniones
//     familiares, convivios de empresa, jardín). En títulos, encabezados y enlaces nunca se cruzan;
//   · los enlaces dicen a dónde llevan («Ver habitaciones desde $900»), nunca «Ver» o «Más».
// Solo datos confirmados: lo que no se sabe (precio de la palapa, tarifa por semana) se manda a cotizar por WhatsApp.
import { H, dinero } from './hoteles';

// Precios y teléfono se escriben UNA sola vez, en hoteles.ts. Aquí salen de ahí: al cambiar un precio cambian solos
// los títulos, las descripciones, los enlaces y las preguntas que lo mencionan. No escribir «$900» a mano en un texto.
// (Los artículos del blog sí llevan el número escrito: scripts/seo.mjs avisa si alguno se queda con un precio viejo.)
/** Precio de un tipo de habitación, ya con formato: precioDe('doble') → «$1,300» */
export const precioDe = (id: string) => dinero(H.habs.find((x) => x.id === id)?.precio ?? 0);
/** El precio más bajo del hotel, para los «desde $…» */
export const DESDE = dinero(Math.min(...H.habs.map((x) => x.precio ?? Infinity)));

export type Seo = { title: string; description: string; h1: string };
type Cab = { l: string; o: string; texto?: string };
type MapaTxt = { titulo: string; filas: [string, string][]; enlace?: string };
type Enlace = [string, string];   // texto del enlace, dirección
export type Pregunta = { id: string; q: string; a: string };
export type GrupoFaq = { id: string; nombre: string; items: Pregunta[] };

const esQA = H.id === 'qa';
// Distancias y tipos de habitación salen de los datos del hotel (hoteles.ts): aquí no se escriben a mano.
const D = H.dist;
const PLURAL: Record<string, string> = { sencilla: 'sencillas', doble: 'dobles', triple: 'triples' };
const junta = (l: string[], y: string) => (l.length > 1 ? l.slice(0, -1).join(', ') + ' ' + y + ' ' + l[l.length - 1] : l[0] ?? '');
const tipos = H.habs.map((x) => PLURAL[x.id]).filter(Boolean);
export const TIPOS = junta(tipos, 'y');     // «sencillas, dobles y triples»: los tipos que de verdad se venden
export const TIPOS_O = junta(tipos, 'o');

// ── Título, descripción y H1 de cada página ──
const SEO_QA = {
  inicio: { title: 'Hotel con alberca en García, Nuevo León | Quinta Azul', description: 'Hotel con alberca en el centro de García, N.L. Habitaciones desde ' + DESDE + ' la noche, palapa para fiestas y estacionamiento gratis. Reserva por WhatsApp.', h1: 'Hotel con alberca en García, Nuevo León' },
  habitaciones: { title: 'Habitaciones en García, N.L. desde ' + DESDE + ' | Quinta Azul', description: 'Habitación sencilla desde ' + DESDE + ' y doble desde ' + precioDe('doble') + ' la noche en García, N.L. Dos camas queen, A/C, WiFi, frigobar y alberca hasta las 10 PM.', h1: 'Habitaciones en García, N.L., con precio por noche' },
  celebraciones: { title: 'Renta de palapa para fiestas en García, N.L. | Quinta Azul', description: 'Palapa junto a la alberca para fiestas de hasta 60 personas en García, N.L., con asador, barra y baños. Cotiza tu fecha por WhatsApp.', h1: 'Renta de palapa para fiestas en García, N.L.' },
  ubicacion: { title: 'Cómo llegar a García desde Monterrey | Hotel Quinta Azul', description: 'Dirección del Hotel Quinta Azul en el centro de García, N.L., rutas desde Monterrey y el aeropuerto, tiempos en auto y estacionamiento gratis.', h1: 'Cómo llegar al Hotel Quinta Azul en García' },
  contacto: { title: 'Reserva por WhatsApp | Hotel Quinta Azul, García, N.L.', description: 'Reserva en Hotel Quinta Azul por WhatsApp o al ' + H.tel + ', o envía el formulario. Te respondemos todos los días de 7 AM a 11 PM.', h1: 'Reservaciones en Hotel Quinta Azul' },
  faq: { title: 'Preguntas frecuentes | Hotel Quinta Azul, García, N.L.', description: 'Respuestas sobre reservas, anticipo, habitaciones, alberca, renta de la palapa, reglas y cómo llegar al Hotel Quinta Azul en García, N.L.', h1: 'Preguntas frecuentes del Hotel Quinta Azul' },
  aviso: { title: 'Aviso de privacidad | Hotel Quinta Azul', description: 'Aviso de privacidad del Hotel Quinta Azul: qué datos pedimos al reservar, para qué los usamos, con quién se comparten y cómo ejercer tus derechos ARCO.', h1: 'Aviso de privacidad' },
  politicas: { title: 'Políticas de reservación | Hotel Quinta Azul', description: 'Políticas de reservación del Hotel Quinta Azul, en García, N.L.: anticipo, cancelaciones, horarios de entrada y salida, alberca, palapa y reglas.', h1: 'Políticas de reservación y estancia' },
  terminos: { title: 'Términos y condiciones | Hotel Quinta Azul', description: 'Términos y condiciones de uso del sitio del Hotel Quinta Azul, en García, N.L.: información, precios, solicitudes de reserva, enlaces externos y contacto.', h1: 'Términos y condiciones del sitio' },
  noEncontrada: { title: 'Página no encontrada | Hotel Quinta Azul', description: 'Esta página no existe. Vuelve al inicio del Hotel Quinta Azul, mira las habitaciones desde ' + DESDE + ' o la palapa para fiestas, o escríbenos por WhatsApp.', h1: 'Error 404' },
};
const SEO_LA = {
  inicio: { title: 'Hotel cerca de las Grutas de García, N.L. | Los Arcos Inn', description: 'Hotel familiar en el centro de García, N.L., a ' + D.grutasKm + ' km de las Grutas. Habitaciones desde ' + DESDE + ', departamentos con cocina, alberca con chapoteadero y jardín.', h1: 'Hotel y departamentos cerca de las Grutas de García' },
  habitaciones: { title: 'Habitaciones para familias en García, N.L. | Los Arcos Inn', description: 'Habitaciones ' + TIPOS + ' en el centro de García desde ' + DESDE + ' la noche, con alberca, chapoteadero, jardín, WiFi y factura.', h1: 'Habitaciones en García para 1 a 3 personas' },
  departamentos: { title: 'Departamento por día, semana o mes en García | Los Arcos Inn', description: 'Departamento amueblado con 2 recámaras y cocina en García, N.L., para 4 a 8 personas. Se renta por día, semana o mes, con factura si la necesitas.', h1: 'Departamento amueblado con cocina en García, por día, semana o mes' },
  empresas: { title: 'Hospedaje para trabajadores en García, N.L. | Los Arcos Inn', description: 'Hospedaje con factura para equipos de trabajo en García, N.L.: habitaciones por noche y departamentos por semana o mes, con estacionamiento y WiFi.', h1: 'Hospedaje para trabajadores y empresas en García' },
  celebraciones: { title: 'Jardín con palapa para bautizos en García | Los Arcos Inn', description: 'Jardín con palapa techada para bautizos, primeras comuniones y reuniones familiares de hasta 60 personas en García, N.L. Aparta tu fecha.', h1: 'Jardín con palapa techada para bautizos y reuniones familiares en García' },
  ubicacion: { title: 'Ubicación en el centro de García, N.L. | Los Arcos Inn', description: 'Dirección de Los Arcos Inn en el centro de García, N.L., rutas desde Monterrey y el aeropuerto, y distancias del hotel a las Grutas y a Xenpal.', h1: 'Dónde está Los Arcos Inn en el centro de García' },
  contacto: { title: 'Reserva por WhatsApp | Hotel Los Arcos Inn, García', description: 'Reserva en Hotel Los Arcos Inn por WhatsApp o al ' + H.tel + ', o envía el formulario. Te respondemos todos los días de 7 AM a 11 PM.', h1: 'Reservaciones en Hotel Los Arcos Inn' },
  faq: { title: 'Preguntas frecuentes | Hotel Los Arcos Inn, García', description: 'Respuestas sobre reservas, anticipo, habitaciones, departamentos, alberca, palapa techada, reglas y cómo llegar a Los Arcos Inn en García.', h1: 'Preguntas frecuentes de Los Arcos Inn' },
  aviso: { title: 'Aviso de privacidad | Hotel Los Arcos Inn', description: 'Aviso de privacidad del Hotel Los Arcos Inn: qué datos pedimos al reservar, para qué los usamos, con quién se comparten y cómo ejercer tus derechos ARCO.', h1: 'Aviso de privacidad' },
  politicas: { title: 'Políticas de reservación | Hotel Los Arcos Inn', description: 'Políticas de reservación del Hotel Los Arcos Inn, en García, N.L.: anticipo, cancelaciones, horarios, formas de pago, alberca, palapa techada y reglas.', h1: 'Políticas de reservación y estancia' },
  terminos: { title: 'Términos y condiciones | Hotel Los Arcos Inn', description: 'Términos y condiciones de uso del sitio del Hotel Los Arcos Inn, en García, N.L.: información, precios, solicitudes de reserva, enlaces y contacto.', h1: 'Términos y condiciones del sitio' },
  noEncontrada: { title: 'Página no encontrada | Hotel Los Arcos Inn', description: 'Esta página no existe. Vuelve al inicio del Hotel Los Arcos Inn, mira las habitaciones y los departamentos con cocina, o escríbenos por WhatsApp.', h1: 'Error 404' },
};
export const SEO: Record<string, Seo> = esQA ? SEO_QA : SEO_LA;

// ── Textos de las secciones ──
const QA = {
  palapa: 'palapa para fiestas',
  inicio: {
    cinta: ['Alberca hasta las 10 PM', 'Palapa para fiestas de 60 personas', 'Estacionamiento gratis', 'A ' + D.monterrey + ' minutos de Monterrey', 'Reserva directo por WhatsApp'],
    habs: { l: 'Elige dónde', o: 'descansar', texto: 'Una misma habitación con dos tarifas, según cuántos se hospedan: sencilla para una persona y doble para dos. Todas con dos camas queen, aire acondicionado, pantalla, frigobar, microondas y WiFi.' },
    comparar: { l: 'Compáralas', o: 'de un vistazo', texto: '¿Cuántos son? Te marcamos la que más te conviene.' },
    directo: { t: 'Por qué reservar directo', razones: [['mano', 'Tratas con el hotel', 'Sin plataformas de por medio ni sus comisiones.'], ['wa', 'Respuesta por WhatsApp', 'Todos los días, de 7 AM a 11 PM.'], ['factura', 'Facturamos sin problema', 'Pide tu factura al reservar o al llegar.']] as [string, string, string][] },
    incluido: { l: 'Incluido en', o: 'tu estancia', texto: 'Sin costo extra y sin letras chiquitas. Lo que vas a usar desde que llegas.' },
    resenas: { l: 'Opiniones de huéspedes', o: 'en Google' },
    blog: { mini: 'Del blog', l: 'Planes', o: 'cerca del hotel', texto: 'Planes a pocos minutos del hotel, ideas para tu fiesta en la palapa y escapadas de fin de semana.' },
    faq: { l: 'Preguntas', o: 'frecuentes' },
    verHabs: 'Ver habitaciones desde ' + DESDE,
  },
  palapaBloque: { cotizar: 'Cotizar mi fiesta', ver: 'Renta de palapa para fiestas', waMsg: 'quiero cotizar una fiesta en la palapa' },
  mapa: {
    completo: { titulo: 'Dirección y mapa', filas: [['Desde Monterrey', '≈ ' + D.monterrey + ' min'], ['A las Grutas de García', '≈ ' + D.grutas + ' min'], ['A Xenpal', '≈ ' + D.xenpal + ' min'], ['A la plaza principal', '2–3 min']] },
    inicio: { titulo: 'Cómo llegar desde Monterrey', filas: [['Desde Monterrey', '≈ ' + D.monterrey + ' min'], ['Atención', '7\u00A0AM a 11\u00A0PM']], enlace: 'La ruta paso a paso' },
    contacto: { titulo: 'Datos del hotel', filas: [['Atención', 'Todos los días, 7\u00A0AM\u00A0a\u00A011\u00A0PM'], ['Estacionamiento', 'Dentro del hotel, sin costo']], enlace: 'Cómo llegar al hotel' },
  } as Record<'completo' | 'inicio' | 'contacto', MapaTxt>,
  habitaciones: {
    portada: { l: 'Habitaciones', o: 'desde ' + DESDE, texto: 'Aire acondicionado, pantalla, frigobar, microondas y WiFi en todas. Precio por noche, sin IVA.' },
    lista: { l: 'Elige tu', o: 'habitación' },
    galeria: { l: 'Míralas', o: 'por dentro', texto: 'Fotos tomadas en el hotel. Toca cualquiera para verla en grande.' },
    reglas: { l: 'Antes de', o: 'reservar', texto: 'Lo que conviene saber de una vez: horarios, anticipo y lo que ya viene incluido en cualquier habitación.' },
    grupos: { l: '¿Vienen en grupo', o: 'a García?', texto: 'Familias grandes, equipos de trabajo o amigos: desde 3 habitaciones hay tarifa de grupo.' },
    blog: { l: 'Para planear', o: 'tu visita', texto: 'Dos lecturas cortas antes de venir.' },
    enlaces: [['Renta de palapa para fiestas', '/celebraciones'], ['Todas las preguntas frecuentes', '/preguntas-frecuentes'], ['Cómo llegar al hotel', '/ubicacion']] as Enlace[],
  },
  celebraciones: {
    portada: { l: 'Palapa para', o: 'tu fiesta', texto: 'Hasta 60 personas junto a la alberca: cumpleaños, carne asada, posadas y fin de año.' },
    cotizarBtn: 'Cotizar mi fiesta', verBtn: 'Ver la palapa', tarjeta: 'Se aparta por fecha. Cotízala por WhatsApp.',
    bloque: { l: 'Qué incluye', o: 'la palapa', texto: 'Techada y a un paso de la alberca. El hotel pone el espacio, el asador de carbón, la barra con bancos, el refrigerador y los baños; tú traes la comida, el carbón y la música.' },
    puntos: { l: 'La palapa,', o: 'punto por punto' },
    tiposCab: { l: 'Qué puedes', o: 'celebrar aquí', texto: 'Elige tu fiesta y te abrimos WhatsApp con el mensaje listo para cotizar.' },
    tipos: [['Cumpleaños', 'Asador listo, espacio abierto y la alberca a un paso.', 'un cumpleaños'], ['Carne asada', 'Asador de carbón, barra con bancos y refrigerador para la carne.', 'una carne asada'], ['Posadas', 'Piñata, ponche y cena bajo techo, en diciembre.', 'una posada'], ['Fin de año', 'Recibe el año con los tuyos, sin manejar de regreso.', 'una fiesta de fin de año']] as [string, string, string][],
    cotiza: { l: 'Cotiza', o: 'tu fiesta', texto: 'Te respondemos por WhatsApp de 7 AM a 11 PM. Así se aparta la palapa:' },
    apartar: [['Escríbenos', 'con la fecha, cuántos son y qué celebran.'], ['Aparta la fecha', 'con el 50 % de anticipo.'], ['Llega y celebra:', 'tú traes la comida, el carbón y la música.']] as [string, string][],
    opciones: ['Cumpleaños', 'Carne asada', 'Posada', 'Fin de año', 'Otra fiesta'], etiquetaOpc: 'Qué celebran',
    invitados: { l: 'Que nadie maneje', o: 'de regreso', texto: 'Tus invitados pueden quedarse a dormir: hay habitaciones desde ' + DESDE + ' la noche y tarifa de grupo a partir de 3 habitaciones.', enlace: 'Habitaciones para tus invitados', href: '/hospedaje' },
    blog: { l: 'Ideas para', o: 'tu fiesta', texto: 'Cómo organizarla, qué llevar y cómo apartar la palapa.', tema: 'fiestas-en-la-palapa' },
    enlaces: [['Habitaciones para tus invitados', '/hospedaje'], ['Cómo organizar una posada en palapa', '/blog/posada-navidena-en-palapa'], ['Cómo llegar al hotel', '/ubicacion']] as Enlace[],
    waBase: 'en la palapa para fiestas del ',
  },
  ubicacion: {
    portada: { l: 'A ' + D.monterrey + ' minutos', o: 'de Monterrey', texto: 'Bernardo Reyes esquina con Garza Ayala, en el centro de García. Llegas, estacionas adentro y la alberca te espera.' },
    llegar: { l: 'Cómo llegar', o: 'desde Monterrey' },
    extras: [
      { titulo: 'Desde el aeropuerto de Monterrey', texto: 'Son unos 55 km, cerca de una hora en auto por la autopista de cuota (NL 100). Sin cuota, calcula entre 60 y 70 minutos.' },
      { titulo: 'Qué hay cerca del hotel', texto: 'La plaza principal está a unas cuadras: 2 o 3 minutos en auto. Xenpal queda a ' + D.xenpal + ' minutos y las Grutas de García a unos ' + D.grutas + ' (' + D.grutasKm + ' km), las dos por el mismo camino.' },
    ],
    alLlegar: { l: 'Lo que encuentras', o: 'al llegar', items: [['alberca', 'Alberca abierta hasta las 10 PM, con chapoteadero'], ['fiesta', 'Palapa para fiestas de hasta 60 personas'], ['auto', 'Estacionamiento dentro del hotel, sin costo']] as [string, string][] },
    blog: { l: 'Qué hay', o: 'cerca', texto: 'Planes a pocos minutos, con sus distancias desde el hotel.', tema: ['planes-en-garcia', 'escapadas'] },
    enlaces: [['Habitaciones desde ' + DESDE, '/hospedaje'], ['Qué hacer en García', '/blog/que-hacer-en-garcia'], ['Reserva directo', '/contacto']] as Enlace[],
  },
  contacto: {
    portada: { l: 'Reserva', o: 'directo', texto: 'Por WhatsApp, por teléfono o con el formulario. Sin comisiones de plataformas.' },
    form: 'Formulario de reserva', motivos: [['hospedaje', 'Descanso'], ['celebracion', 'Fiesta en la palapa'], ['negocios', 'Trabajo'], ['otro', 'Otro']] as [string, string][],
    enlaces: [['Ver habitaciones desde ' + DESDE, '/hospedaje'], ['Renta de palapa para fiestas', '/celebraciones'], ['Todas las preguntas frecuentes', '/preguntas-frecuentes']] as Enlace[],
  },
  noEncontrada: { l: 'Esta página', o: 'se nos escapó', enlaces: [['Volver al inicio', '/'], ['Ver habitaciones desde ' + DESDE, '/hospedaje'], ['Renta de palapa para fiestas', '/celebraciones']] as Enlace[] },
  pie: { s: 'Te esperamos', o: 'en García' },
  sigue: 'Sigue por aquí',
};
const LA: typeof QA = {
  palapa: 'palapa techada',
  inicio: {
    cinta: ['Alberca con chapoteadero', 'Departamentos con cocina', 'Palapa techada en el jardín', 'A ' + D.grutas + ' minutos de las Grutas', 'Aparta por WhatsApp'],
    habs: { l: 'Habitación o', o: 'departamento', texto: 'Cuartos para una o dos noches y departamentos con cocina para quedarse más. Todos con aire acondicionado, pantalla y WiFi.' },
    comparar: { l: '¿Cuántos', o: 'viajan?', texto: 'Dinos cuántos son y te señalamos la opción que mejor les queda.' },
    directo: { t: 'Por qué apartar con el hotel', razones: [['mano', 'Sin intermediarios', 'Apartas con nosotros y no pagas comisiones de plataformas.'], ['tel', 'Te contestamos nosotros', 'Por WhatsApp o por teléfono, de 7 AM a 11 PM.'], ['factura', 'Con factura', 'Dinos al apartar que la necesitas y la preparamos.']] as [string, string, string][] },
    incluido: { l: 'Lo que ya', o: 'viene incluido', texto: 'Nada de esto se cobra aparte: es parte de hospedarte aquí.' },
    resenas: { l: 'Lo que dicen', o: 'nuestros huéspedes' },
    blog: { mini: 'Del blog', l: 'Guía de', o: 'las Grutas', texto: 'Horarios y precios de las Grutas, paseos para ir con niños y consejos para estancias de semanas.' },
    faq: { l: 'Dudas', o: 'frecuentes' },
    verHabs: 'Habitaciones ' + TIPOS,
  },
  palapaBloque: { cotizar: 'Cotizar mi reunión', ver: 'Palapa techada para reuniones', waMsg: 'quiero cotizar una reunión en la palapa techada' },
  mapa: {
    completo: { titulo: 'Dirección y mapa', filas: [['A las Grutas de García', '≈ ' + D.grutas + ' min'], ['A Xenpal', '≈ ' + D.xenpal + ' min'], ['A la plaza principal', 'A pie'], ['Desde Monterrey', '≈ ' + D.monterrey + ' min']] },
    inicio: { titulo: 'Cómo llegar desde Monterrey', filas: [['Desde Monterrey', '≈ ' + D.monterrey + ' min'], ['A las Grutas de García', '≈ ' + D.grutas + ' min']], enlace: 'La ruta paso a paso' },
    contacto: { titulo: 'Datos del hotel', filas: [['Atención', 'Todos los días, 7\u00A0AM\u00A0a\u00A011\u00A0PM'], ['Estacionamiento', 'Privado, sin costo']], enlace: 'Cómo llegar al hotel' },
  } as Record<'completo' | 'inicio' | 'contacto', MapaTxt>,
  habitaciones: {
    portada: { l: 'Cuartos', o: 'desde ' + DESDE, texto: 'En el centro de García, con alberca, chapoteadero y jardín. Si son cuatro o más, pregunta por los departamentos con cocina.' },
    lista: { l: 'Elige tu', o: 'cuarto' },
    galeria: { l: 'Así son', o: 'por dentro', texto: 'Todas las fotos se tomaron en el hotel. Tócalas para ampliarlas.' },
    reglas: { l: 'Horarios', o: 'y reglas', texto: 'Entrada, salida, anticipo y formas de pago, para que llegues sin dudas.' },
    grupos: { l: '¿Son cuatro', o: 'o más?', texto: 'Para 4 a 8 personas hay departamentos con cocina, sala y dos recámaras. Y si prefieren cuartos, desde 3 habitaciones hay tarifa de grupo.' },
    blog: { l: 'Antes de', o: 'subir a las Grutas', texto: 'Lo que conviene leer para armar el viaje.' },
    enlaces: [['Departamentos con cocina para 4 a 8 personas', '/departamentos'], ['Palapa techada para reuniones', '/celebraciones'], ['Preguntas frecuentes', '/preguntas-frecuentes']] as Enlace[],
  },
  celebraciones: {
    portada: { l: 'Palapa techada', o: 'en el jardín', texto: 'Hasta 60 personas rodeadas de jardín: bautizos, primeras comuniones y reuniones familiares.' },
    cotizarBtn: 'Cotizar mi reunión', verBtn: 'Ver la palapa techada', tarjeta: 'Se reserva por fecha. Pide tu cotización por WhatsApp.',
    bloque: { l: 'Qué incluyen', o: 'el jardín y la palapa', texto: 'La palapa es techada y está rodeada de jardín. Tiene asador de ladrillo, parrilla de gas, lavabo, mesa con sillas, pantalla y abanicos de techo; ustedes ponen la comida y la música.' },
    puntos: { l: 'Lo que hay', o: 'bajo la palapa' },
    tiposCab: { l: 'Reuniones que', o: 'recibimos', texto: 'Toca la tuya y se abre WhatsApp con el mensaje ya escrito.' },
    tipos: [['Bautizos', 'Un lugar tranquilo para festejar después de la ceremonia.', 'un bautizo'], ['Primeras comuniones', 'Jardín para los niños y sombra para los abuelos.', 'una primera comunión'], ['Reuniones familiares', 'Toda la familia junta, con dónde quedarse a dormir.', 'una reunión familiar'], ['Convivios de empresa', 'Cierre de proyecto o fin de año con tu equipo.', 'un convivio de empresa']] as [string, string, string][],
    cotiza: { l: 'Aparta', o: 'tu fecha', texto: 'Escríbenos de 7 AM a 11 PM. La palapa techada se reserva así:' },
    apartar: [['Cuéntanos', 'qué día, cuántas personas y qué van a festejar.'], ['Asegura el día', 'con un anticipo del 50 %.'], ['Disfruta:', 'ustedes ponen la comida y la música; el jardín ya está.']] as [string, string][],
    opciones: ['Bautizo', 'Primera comunión', 'Reunión familiar', 'Convivio de empresa', 'Otra reunión'], etiquetaOpc: 'Qué festejan',
    invitados: { l: 'Tu familia', o: 'se queda aquí', texto: 'Los que vienen de fuera duermen en el mismo hotel: en habitaciones ' + TIPOS_O + ', o en un departamento con cocina para 4 a 8 personas.', enlace: 'Departamentos para tus familiares', href: '/departamentos' },
    blog: { l: 'Para organizar', o: 'tu reunión', texto: 'Qué incluye la palapa techada y cómo acomodar a todos.', tema: 'reuniones-en-familia' },
    enlaces: [['Departamentos para tus familiares', '/departamentos'], ['Convivios para empresas', '/empresas'], ['Habitaciones ' + TIPOS, '/habitaciones']] as Enlace[],
    waBase: 'en la palapa techada del ',
  },
  ubicacion: {
    portada: { l: 'En el centro', o: 'de García', texto: 'Mariano Escobedo 105-A, a unas cuadras de la plaza principal y a ' + D.grutas + ' minutos de las Grutas de García.' },
    llegar: { l: 'La ruta', o: 'paso a paso' },
    extras: [
      { titulo: 'Del hotel a las Grutas de García', texto: 'Toma el Camino a Grutas de García: son ' + D.grutasKm + ' km, unos ' + D.grutas + ' minutos en auto. En el kilómetro 18 pasas por Xenpal, a ' + D.xenpal + ' minutos del hotel. Las Grutas abren de martes a domingo; llega antes de las 15:00.' },
      { titulo: 'Del aeropuerto de Monterrey al hotel', texto: 'Calcula unos 55 km: cerca de una hora por la autopista de cuota (NL 100) y entre 60 y 70 minutos por la vía libre.' },
    ],
    alLlegar: { l: 'Te esperan', o: 'al llegar', items: [['hoja', 'Jardín y alberca con chapoteadero'], ['gente', 'Palapa techada para hasta 60 personas'], ['auto', 'Estacionamiento privado, sin costo']] as [string, string][] },
    blog: { l: 'Paseos', o: 'a un paso', texto: 'Las Grutas y lo que hay sobre el mismo camino.', tema: 'grutas-y-alrededores' },
    enlaces: [['Guía de las Grutas de García', '/blog/grutas-de-garcia-horarios-y-precios'], ['Departamentos por semana', '/departamentos'], ['Reserva directo', '/contacto']] as Enlace[],
  },
  contacto: {
    portada: { l: 'Aparta', o: 'tu lugar', texto: 'Escríbenos, llámanos o llena el formulario, y te confirmamos disponibilidad y precio.' },
    form: 'Solicitud de reserva', motivos: [['hospedaje', 'Descanso'], ['celebracion', 'Reunión en la palapa'], ['negocios', 'Trabajo'], ['otro', 'Otro']] as [string, string][],
    enlaces: [['Habitaciones ' + TIPOS, '/habitaciones'], ['Departamentos por semana o mes', '/departamentos'], ['Palapa techada para reuniones', '/celebraciones']] as Enlace[],
  },
  noEncontrada: { l: 'Aquí no', o: 'hay nada', enlaces: [['Volver al inicio', '/'], ['Ver habitaciones desde ' + DESDE, '/habitaciones'], ['Palapa techada para reuniones', '/celebraciones']] as Enlace[] },
  pie: { s: 'Nos vemos', o: 'en Los Arcos' },
  sigue: 'También te sirve',
};
export const T = esQA ? QA : LA;

// ── Preguntas frecuentes, por grupos (página /preguntas-frecuentes). Las secciones de preguntas de las demás
//    páginas toman de aquí las que les tocan, por su id. ──
const FAQ_QA: GrupoFaq[] = [
  { id: 'reservas', nombre: 'Reservas y pagos', items: [
    { id: 'precio', q: '¿Cuánto cuesta una noche?', a: 'La habitación sencilla cuesta ' + DESDE + ' y la doble ' + precioDe('doble') + ' por noche, sin IVA. Hay mejor precio si reservas con tiempo o si son 3 habitaciones o más, y descuento con credencial para adultos mayores, militares y servidores públicos.' },
    { id: 'apartar', q: '¿Cómo aparto mi habitación?', a: 'Escríbenos por WhatsApp, llama al ' + H.tel + ' o llena el formulario de la página de contacto. La habitación se aparta con un anticipo del 50 %.' },
    { id: 'cancelar', q: '¿Qué pasa si cancelo?', a: 'Si cancelas, el anticipo no se devuelve.' },
    { id: 'directo', q: '¿Conviene reservar directo con el hotel?', a: 'Sí. Al reservar con nosotros no pagas comisiones de plataformas y te atendemos por WhatsApp.' },
    { id: 'factura', q: '¿Dan factura?', a: 'Sí, facturamos sin problema. Pídela al reservar o al llegar.' },
  ] },
  { id: 'habitaciones', nombre: 'Habitaciones', items: [
    { id: 'horarios', q: '¿A qué hora es la entrada y la salida?', a: 'La entrada es a partir de las 2:00 PM y la salida hasta las 11:00 AM. Si necesitas otro horario, escríbenos y vemos qué se puede.' },
    { id: 'incluye', q: '¿Qué incluye la habitación?', a: 'Aire acondicionado, pantalla, frigobar, microondas, WiFi y baño privado. La alberca y el estacionamiento también están incluidos.' },
    { id: 'camas', q: '¿Qué camas tienen las habitaciones?', a: 'Es la misma habitación, con dos camas queen. La tarifa sencilla es para una persona y la doble, para dos.' },
    { id: 'grupo', q: '¿Hay tarifa para grupos?', a: 'Sí, a partir de 3 habitaciones. Escríbenos con las fechas y cuántos son.' },
  ] },
  { id: 'alberca', nombre: 'Alberca', items: [
    { id: 'alberca-horario', q: '¿Hasta qué hora abre la alberca?', a: 'La alberca abre todos los días hasta las 10 PM.' },
    { id: 'alberca-ninos', q: '¿Hay alberca para niños?', a: 'Sí, hay chapoteadero junto a la alberca principal.' },
    { id: 'alberca-costo', q: '¿La alberca tiene costo extra?', a: 'No. Está incluida en tu estancia.' },
  ] },
  { id: 'palapa', nombre: 'La palapa', items: [
    { id: 'palapa-capacidad', q: '¿Cuántas personas caben en la palapa?', a: 'Hasta 60. Es una palapa para fiestas, techada y junto a la alberca.' },
    { id: 'palapa-incluye', q: '¿Qué tiene la palapa?', a: 'Asador, barra con bancos, refrigerador, baños y abanicos. Tú traes la comida, el carbón y la música.' },
    { id: 'palapa-precio', q: '¿Cuánto cuesta rentar la palapa?', a: 'Depende de la fecha y del horario. Escríbenos por WhatsApp con el día y cuántas personas van y te mandamos la cotización.' },
    { id: 'palapa-hospedaje', q: '¿Mis invitados pueden quedarse a dormir?', a: 'Sí. Hay habitaciones desde ' + DESDE + ' la noche y tarifa de grupo desde 3 habitaciones.' },
  ] },
  { id: 'reglas', nombre: 'Reglas', items: [
    { id: 'mascotas', q: '¿Aceptan mascotas?', a: 'No se permiten mascotas.' },
    { id: 'fumar', q: '¿Se puede fumar?', a: 'No se permite fumar en las habitaciones.' },
    { id: 'edad', q: '¿Hay edad mínima para registrarse?', a: 'Sí: hay que ser mayor de 18 años y presentar identificación oficial.' },
  ] },
  { id: 'ubicacion', nombre: 'Ubicación', items: [
    { id: 'donde', q: '¿Dónde está el hotel?', a: 'En Bernardo Reyes esquina con Garza Ayala, colonia Centro, García, Nuevo León, a unas cuadras de la plaza principal.' },
    { id: 'monterrey', q: '¿Qué tan lejos está de Monterrey?', a: 'García está al poniente de Monterrey. Desde la Macroplaza son unos 38 km, alrededor de 45 minutos en auto; desde el poniente de la ciudad es menos.' },
    { id: 'estacionamiento', q: '¿Hay estacionamiento?', a: 'Sí, dentro del hotel y sin costo durante toda tu estancia.' },
    { id: 'atencion', q: '¿En qué horario atienden?', a: 'Todos los días, de 7 AM a 11 PM, por WhatsApp y por teléfono.' },
    { id: 'grutas', q: '¿Qué tan cerca están las Grutas de García?', a: 'A unos ' + D.grutas + ' minutos en auto: son ' + D.grutasKm + ' km desde el centro de García.' },
  ] },
];
const FAQ_LA: GrupoFaq[] = [
  { id: 'reservas', nombre: 'Reservas y pagos', items: [
    { id: 'precio', q: '¿Desde cuánto cuesta hospedarse?', a: 'Las habitaciones empiezan en ' + DESDE + ' por noche y el departamento con cocina, en ' + precioDe('depa') + '. El precio mejora si reservas con anticipación, si vienen en grupo o si rentas el departamento por semana o mes.' },
    { id: 'apartar', q: '¿Cómo aparto?', a: 'Por WhatsApp, por teléfono al ' + H.tel + ' o con el formulario de contacto. Se aparta con el 50 % de anticipo.' },
    { id: 'cancelar', q: '¿El anticipo se devuelve si cancelo?', a: 'No. Si cancelas, el anticipo no se devuelve.' },
    { id: 'pago', q: '¿Qué formas de pago aceptan?', a: 'Efectivo y tarjeta.' },
    { id: 'factura', q: '¿Facturan?', a: 'Sí. Dinos al reservar que necesitas factura y la preparamos.' },
  ] },
  { id: 'habitaciones', nombre: 'Habitaciones y departamentos', items: [
    { id: 'horarios', q: '¿Cuál es el horario de entrada y de salida?', a: 'Puedes entrar desde las 2:00 PM y la salida es a las 11:00 AM. Para llegar antes o salir después, pregúntanos por WhatsApp.' },
    { id: 'incluye', q: '¿Qué tienen las habitaciones?', a: 'Aire acondicionado, pantalla, frigobar, microondas, WiFi y baño privado, además de alberca, jardín y estacionamiento.' },
    { id: 'depa', q: '¿Cómo son los departamentos?', a: 'Tienen 2 recámaras, sala y cocina equipada, para 4 a 8 personas, y están dentro del mismo hotel.' },
    { id: 'depa-semana', q: '¿Se pueden rentar por semana o por mes?', a: 'Sí. Los departamentos se rentan por noche, por semana o por mes; la tarifa de estancia larga se cotiza por WhatsApp según tus fechas.' },
    { id: 'depa-contrato', q: '¿Hay que firmar contrato o dejar aval?', a: 'No es una renta de casa: es hospedaje dentro del hotel. Al cotizar te explicamos cómo se aparta.' },
    { id: 'grupo', q: '¿Tienen precio para grupos?', a: 'Sí, cuando reservan 3 habitaciones o más.' },
  ] },
  { id: 'alberca', nombre: 'Alberca y jardín', items: [
    { id: 'alberca-horario', q: '¿Qué horario tiene la alberca?', a: 'La alberca y el chapoteadero están abiertos todos los días hasta las 10 PM.' },
    { id: 'alberca-ninos', q: '¿Los niños tienen dónde nadar?', a: 'Sí: hay chapoteadero, y la alberca tiene una cascada de piedra, en medio del jardín.' },
    { id: 'alberca-costo', q: '¿Se paga aparte por la alberca?', a: 'No. Es parte de tu hospedaje.' },
  ] },
  { id: 'palapa', nombre: 'La palapa techada', items: [
    { id: 'palapa-capacidad', q: '¿Para cuántas personas es la palapa techada?', a: 'Para hasta 60 personas. Está rodeada de jardín y áreas verdes.' },
    { id: 'palapa-incluye', q: '¿Con qué cuenta la palapa?', a: 'Asador de ladrillo, parrilla de gas, lavabo, mesa con sillas, pantalla y abanicos de techo.' },
    { id: 'palapa-precio', q: '¿Qué precio tiene la palapa techada?', a: 'Cambia según el día y las horas. Mándanos por WhatsApp la fecha y el número de invitados y te cotizamos.' },
    { id: 'palapa-hospedaje', q: '¿La familia puede hospedarse ahí mismo?', a: 'Sí, en habitaciones ' + TIPOS_O + ', o en un departamento con cocina para 4 a 8 personas.' },
  ] },
  { id: 'reglas', nombre: 'Reglas', items: [
    { id: 'mascotas', q: '¿Puedo llevar a mi mascota?', a: 'No, el hotel no admite mascotas.' },
    { id: 'edad', q: '¿Quién puede registrarse?', a: 'Personas mayores de 18 años, con identificación oficial.' },
  ] },
  { id: 'ubicacion', nombre: 'Ubicación', items: [
    { id: 'donde', q: '¿Cuál es la dirección?', a: 'Mariano Escobedo 105-A, entre Bernardo Reyes y Morelos, colonia Centro, García, Nuevo León.' },
    { id: 'grutas', q: '¿A cuánto quedan las Grutas de García?', a: 'A ' + D.grutasKm + ' km, unos ' + D.grutas + ' minutos en auto por el Camino a Grutas de García.' },
    { id: 'monterrey', q: '¿Cuánto se hace desde Monterrey?', a: 'Desde el centro de Monterrey (Macroplaza) son cerca de 38 km: unos 45 minutos en auto. Si sales del poniente de la ciudad, llegas antes.' },
    { id: 'estacionamiento', q: '¿Tienen estacionamiento?', a: 'Sí, privado, dentro del hotel y gratis.' },
    { id: 'atencion', q: '¿A qué hora puedo llamar o escribir?', a: 'De 7 AM a 11 PM, todos los días.' },
  ] },
];
export const FAQ: GrupoFaq[] = esQA ? FAQ_QA : FAQ_LA;
export const pregunta = (id: string): Pregunta => FAQ.flatMap((g) => g.items).find((p) => p.id === id)!;

// Qué preguntas enseña cada página en su sección de preguntas. Regla de la auditoría SEO del 13 de noviembre de
// 2026: tres o cuatro por página, propias de esa página; ninguna sale en dos. La lista completa vive solo en
// /preguntas-frecuentes (scripts/seo.mjs comprueba que no se repitan).
export const FAQ_DE: Record<string, string[]> = esQA
  ? { inicio: ['apartar', 'alberca-horario', 'estacionamiento', 'mascotas'], habitaciones: ['horarios', 'incluye', 'camas', 'grupo'], celebraciones: ['palapa-capacidad', 'palapa-incluye', 'palapa-precio', 'palapa-hospedaje'], contacto: ['cancelar', 'directo', 'atencion', 'factura'] }
  : { inicio: ['apartar', 'alberca-horario', 'grutas', 'mascotas'], habitaciones: ['horarios', 'incluye', 'precio', 'alberca-ninos'], departamentos: ['depa', 'depa-semana', 'depa-contrato', 'estacionamiento'], empresas: ['factura', 'pago', 'grupo'], celebraciones: ['palapa-capacidad', 'palapa-incluye', 'palapa-precio', 'palapa-hospedaje'], contacto: ['cancelar', 'atencion', 'donde'] };
export const FAQ_TIT: Record<string, Cab> = {
  habitaciones: { l: 'Preguntas sobre', o: 'las habitaciones' },
  celebraciones: esQA ? { l: 'Preguntas sobre', o: 'la palapa' } : { l: 'Preguntas sobre', o: 'el jardín y la palapa' },
  contacto: { l: 'Antes de', o: 'escribirnos' },
  departamentos: { l: 'Preguntas sobre', o: 'el departamento' },
  empresas: { l: 'Preguntas', o: 'de empresas' },
};
