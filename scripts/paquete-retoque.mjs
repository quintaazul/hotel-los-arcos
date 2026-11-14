// Arma el paquete de fotos para retocar con inteligencia artificial fuera del proyecto (ampliar, igualar estilo,
// limpiar). Cada foto va en su propia carpeta con TODO su contexto: la foto, una captura del lugar de la página donde
// va (para ver dónde cae el texto), sus referencias de acabado y la instrucción lista para pegar.
// Al regresar con su clave en el nombre, scripts/recibir-retoque.mjs la compara con la original.
// Uso: node scripts/paquete-retoque.mjs [carpeta de salida]     (necesita los dos sitios servidos en 4321 y 4322)
import { RAIZ } from './_raiz.mjs';
import sharp from 'sharp';
import { mkdirSync, writeFileSync, rmSync, existsSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const SAL = (process.argv[2] || 'E:/hoteles-contenido/para-retocar').replace(/\\/g, '/');
const P = RAIZ, A = P + 'src/assets/';
const Z = 'E:/hoteles-contenido/disenador/Hoteles Mexico MTY/Imagenes hoteles/Hotel Los Arcos Inn/';
const QA = 'hotel-quinta-azul', LA = 'hotel-los-arcos-inn';

// grupo A = ya tiene el estilo del diseñador, solo le faltan píxeles · grupo B = foto real: igualar estilo, limpiar y ampliar
// f: factor de ampliación · uso: dónde va en el sitio · que: qué se ve · pide: instrucción propia de la foto
const FOTOS = [
  // ───── Quinta Azul · A
  { c: 'QA-A01', de: A + `qa/patio-atardecer-${QA}-garcia.webp`, f: 4, uso: 'Portada del inicio (computadora)', que: 'Edificio de dos pisos y patio al atardecer' },
  { c: 'QA-A02', de: A + `qa/${QA}-garcia-exterior-cielo-azul.webp`, f: 2.5, uso: 'Portada de Contacto', que: 'Edificio y patio con cielo azul' },
  { c: 'QA-A03', de: A + `qa/alberca-atardecer-palmas-${QA}-garcia.webp`, f: 3, uso: 'Inicio: cuadro grande «Alberca hasta las 10 PM»', que: 'Alberca al atardecer con palmas y jardinera' },
  { c: 'QA-A04', de: A + `qa/estacionamiento-privado-${QA}-garcia.webp`, f: 3, uso: 'Inicio: cuadro «Estacionamiento gratis»', que: 'Estacionamiento dentro del hotel' },
  { c: 'QA-A05', de: A + `qa/patio-eventos-${QA}-garcia.webp`, f: 3.5, uso: 'Celebraciones: fila de fotos', que: 'Patio con el edificio, árbol y palma' },
  { c: 'QA-A06', de: A + 'qa/sierra-de-garcia-camino-desde-monterrey.webp', f: 3, uso: 'Ubicación y planes', que: 'La sierra sobre García' },
  // ───── Quinta Azul · B
  { c: 'QA-B01', de: A + `qa/palapa-eventos-${QA}-garcia.webp`, f: 2, uso: 'Inicio: foto principal de la sección de la palapa', que: 'Palapa: asador, muro de azulejo y barra con bancos rojos',
    pide: 'Luz cálida de atardecer entrando por los lados. Piso limpio y parejo, sin manchas ni brillos quemados. Brasas encendidas en el asador, con muy poco humo. Opcional: sobre la barra, una jarra de agua fresca con vasos y un platón de botana. No agregues mesas, sillas, luces ni decoración fija.' },
  { c: 'QA-B02', de: A + `qa/palapa-con-vista-alberca-${QA}.webp`, f: 2, uso: 'Portada de Celebraciones y cuadro «Palapa para 60» del inicio', que: 'Barra de la palapa con bancos rojos y la alberca al fondo',
    pide: 'Luz cálida de tarde. Que al fondo se note la alberca con el agua azul limpia. Barra limpia y brillante; bancos alineados. Opcional: vasos y una jarra sobre la barra. Conserva el congelador blanco y los abanicos.' },
  { c: 'QA-B03', de: A + `qa/palapa-asador-bar-${QA}.webp`, f: 2, uso: 'Galería de la palapa y plan de carne asada', que: 'Barra y bancos de la palapa, foto vertical',
    pide: 'Luz cálida de tarde, piso limpio, alberca azul al fondo. Barra limpia y bancos alineados. Sin objetos nuevos.' },
  { c: 'QA-B04', de: A + `qa/palapa-celebraciones-${QA}-garcia.webp`, f: 2, uso: 'Galería de la palapa', que: 'Palapa con el asador y el piso libre, foto vertical',
    pide: 'Luz cálida de tarde, piso limpio. Opcional, como la dejaría un huésped para un cumpleaños: un arreglo pequeño de globos azul y blanco junto a una columna y un pastel sobre la barra. Nada colgado del techo ni pegado a los azulejos.' },
  { c: 'QA-B05', de: A + `qa/habitacion-cabecera-cojines-${QA}.jpg`, f: 1.5, uso: 'Portada de Habitaciones', que: 'Dos camas queen con cojines rosas, cabecera de madera y clóset',
    pide: 'Luz natural suave y cálida; paredes y techo blancos limpios (hoy se ven amarillos). Líneas verticales derechas. Colchas bien estiradas, sin arrugas. Lámpara encendida con luz cálida. Opcional: una toalla blanca doblada al pie de cada cama.' },
  { c: 'QA-B06', de: A + `qa/habitacion-frigobar-microondas-${QA}.jpg`, f: 1.5, uso: 'Galería de habitaciones', que: 'Las dos camas con el frigobar, el microondas y la pantalla',
    pide: 'Luz natural suave y cálida; paredes y techo blancos limpios. Líneas verticales derechas. Colchas estiradas. Quita cables a la vista. Frigobar y microondas limpios y derechos.' },
  // ───── Los Arcos Inn · A
  { c: 'LA-A01', de: A + `la/fachada-naranja-alberca-atardecer-${LA}-garcia.webp`, f: 4, uso: 'Portada del inicio (computadora)', que: 'Fachada naranja con arcos y alberca al atardecer' },
  { c: 'LA-A02', de: A + `la/jardin-alberca-eventos-${LA}-garcia.webp`, f: 4, uso: 'Portada de Celebraciones', que: 'Jardín con palmas y la alberca' },
  { c: 'LA-A03', de: A + `la/sala-vista-alberca-departamento-${LA}.webp`, f: 4, uso: 'Portada de Habitaciones', que: 'Sala del departamento con vista al jardín' },
  { c: 'LA-A04', de: A + `la/${LA}-garcia-vista-jardin.webp`, f: 2.5, uso: 'Portada de Contacto', que: 'Jardín y alberca vistos desde arriba' },
  { c: 'LA-A05', de: A + `la/alberca-chapoteadero-${LA}-garcia.webp`, f: 4, uso: 'Inicio: cuadro grande «Alberca y chapoteadero»', que: 'Alberca y chapoteadero en el jardín' },
  { c: 'LA-A06', de: A + `la/palapa-alberca-atardecer-${LA}-garcia.webp`, f: 3.5, uso: 'Inicio: cuadro «Palapa para 60»', que: 'Palapa junto a la alberca al atardecer' },
  { c: 'LA-A07', de: A + `la/jardin-atardecer-${LA}-garcia.webp`, f: 3.5, uso: 'Inicio: cuadro «Jardín y áreas verdes»', que: 'Jardín al atardecer' },
  { c: 'LA-A08', de: A + `la/cocineta-equipada-departamento-${LA}.webp`, f: 3, uso: 'Inicio: cuadro «Departamentos con cocina»', que: 'Cocina equipada del departamento' },
  { c: 'LA-A09', de: A + `la/arcos-palmas-dos-niveles-${LA}-garcia.webp`, f: 3, uso: 'Galería', que: 'Los arcos de dos niveles con palmas' },
  { c: 'LA-A10', de: A + `la/patio-arcos-jardin-${LA}-garcia.webp`, f: 3, uso: 'Galería y celebraciones', que: 'Patio de los arcos y jardín' },
  { c: 'LA-A11', de: A + `la/alberca-vista-aerea-${LA}-garcia.webp`, f: 2, uso: 'Galería de la palapa', que: 'La alberca vista desde arriba, entre árboles' },
  { c: 'LA-A12', de: A + `la/cocinar-departamento-estancias-largas-${LA}.webp`, f: 3.5, uso: 'Plan de estancias largas', que: 'Cocinando en la estufa del departamento' },
  { c: 'LA-A13', de: A + `la/sierra-de-garcia-cerca-${LA}.webp`, f: 2, uso: 'Ubicación y planes', que: 'La sierra de García' },
  // ───── Los Arcos Inn · B
  { c: 'LA-B01', de: Z + 'WhatsApp Image 2026-08-07 at 1.45.01 PM.jpeg', f: 2, uso: 'NUEVA. Inicio: foto principal de la sección de la palapa', que: 'La palapa de frente: arco naranja, asador de ladrillo, mesa con sillas y abanicos',
    pide: 'Luz de atardecer cálida. Quita el tambo azul, la cubeta, las cajas, el tanque de gas y todo objeto suelto; piso limpio. Conserva el arco naranja, el asador de ladrillo, la barra, la mesa con sus sillas, la escalera y los abanicos. Opcional: la mesa puesta para una comida familiar (mantel claro, platos y una jarra).' },
  { c: 'LA-B02', de: Z + 'WhatsApp Image 2026-08-07 at 1.45.06 PM (2).jpeg', f: 2, uso: 'NUEVA. Galería de la palapa', que: 'La palapa en ángulo: asador, barra, pantalla y mesa',
    pide: 'Luz de atardecer cálida. Quita el tambo azul, la cubeta, las cajas, el tanque de gas y todo objeto suelto; piso limpio. Conserva el arco naranja, el asador de ladrillo, la barra, la pantalla en la pared, la mesa con sus sillas y los abanicos.' },
  { c: 'LA-B03', de: A + `la/habitacion-cama-queen-de-frente-${LA}.jpg`, f: 2, uso: 'Inicio y Habitaciones: ficha de la habitación sencilla', que: 'Cama queen de frente, con aire acondicionado y dos burós',
    pide: 'Luz suave y cálida; paredes blancas limpias, sin dominante azul. Lámparas de pared encendidas sin quemar la pared. Líneas verticales derechas. Colcha estirada, sin arrugas.' },
  { c: 'LA-B04', de: A + `la/habitacion-dos-camas-de-lado-${LA}.jpg`, f: 2, uso: 'Inicio y Habitaciones: ficha de la habitación doble y de la triple', que: 'Dos camas vistas de lado, con el cuadro azul y dorado',
    pide: 'Luz suave y cálida; paredes blancas limpias, sin dominante azul. Lámparas de pared encendidas sin quemar la pared. Líneas verticales derechas. Colchas estiradas, sin arrugas.' },
  { c: 'LA-B05', de: A + `la/departamento-recamara-camas-rosas-${LA}.jpg`, f: 2, uso: 'Galería del departamento', que: 'Recámara con dos camas de colcha rosa',
    pide: 'Quita el tinte rosado de paredes y techo: deben verse blancos. Colchas en rosa palo, estiradas. Luz suave y cálida, líneas verticales derechas.' },
  { c: 'LA-B06', de: A + `la/bano-lavabo-negro-${LA}.jpg`, f: 2, uso: 'Galería de las habitaciones: el baño', que: 'Baño con lavabo negro y repisa, foto vertical',
    pide: 'Luz limpia y pareja, blancos neutros. Toallas blancas bien dobladas en la repisa. Quita rollos, botes y objetos sueltos. Espejo y azulejo limpios.' },
  { c: 'LA-B07', de: A + `la/departamento-bano-regadera-${LA}.jpg`, f: 2, uso: 'Galería del departamento: el baño', que: 'Baño con regadera de cancel, lavabo negro y repisa',
    pide: 'Luz limpia y pareja, blancos neutros. Toallas blancas bien dobladas en la repisa. Quita el envase verde y el rollo de papel a la vista. Cancel de vidrio limpio, sin reflejos del fotógrafo.' },
  { c: 'LA-B08', de: A + `la/departamento-escritorio-puertas-${LA}.jpg`, f: 2, uso: 'Galería del departamento', que: 'Escritorio con silla y las puertas de las recámaras',
    pide: 'Luz suave y cálida, paredes blancas limpias, líneas verticales derechas. Opcional: una laptop cerrada y una planta pequeña sobre el escritorio.' },
  { c: 'LA-B09', de: A + `la/entrada-barda-naranja-logo-${LA}.jpg`, f: 2, uso: 'Ubicación: cómo reconocer la entrada', que: 'Barda naranja de la entrada con el logotipo, foto vertical',
    pide: 'Luz de tarde cálida y cielo limpio. Barda naranja pareja; banqueta y calle limpias. Quita cables y postes solo si no tapan nada. El logotipo debe quedar EXACTAMENTE igual: no lo redibujes ni cambies sus letras.' },
];

// ───── Dónde se muestra cada foto. El lugar le da intención a la imagen: qué zona lleva texto encima, qué parte se
// recorta y a qué tamaño se ve. e = explicación para la persona · p = petición para la IA
const LUGARES = {
  INICIO: { n: 'Portada del inicio', e: 'Fondo a pantalla completa. Lleva encima el título grande en letras blancas en la mitad izquierda, el menú arriba y la barra de reservas abajo. En computadora solo se ve la franja horizontal del centro.', p: 'Esta imagen es el fondo de la portada de un sitio web: encima lleva un título grande en letras blancas en la mitad izquierda y una barra de reservas en la parte de abajo. La mitad izquierda y la franja inferior deben quedar un poco más oscuras y tranquilas, sin luces fuertes ni detalles muy contrastados; lo más luminoso y llamativo debe quedar en la mitad derecha.' },
  INTERIOR: { n: 'Cabecera de una página interior', e: 'Franja ancha arriba de la página, con el título en letras blancas abajo a la izquierda.', p: 'Esta imagen es la cabecera de una página web y lleva un título en letras blancas abajo a la izquierda: esa esquina debe quedar más oscura y sin detalles finos, y el sujeto principal al centro o a la derecha.' },
  CUADRO: { n: 'Cuadro con rótulo', e: 'Cuadro horizontal sobre fondo oscuro, con un rótulo blanco (título y una línea) abajo a la izquierda, encima de la foto.', p: 'Esta imagen va en un cuadro con un rótulo en letras blancas abajo a la izquierda: esa zona debe quedar algo más oscura y sin detalles finos.' },
  ARCO: { n: 'Foto dentro de un arco', e: 'Se muestra dentro de un marco con forma de arco: las esquinas de arriba se recortan en curva.', p: 'Esta imagen se muestra dentro de un marco con forma de arco, que recorta en curva las esquinas de arriba: lo importante debe quedar al centro y en la mitad de abajo, y nada clave en las esquinas superiores.' },
  FICHA: { n: 'Foto principal de una habitación', e: 'Es lo primero que se ve de esa habitación, en grande, junto a su precio.', p: 'Es la foto principal con la que se ofrece esta habitación: debe sentirse amplia, luminosa, ordenada y acogedora.' },
  GALERIA: { n: 'Galería', e: 'Se ve completa, sin texto encima, y a pantalla completa cuando la persona la toca.', p: 'Esta imagen se ve completa y a pantalla completa, sin texto encima: la luz debe quedar pareja en todo el cuadro y debe aguantar verse muy grande.' },
};
const DONDE = { 'QA-A01': ['INICIO'], 'QA-A02': ['INTERIOR'], 'QA-A03': ['CUADRO'], 'QA-A04': ['CUADRO'], 'QA-A05': ['GALERIA'], 'QA-A06': ['GALERIA'],
  'QA-B01': ['ARCO'], 'QA-B02': ['INTERIOR', 'CUADRO'], 'QA-B03': ['GALERIA'], 'QA-B04': ['GALERIA'], 'QA-B05': ['INTERIOR'], 'QA-B06': ['GALERIA'],
  'LA-A01': ['INICIO'], 'LA-A02': ['INTERIOR'], 'LA-A03': ['INTERIOR'], 'LA-A04': ['INTERIOR'], 'LA-A05': ['CUADRO'], 'LA-A06': ['CUADRO'], 'LA-A07': ['CUADRO'], 'LA-A08': ['CUADRO'],
  'LA-A09': ['GALERIA'], 'LA-A10': ['GALERIA'], 'LA-A11': ['GALERIA'], 'LA-A12': ['GALERIA'], 'LA-A13': ['GALERIA'],
  'LA-B01': ['ARCO'], 'LA-B02': ['GALERIA'], 'LA-B03': ['FICHA'], 'LA-B04': ['FICHA'], 'LA-B05': ['GALERIA'], 'LA-B06': ['GALERIA'], 'LA-B07': ['GALERIA'], 'LA-B08': ['GALERIA'], 'LA-B09': ['GALERIA'] };
const CON_TEXTO = ['INICIO', 'INTERIOR', 'CUADRO'];   // lugares donde la foto lleva texto encima

// ───── Capturas del lugar: cómo se ve hoy esa parte de la página, con su texto. Van junto a la foto.
// ruta y selector de la sección; desfase mueve el encuadre (fracción del alto de la pantalla)
const CAPTURAS = {
  inicio: { ruta: () => '/', sel: '.portada', desfase: 0, n: 'portada-del-inicio', d: 'la portada del inicio, con el título a la izquierda y la barra de reservas abajo' },
  cuadro: { ruta: () => '/', sel: '.incluido', desfase: -0.16, n: 'cuadros-de-lo-que-incluye', d: 'la sección de cuadros con rótulo' },
  arco: { ruta: () => '/', sel: 'section[aria-labelledby="t-palapa"]', desfase: 0.05, n: 'seccion-de-la-palapa', d: 'la sección de la palapa, donde la foto va dentro de un arco' },
  ficha: { ruta: () => '/', sel: '#habitaciones', desfase: -0.42, n: 'ficha-de-habitacion', d: 'la sección de habitaciones, con la foto grande junto a la ficha y el precio' },
  hab: { ruta: (h) => (h === 'qa' ? '/hospedaje' : '/habitaciones'), sel: '.portada', desfase: 0, n: 'cabecera-de-habitaciones', d: 'la cabecera de la página de habitaciones, con el título abajo a la izquierda' },
  cel: { ruta: () => '/celebraciones', sel: '.portada', desfase: 0, n: 'cabecera-de-celebraciones', d: 'la cabecera de la página de celebraciones, con el título abajo a la izquierda' },
  con: { ruta: () => '/contacto', sel: '.portada', desfase: 0, n: 'cabecera-de-contacto', d: 'la cabecera de la página de contacto, con el título abajo a la izquierda' },
};
const CAPTURA_DE = { 'QA-A01': ['inicio'], 'QA-A02': ['con'], 'QA-A03': ['cuadro'], 'QA-A04': ['cuadro'], 'QA-B01': ['arco'], 'QA-B02': ['cel', 'cuadro'], 'QA-B05': ['hab'],
  'LA-A01': ['inicio'], 'LA-A02': ['cel'], 'LA-A03': ['hab'], 'LA-A04': ['con'], 'LA-A05': ['cuadro'], 'LA-A06': ['cuadro'], 'LA-A07': ['cuadro'], 'LA-A08': ['cuadro'], 'LA-B01': ['arco'], 'LA-B03': ['ficha'], 'LA-B04': ['ficha'] };

// ───── Referencias de acabado de cada foto del grupo B: fotos ya ajustadas por el diseñador.
// [archivo, qué es y cómo usarla]. Cuando existe, va primero el MISMO lugar ya retocado.
const r = (h, n) => A + `${h}/${n}-${h === 'qa' ? QA : LA}.jpg`;
const EXT_QA = [[r('qa', 'edificio-escalera-atardecer'), 'el edificio del mismo hotel al atardecer: la luz y el color que se buscan en exteriores'], [r('qa', 'alberca-sierra-atardecer'), 'la alberca del mismo hotel, que queda junto a la palapa: misma luz de tarde']];
const REFS = {
  'QA-B01': EXT_QA, 'QA-B02': EXT_QA, 'QA-B03': EXT_QA, 'QA-B04': EXT_QA,
  'QA-B05': [[r('qa', 'habitacion-dos-camas-queen-abanico'), 'LA MISMA habitación ya retocada: iguala exactamente este acabado (blancos, luz y nitidez)'], [r('qa', 'cama-cojines-orquidea-detalle'), 'detalle de la misma cama ya retocado']],
  'QA-B06': [[r('qa', 'habitacion-dos-camas-queen-abanico'), 'LA MISMA habitación ya retocada: iguala exactamente este acabado'], [r('qa', 'mueble-pantalla-microondas-frigobar'), 'el mismo mueble con frigobar y microondas, ya retocado']],
  'LA-B01': [[r('la', 'alberca-palapa-arcos-atardecer'), 'LA MISMA palapa vista desde la alberca, ya retocada: la luz de atardecer y los colores que se buscan'], [r('la', 'jardin-alberca-desde-un-arco-atardecer'), 'el jardín del mismo hotel al atardecer, visto desde un arco']],
  'LA-B02': [[r('la', 'alberca-palapa-arcos-atardecer'), 'LA MISMA palapa vista desde la alberca, ya retocada: la luz de atardecer y los colores que se buscan'], [r('la', 'jardin-alberca-desde-un-arco-atardecer'), 'el jardín del mismo hotel al atardecer, visto desde un arco']],
  'LA-B03': [[r('la', 'recamara-cama-queen-detalle'), 'LA MISMA cama ya retocada: iguala exactamente este acabado'], [r('la', 'recamara-dos-camas'), 'otra habitación del mismo hotel ya retocada']],
  'LA-B04': [[r('la', 'recamara-dos-camas'), 'LA MISMA habitación ya retocada, vista de frente: iguala exactamente este acabado'], [r('la', 'recamara-cama-queen-detalle'), 'detalle de una cama del mismo hotel ya retocado']],
  'LA-B05': [[r('la', 'recamara-dos-camas'), 'una habitación del mismo hotel ya retocada: paredes blancas y luz que se buscan'], [r('la', 'departamento-dos-recamaras'), 'las recámaras del mismo departamento ya retocadas']],
  'LA-B06': [[r('qa', 'bano-regadera-cancel'), 'un baño ya retocado (es del otro hotel): solo como referencia de limpieza y luz, no copies sus acabados'], [r('la', 'departamento-cocina-barra-bancos'), 'interior del mismo hotel ya retocado: blancos y luz que se buscan']],
  'LA-B07': [[r('qa', 'bano-regadera-cancel'), 'un baño ya retocado (es del otro hotel): solo como referencia de limpieza y luz, no copies sus acabados'], [r('la', 'departamento-cocina-barra-bancos'), 'interior del mismo hotel ya retocado: blancos y luz que se buscan']],
  'LA-B08': [[r('la', 'departamento-escritorio-para-trabajar'), 'EL MISMO escritorio ya retocado, en vertical: iguala exactamente este acabado'], [r('la', 'departamento-sala-vista-al-jardin'), 'la sala del mismo departamento ya retocada']],
  'LA-B09': [[r('la', 'fachada-naranja-palmas-flores'), 'la fachada naranja del mismo hotel ya retocada: el tono del naranja y del cielo que se buscan'], [r('la', 'fachada-arcos-alberca-reflejo-atardecer'), 'el mismo hotel al atardecer']],
};

const BASE_A = (w, h, f) => `Amplía la imagen 1 a ${w} × ${h} píxeles (${String(f).replace('.', ',')} veces). No cambies nada: mismos objetos, colores, luz, encuadre y proporción. Solo más resolución y detalle real. Sin aspecto pintado ni plástico y sin suavizar las texturas (pasto, hojas, agua, azulejo, tela). No agregues texto, personas ni marcas de agua.`;
const BASE_B = (w, h) => `Edita la imagen 1, que es una foto real de un hotel, para que tenga el mismo acabado que las imágenes de referencia: luz cálida, colores vivos pero naturales, limpia y nítida, con aspecto de fotografía profesional. Es el mismo lugar: conserva exactamente la arquitectura, los muebles, los colores de paredes y pisos, la distribución y el encuadre. No agregues personas, texto ni marcas de agua. No inventes ventanas, muebles, plantas grandes ni servicios que no estén en la foto. Entrégala a ${w} × ${h} píxeles, con la misma proporción.`;

if (existsSync(SAL)) rmSync(SAL, { recursive: true, force: true });
for (const d of ['fotos', 'devueltas', '_lugares']) mkdirSync(`${SAL}/${d}`, { recursive: true });

// 1) Capturas de cada lugar, una vez por hotel
const puerto = { qa: 4321, la: 4322 }, hechas = {};
for (const [clave, caps] of Object.entries(CAPTURA_DE)) for (const k of caps) {
  const h = clave.startsWith('QA') ? 'qa' : 'la', id = `${h}-${k}`; if (hechas[id]) continue;
  const c = CAPTURAS[k], sal = `${SAL}/_lugares/${id}.jpg`;
  execFileSync(process.execPath, [P + 'scripts/foto-seccion.mjs', `http://127.0.0.1:${puerto[h]}${c.ruta(h)}`, c.sel, sal, '1080p', '--desfase=' + c.desfase], { stdio: 'ignore' });
  hechas[id] = sal;
}
console.log(Object.keys(hechas).length + ' capturas de lugares');

// 2) Una carpeta por foto, con todo su contexto
const limpio = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const manifiesto = [];
for (const x of FOTOS) {
  if (!DONDE[x.c]) throw new Error('Falta decir dónde va ' + x.c);
  const m = await sharp(x.de).rotate().metadata(), h = x.c.startsWith('QA') ? 'qa' : 'la', g = x.c.split('-')[1][0];
  const w = Math.round(m.width * x.f / 16) * 16, al = Math.round(w * m.height / m.width);
  const dir = `${SAL}/fotos/${x.c}`; mkdirSync(dir, { recursive: true });
  const adj = [];   // lo que se adjunta, en orden: [archivo, qué es]
  const foto = `1-FOTO-A-RETOCAR__${x.c}__${limpio(x.que).slice(0, 44)}.png`;
  await sharp(x.de).rotate().png({ compressionLevel: 9 }).toFile(`${dir}/${foto}`);
  adj.push([foto, 'la foto que se edita']);
  for (const k of CAPTURA_DE[x.c] || []) { const f = `2-DONDE-VA__${CAPTURAS[k].n}.jpg`; copyFileSync(hechas[`${h}-${k}`], `${dir}/${f}`); adj.push([f, `captura de la página web: ${CAPTURAS[k].d}`, 'lugar']); }
  let nr = 0;
  for (const [de, que] of (g === 'B' ? REFS[x.c] : [])) { const f = `3-REFERENCIA-${++nr}__${de.split('/').pop().replace(/-hotel-.*$/, '')}.jpg`; await sharp(de).resize({ width: 1400, height: 1400, fit: 'inside' }).jpeg({ quality: 90 }).toFile(`${dir}/${f}`); adj.push([f, que, 'ref']); }
  if (g === 'B' && !nr) throw new Error('Falta la referencia de ' + x.c);

  // La instrucción explica primero qué es cada imagen adjunta
  const lug = adj.filter((a) => a[2] === 'lugar'), refs = adj.filter((a) => a[2] === 'ref');
  const intro = adj.length === 1 ? '' : `Te adjunto ${adj.length} imágenes. La imagen 1 es la foto que debes ${g === 'A' ? 'ampliar' : 'editar'}. `
    + lug.map((a) => `La imagen ${adj.indexOf(a) + 1} es una ${a[1]}; ahí se muestra esta foto (${x.uso.replace(/^NUEVA\. /, '')}). Úsala solo para entender la composición y en qué zona cae el texto: no la copies ni pongas texto en el resultado. `).join('')
    + refs.map((a) => `La imagen ${adj.indexOf(a) + 1} es referencia de acabado: ${a[1]}. `).join('')
    + (refs.length ? 'De las referencias toma la luz, el color y la limpieza; no copies su contenido ni su encuadre. ' : '') + '\n\n';
  const ajuste = DONDE[x.c].filter((l) => CON_TEXTO.includes(l)).map((l) => LUGARES[l].p).join(' ');
  const cuerpo = g === 'A'
    ? BASE_A(w, al, x.f) + (ajuste ? ' Único ajuste permitido, y muy suave: ' + ajuste + ' Hazlo solo con luz y sombra, como un degradado; no muevas ni cambies ningún objeto.' : '')
    : BASE_B(w, al) + ' ' + DONDE[x.c].map((l) => LUGARES[l].p).join(' ') + ' ' + x.pide;
  const instruccion = intro + cuerpo;
  writeFileSync(`${dir}/INSTRUCCION.txt`, `${x.c} · ${x.que}\nVa en: ${x.uso}\nTamaño: ${m.width} × ${m.height}  →  ${w} × ${al}  (por ${String(x.f).replace('.', ',')})\n\nADJUNTA, EN ESTE ORDEN:\n${adj.map((a, i) => `  ${i + 1}. ${a[0]}\n     (${a[1]})`).join('\n')}\n\nPEGA ESTA INSTRUCCIÓN:\n------------------------------------------------------------\n${instruccion}\n------------------------------------------------------------\n\nGUARDA EL RESULTADO EN LA CARPETA «devueltas» CON UN NOMBRE QUE EMPIECE POR ${x.c} (por ejemplo ${x.c}.jpg o ${x.c}.png).\n`);
  manifiesto.push({ clave: x.c, hotel: h, grupo: g, carpeta: `fotos/${x.c}`, archivo: `fotos/${x.c}/${foto}`, adjuntos: adj.map((a) => ({ archivo: a[0], que: a[1] })), origen: x.de, ancho: m.width, alto: m.height, factor: x.f, pedirAncho: w, pedirAlto: al, uso: x.uso, que: x.que, lugares: DONDE[x.c], instruccion });
}
rmSync(`${SAL}/_lugares`, { recursive: true, force: true });
writeFileSync(`${SAL}/manifiesto.json`, JSON.stringify(manifiesto, null, 2));

// 3) Instrucciones para la persona (todas las fotos en un solo documento)
const fila = (m) => `### ${m.clave} · ${m.que}\n\n- **Carpeta:** \`${m.carpeta}/\`\n- **Va en:** ${m.uso}\n- **Qué necesita por estar ahí:** ${m.lugares.map((l) => LUGARES[l].e).join(' Además: ')}\n- **Tamaño:** ${m.ancho} × ${m.alto} → **${m.pedirAncho} × ${m.pedirAlto}** (por ${String(m.factor).replace('.', ',')})\n- **Qué adjuntar, en orden:**\n${m.adjuntos.map((a, i) => `  ${i + 1}. \`${a.archivo}\`: ${a.que}`).join('\n')}\n\n\`\`\`text\n${m.instruccion}\n\`\`\`\n`;
const bloque = (h, g) => manifiesto.filter((m) => m.hotel === h && m.grupo === g).map(fila).join('\n');
const n = (h, g) => manifiesto.filter((m) => (!h || m.hotel === h) && (!g || m.grupo === g)).length;
const md = `# Fotos para retocar con IA

${manifiesto.length} fotos de los dos hoteles (${n('qa')} de Quinta Azul y ${n('la')} de Los Arcos Inn). Cada una tiene su carpeta en \`fotos/\` con todo lo que la IA necesita para entender qué hacer.

## Qué hay en la carpeta de cada foto

- **\`1-FOTO-A-RETOCAR…\`** La foto que se edita.
- **\`2-DONDE-VA…\`** Captura de la parte de la página donde va esa foto, con su texto encima. Sirve para que la IA vea dónde cae el título o el rótulo. No todas la llevan: las de galería se ven completas y sin texto.
- **\`3-REFERENCIA…\`** Fotos ya ajustadas por el diseñador, elegidas para esa foto. Cuando existe, la primera es el mismo lugar ya retocado (la misma habitación, la misma palapa). Solo las llevan las del grupo B.
- **\`INSTRUCCION.txt\`** Qué adjuntar, en qué orden, y el texto para pegar.

## Cómo hacerlo

1. Abre la carpeta de la foto y su \`INSTRUCCION.txt\`.
2. Adjunta en tu herramienta de IA las imágenes de la carpeta, en el orden numerado.
3. Pega la instrucción tal cual.
4. Guarda el resultado en \`devueltas/\` con un nombre que empiece por la clave (por ejemplo \`QA-B01.jpg\`). Sirve JPG o PNG.
5. Cuando termines, avísame. Yo comparo cada una con su original, les doy el acabado final y las meto al sitio.

Si tu herramienta deja elegir resolución, pide la más alta (4K). Si no llega al tamaño pedido, mándala igual al mayor tamaño que dé: lo que importa es que no baje de 3000 px en su lado largo.

## Los dos grupos

- **A · Solo ampliar (${n(null, 'A')} fotos).** Ya tienen el estilo del diseñador, pero miden poco más de 1000 px. No hay que cambiarles nada: solo más resolución. En las que llevan texto encima se permite oscurecer un poco esa zona.
- **B · Retocar y ampliar (${n(null, 'B')} fotos).** Son fotos reales con luz plana. Hay que llevarlas al mismo acabado de sus referencias, limpiarlas y ampliarlas. Dos de ellas son fotos nuevas de la palapa de Los Arcos, que el sitio todavía no tiene.

## Dónde va cada foto, y por qué importa

El lugar de la página le da intención a la foto: qué zona lleva texto encima, qué parte se recorta y a qué tamaño se ve. Cada instrucción ya lo trae escrito. Son seis lugares:

${Object.values(LUGARES).map((l) => '- **' + l.n + '.** ' + l.e).join('\n')}

## Regla para todas

Que el huésped encuentre lo que vio. Se vale mejorar la luz, limpiar, ordenar y poner cosas que llevaría cualquier huésped (un pastel, una jarra, una laptop). No se vale cambiar el lugar: nada de muebles, ventanas, plantas grandes o servicios que no existan. Lo marcado como «Opcional» puedes quitarlo de la instrucción si no te convence.

## Qué revisar antes de guardar cada una

- Que sea el mismo lugar: mismas puertas, ventanas, muebles y colores.
- Que no haya letras deformadas (letreros, logotipo de Los Arcos, pantallas) ni texto copiado de la captura.
- Que el pasto, las hojas y el agua no se vean pintados.
- Que la foto conserve su proporción (ni estirada ni recortada).

---

## Quinta Azul · A · Solo ampliar

${bloque('qa', 'A')}
## Quinta Azul · B · Retocar y ampliar

${bloque('qa', 'B')}
## Los Arcos Inn · A · Solo ampliar

${bloque('la', 'A')}
## Los Arcos Inn · B · Retocar y ampliar

${bloque('la', 'B')}`;
writeFileSync(`${SAL}/INSTRUCCIONES.md`, md);
const conLugar = manifiesto.filter((m) => m.adjuntos.some((a) => a.archivo.startsWith('2-'))).length;
console.log(`${manifiesto.length} fotos (${n(null, 'A')} solo ampliar, ${n(null, 'B')} retocar y ampliar), ${conLugar} con captura de su lugar, en ${SAL}`);
