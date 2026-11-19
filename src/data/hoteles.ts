// Fuente única de los datos de cada hotel. En los sitios reales esto sale de src/content/hotel.json.
// Datos al 17 de noviembre de 2026 (documento «Cambios para el desarrollador»): reseñas, habitaciones, precios
// «desde … + IVA», palapa, descuentos, reglas y redes.
// Las fotos son nombres de archivo dentro de src/assets/<id>/.

export type Hab = {
  id: string; nombre: string; corto: string; personas: number; para: string | null; camas: string | null;
  precio: number | null; texto: string; fotos: [string, string][];
  // Lo que trae ese tipo de habitación, cuando no todos traen lo mismo (Los Arcos, confirmado el 18 de noviembre de
  // 2026). Sin este dato, las fichas enseñan lo de «incluye» del hotel.
  incluye?: [string, string][];
};
export type Hotel = {
  id: 'qa' | 'la'; nombre: string; corto: string; sitio: string; rutaHabs: string;
  descripcion: string; clave: string;
  wa: string; tel: string; telLink: string; correo?: string; ig: string; igUrl: string; facebook: string;
  // Redes del hotel: [icono, nombre visible, dirección]. El pie y los datos para Google (sameAs) leen de aquí.
  redes: [string, string, string][];
  // Página de la palapa: /celebraciones en Quinta Azul (se renta para fiestas) y /palapa en Los Arcos (solo huéspedes)
  rutaPalapa: string;
  fundado: string;
  turnstile: string;
  dir1: string; dir2: string; calle: string; lat: number; lng: number; pin: [number, number]; pinCel: [number, number];
  // Calificación y número de reseñas en Google, con la fecha del corte (se enseña junto a la cifra)
  rating: number; resenas: number; resenasAl: string; resena: string; habitaciones: number;
  // Tiempos en auto desde el hotel (minutos) y kilómetros a las Grutas. Es el único lugar donde se escriben: los
  // textos los toman de aquí y scripts/seo.mjs falla si alguna página dice otro número.
  dist: { monterrey: number; grutas: number; grutasKm: number; xenpal: number };
  hero: { img: string; ancha?: string; alt: string; l1: string; l2?: string; o: string; frase: string };   // ancha: recorte horizontal de la misma foto para pantallas apaisadas
  ventana: { img: string; alt: string; mas: { img: string; alt: string }[]; s: string; o: string; texto: string; pie: string; zoom?: number; foco?: string };   // zoom y foco: encuadre de la foto dentro del arco
  cifras: { valor: number; sufijo: string; texto: string }[];
  ficha: [string, string][];
  habs: Hab[]; notaPrecio: string;
  incluye: [string, string][];
  incluido: { t: string; p: string; img: string; alt: string }[];
  // puntos: la foto ancha de la palapa con sus puntos explicados (x, y en % del marco de 16 a 10; componente Puntos)
  palapa: { s: string; o: string; texto: string; img: string; alt: string; imgPag?: string; altPag?: string; galeria: [string, string][]; incluye: [string, string][]; puntos?: { img: string; alt: string; lista: { x: number; y: number; t: string; p: string }[] } };
  ofertas: [string, string][];
  cierre: { s: string; o: string };
  pasos: string[];
  heroes: Record<'habitaciones' | 'celebraciones' | 'ubicacion' | 'contacto' | 'planes', string>;
  celebrar: string[];
  trabajo: { img: string; s: string; o: string; texto: string; alta?: boolean; datos: [string, string][]; sello: [string, string] };
  // Páginas interiores: las cinco fotos del mosaico de Habitaciones (en el orden de la retícula), la escena de
  // grupos y las distancias en minutos que se muestran en grande en Ubicación
  mosaico: string[];
  grupos: { img: string; alt: string; datos: [string, string][]; sello: [string, string] };
  distancias: [number, string, string][];
  planesFotos: Record<string, string>;
  pagos: [string, string, string];
  // Fotos y video (el material sale del banco con scripts/material.mjs)
  galeria: [string, string][];
  videos: VideoH[];
  cine: { s: string; o: string; texto: string };
  instagram: [string, string][];
};
// forma: vertical (9:16) u horizontal (4:3). ambiente: toma corta sin sonido que corre sola.
export type VideoH = { id: string; forma: 'vertical' | 'horizontal'; titulo: string; texto: string; dur: string; fecha: string; cartel: string; cartelAlt: string; ambiente?: boolean };

const qa: Hotel = {
  id: 'qa', nombre: 'Hotel Quinta Azul', corto: 'Quinta Azul', sitio: 'https://hotelquintaazul.com', rutaHabs: 'hospedaje',
  descripcion: 'Hotel con alberca y palapa en el centro de García, Nuevo León, a dos cuadras de la plaza. Nueve habitaciones con vista a la sierra, para 1 a 4 personas, desde $900\u00A0+\u00A0IVA por noche.',
  clave: 'Hotel con alberca en García, Nuevo León',
  wa: '528129218643', tel: '81 2921 8643', telLink: '+528129218643', turnstile: '0x4AAAAAAEp0Zwo-xpt7mMKF', correo: 'hotelquintaazul02@gmail.com', ig: '@hotelquintaazul', igUrl: 'https://www.instagram.com/hotelquintaazul/', facebook: 'https://www.facebook.com/profile.php?id=61557575860076',
  redes: [['instagram', 'Instagram @hotelquintaazul', 'https://www.instagram.com/hotelquintaazul/'], ['facebook', 'Facebook', 'https://www.facebook.com/profile.php?id=61557575860076'], ['tiktok', 'TikTok @hotel.quinta.azul', 'https://www.tiktok.com/@hotel.quinta.azul']],
  rutaPalapa: 'celebraciones', fundado: '2024-03-23',
  dir1: 'Bernardo Reyes esquina con Garza Ayala', dir2: 'Centro, García, N.L.', calle: 'Bernardo Reyes esquina con Garza Ayala, Centro',
  lat: 25.8153871, lng: -100.5947355, pin: [66, 22], pinCel: [50, 22],
  rating: 4.9, resenas: 125, resenasAl: '17 de noviembre de 2026', habitaciones: 9,
  dist: { monterrey: 30, grutas: 15, grutasKm: 9.5, xenpal: 11 },   // Xenpal y Grutas, comprobados en Google Maps el 13 de noviembre de 2026
  resena: 'Excelente lugar para descansar. Cuenta con pantalla, refri y microondas; el trato muy agradable y cuartos súper limpios. Recomendado 100 de 100.',
  hero: { img: 'edificio-escalera-atardecer-hotel-quinta-azul.jpg', ancha: 'edificio-escalera-atardecer-horizontal-hotel-quinta-azul.jpg', alt: 'Patio y edificio de dos pisos del Hotel Quinta Azul al atardecer, en García, Nuevo León', l1: 'Descansa con', o: 'la sierra de fondo', frase: 'A dos cuadras de la plaza de García: 9 habitaciones con vista a la sierra, alberca hasta las 10\u00A0PM y palapa con asador.' },
  ventana: { mas: [{ img: 'habitacion-dos-camas-queen-de-frente-hotel-quinta-azul.jpg', alt: 'Habitación con dos camas queen del Hotel Quinta Azul' }, { img: 'edificio-patio-cielo-de-atardecer-hotel-quinta-azul.jpg', alt: 'El edificio de habitaciones del Hotel Quinta Azul y su patio, al atardecer' }], img: 'alberca-sierra-atardecer-hotel-quinta-azul.jpg', alt: 'La alberca del Hotel Quinta Azul al atardecer, con la sierra de García al fondo', s: 'Un hotel pequeño,', o: 'hecho para descansar', texto: 'García tiene otro ritmo que Monterrey, y se nota desde que llegas. Dejas el carro, abres la habitación y por la ventana aparece la sierra. Lo que sigue lo decides tú: una tarde en el agua, una caminata al centro para cenar, una carne asada con la familia o simplemente dormir sin ruido. Con solo nueve habitaciones, en el Hotel Quinta Azul el trato es de casa.', pie: 'La alberca, abierta todos los días hasta las 10\u00A0PM' },
  cifras: [{ valor: 10, sufijo: 'PM', texto: 'cierra la alberca, todos los días' }, { valor: 60, sufijo: '', texto: 'personas en la palapa con asador' }, { valor: 30, sufijo: 'min', texto: 'de Monterrey en auto' }],
  ficha: [['reloj', 'Entrada 2\u00A0PM · salida 11\u00A0AM'], ['edificio', '9 habitaciones, de 1 a 4 personas'], ['auto', 'Estacionamiento dentro del hotel'], ['wifi', 'WiFi en todo el hotel']],
  habs: [
    { id: 'habitacion', nombre: 'Habitación con vista a la sierra', corto: 'Habitación', personas: 4, para: 'De 1 a 4 personas', camas: '2 camas queen', precio: 900, texto: 'Las nueve habitaciones son iguales: vista a la sierra, dos camas queen y espacio para hasta cuatro personas. El precio cambia según cuántos se quedan.',
      // Las nueve habitaciones son iguales (documento de cambios del 17 de noviembre de 2026): ya no hay tarifa
      // sencilla y doble. Las fotos son las de las dos fichas anteriores, sin repetir ninguna.
      fotos: [['habitacion-camas-queen-pantalla-closet-hotel-quinta-azul.jpg', 'La habitación del Hotel Quinta Azul vista desde la cama, con pantalla, clóset y frigobar'], ['habitacion-dos-camas-queen-abanico-hotel-quinta-azul.jpg', 'Las dos camas queen de la habitación'], ['mueble-pantalla-microondas-frigobar-hotel-quinta-azul.jpg', 'Clóset, pantalla, frigobar y microondas en la habitación'], ['escritorio-espejo-orquidea-hotel-quinta-azul.jpg', 'Escritorio con espejo y silla en la habitación'], ['bano-regadera-cancel-hotel-quinta-azul.jpg', 'Baño privado con regadera y cancel de vidrio'], ['habitacion-doble-dos-camas-hotel-quinta-azul.jpg', 'Habitación con dos camas queen y abanico de techo'], ['habitacion-camas-frigobar-pantalla-hotel-quinta-azul.jpg', 'Frigobar y microondas junto a las camas'], ['escritorio-laptop-luz-de-tarde-hotel-quinta-azul.jpg', 'Escritorio con espejo junto a la ventana'], ['habitacion-camas-cojines-lampara-hotel-quinta-azul.jpg', 'Cabecera de madera, lámpara y cojines'], ['cama-cojines-orquidea-detalle-hotel-quinta-azul.jpg', 'Detalle de la cama con orquídea']] }
  ],
  notaPrecio: 'Precios por noche, más IVA.',
  incluye: [['montana', 'Vista a la sierra'], ['frio', 'Aire acondicionado'], ['tv', 'Televisión'], ['refri', 'Frigobar'], ['micro', 'Microondas'], ['ducha', 'Baño con agua caliente'], ['ok', 'Toallas, shampoo y jabón'], ['wifi', 'WiFi'], ['auto', 'Estacionamiento'], ['alberca', 'Alberca']],
  incluido: [
    { t: 'Alberca hasta las 10\u00A0PM', p: 'Alberca principal y chapoteadero, con la sierra de fondo.', img: 'alberca-atardecer-palmas-hotel-quinta-azul.jpg', alt: 'Alberca con palmas al atardecer' },
    { t: 'Palapa con asador', p: 'Hasta 60 personas, con asador, bancos y televisión grande.', img: 'palapa-barra-bancos-alberca-al-fondo-hotel-quinta-azul.jpg', alt: 'La palapa del Hotel Quinta Azul, junto a la alberca' },
    { t: 'Estacionamiento', p: 'Dentro del hotel, toda tu estancia.', img: 'estacionamiento-con-autos-hotel-quinta-azul.jpg', alt: 'Estacionamiento privado dentro del hotel' },
    { t: 'WiFi y escritorio', p: 'Trabaja en la mañana, nada en la tarde.', img: 'escritorio-espejo-orquidea-hotel-quinta-azul.jpg', alt: 'Escritorio con espejo y silla en la habitación' }
  ],
  palapa: { s: 'Palapa con asador', o: 'para tus reuniones', texto: 'Hay reuniones que no caben en la sala de la casa. Para esas está la palapa: hasta 60 personas junto a la alberca, con asador, bancos, televisión grande, refrigerador, microondas, abanicos y baños. Cumpleaños, posadas, la carne asada del domingo o el partido en la pantalla grande con toda la familia. La música alta se vale hasta las 8 de la noche, y cuando la reunión se alarga, el cuarto está a unos pasos.',
    img: 'palapa-asador-barra-atardecer-hotel-quinta-azul.jpg', alt: 'La palapa del Hotel Quinta Azul, con asador, junto a la alberca',
    // En Celebraciones este bloque enseña otra foto: la de arriba es también la de «punto por punto», dos pantallas abajo
    imgPag: 'palapa-asador-columnas-atardecer-hotel-quinta-azul.jpg', altPag: 'El asador de la palapa del Hotel Quinta Azul, entre columnas de azulejo',
    galeria: [['patio-edificio-arbol-palma-hotel-quinta-azul.jpg', 'El patio para convivir'], ['alberca-sierra-cielo-rosa-hotel-quinta-azul.jpg', 'La sierra de fondo'], ['patio-habitaciones-desde-arriba-hotel-quinta-azul.jpg', 'Las habitaciones, a unos pasos'], ['edificio-azul-patio-atardecer-hotel-quinta-azul.jpg', 'El hotel al atardecer']],
    // Confirmado por el hotel el 18 de noviembre de 2026: bancos (no barra), televisión grande y música alta hasta las 8 PM
    incluye: [['gente', 'Hasta 60 personas'], ['asador', 'Asador'], ['sillon', 'Bancos'], ['tv', 'Televisión grande'], ['refri', 'Refrigerador y microondas'], ['abanico', 'Abanicos'], ['ducha', 'Baños exteriores'], ['alberca', 'Junto a la alberca']],
    puntos: { img: 'palapa-asador-barra-atardecer-hotel-quinta-azul.jpg', alt: 'La palapa del Hotel Quinta Azul: asador, bancos y abanicos de techo',
      lista: [{ x: 11, y: 50, t: 'Asador', p: 'Ustedes traen la comida; lo demás ya está aquí.' }, { x: 58, y: 60, t: 'Bancos', p: 'Para cenar, platicar y ver el partido mientras sale la carne asada.' },
        { x: 72, y: 29, t: 'Abanicos y sombra', p: 'Techo completo y abanicos para las tardes de calor.' }, { x: 40, y: 84, t: 'Hasta 60 personas', p: 'Espacio abierto para acomodar a tus invitados, a unos pasos de la alberca.' }] } },
  // Descuentos confirmados el 18 de noviembre de 2026
  ofertas: [['Más de 3 días', 'baja el precio por noche'], ['Grupos de 3 habitaciones o más', 'precio según personas y habitaciones'], ['Empresas con más de 3 personas', '2\u00A0% de descuento']],
  cierre: { s: 'Guárdalo para tu', o: 'próxima fiesta' },
  pasos: ['Desde Monterrey toma la carretera a García (Monterrey-García).', 'Sigue derecho hasta el centro de García.', 'Gira en Bernardo Reyes; estamos en la esquina con Garza Ayala.', 'Estaciona dentro del hotel, sin costo.'],
  heroes: { habitaciones: 'habitacion-camas-cojines-lampara-hotel-quinta-azul.jpg', celebraciones: 'palapa-barra-bancos-alberca-al-fondo-hotel-quinta-azul.jpg', ubicacion: 'sierra-camino-a-xenpal-cerca-hotel-quinta-azul.jpg', contacto: 'edificio-azul-patio-atardecer-hotel-quinta-azul.jpg', planes: 'sierra-canon-camino-a-xenpal-cerca-hotel-quinta-azul.jpg' },
  celebrar: ['alberca-flotadores-camastro-hotel-quinta-azul.jpg', 'palapa-barra-bancos-luz-de-tarde-hotel-quinta-azul.jpg', 'palapa-asador-barra-atardecer-hotel-quinta-azul.jpg', 'alberca-atardecer-palmas-hotel-quinta-azul.jpg'],
  trabajo: { img: 'escritorio-laptop-luz-de-tarde-hotel-quinta-azul.jpg', alta: true, s: 'Trabaja desde un', o: 'lugar diferente', texto: 'A unos 8 minutos del corredor industrial de García. WiFi en todas las habitaciones, escritorio, estacionamiento gratis y factura.',
    datos: [['wifi', 'WiFi en todas las habitaciones'], ['auto', 'Estacionamiento dentro del hotel, sin costo'], ['ok', 'Factura para tu empresa']], sello: ['8', 'minutos del corredor industrial'] },
  mosaico: ['cama-cojines-orquidea-detalle-hotel-quinta-azul.jpg', 'escritorio-espejo-orquidea-hotel-quinta-azul.jpg', 'habitacion-closet-pantalla-frigobar-hotel-quinta-azul.jpg', 'habitacion-camas-frigobar-pantalla-hotel-quinta-azul.jpg', 'bano-regadera-cancel-hotel-quinta-azul.jpg'],
  grupos: { img: 'patio-habitaciones-desde-arriba-hotel-quinta-azul.jpg', alt: 'El patio y las habitaciones del Hotel Quinta Azul, vistos desde arriba al atardecer',
    datos: [['etiqueta', 'Más de 3 días: baja el precio por noche'], ['gente', 'Grupos de 3 habitaciones o más: precio a la medida'], ['factura', 'Empresas con más de 3 personas: 2\u00A0% de descuento'], ['auto', 'Estacionamiento dentro del hotel']], sello: ['9', 'habitaciones en dos plantas'] },
  distancias: [[30, 'Monterrey', 'Por la carretera a García'], [15, 'Grutas de García', '9.5 km'], [11, 'Xenpal', 'Sobre el camino a las Grutas'], [3, 'Plaza principal', 'En auto; también se llega a pie']],
  planesFotos: { grutas: 'grutas-de-garcia-interior-cerca-hotel-quinta-azul.jpg', distancias: 'terraza-vista-sierra-atardecer-hotel-quinta-azul.jpg', palapa: 'palapa-barra-bancos-luz-de-tarde-hotel-quinta-azul.jpg', trabajo: 'escritorio-espejo-orquidea-hotel-quinta-azul.jpg', alberca: 'alberca-atardecer-palmas-hotel-quinta-azul.jpg', xenpal: 'xenpal-entrada-arco-letrero-cerca-hotel-quinta-azul.jpg' },
  pagos: ['factura', 'Facturamos', 'Factura para tus gastos de viaje.'],
  galeria: [
    ['habitacion-doble-dos-camas-hotel-quinta-azul.jpg', 'Habitación con dos camas queen y abanico de techo'],
    ['escritorio-espejo-orquidea-hotel-quinta-azul.jpg', 'Escritorio con espejo y silla'],
    ['mueble-pantalla-microondas-frigobar-hotel-quinta-azul.jpg', 'Clóset, pantalla, frigobar y microondas'],
    ['habitacion-dos-camas-queen-pantalla-hotel-quinta-azul.jpg', 'Las camas con la pantalla y el clóset al fondo'],
    ['bano-regadera-cancel-hotel-quinta-azul.jpg', 'Baño privado con regadera y cancel de vidrio'],
    ['habitacion-dos-camas-queen-abanico-hotel-quinta-azul.jpg', 'Las dos camas queen vistas de frente'],
    ['cama-cojines-orquidea-detalle-hotel-quinta-azul.jpg', 'Detalle de la cama con orquídea'],
    ['habitacion-camas-frigobar-pantalla-hotel-quinta-azul.jpg', 'Frigobar y microondas junto a las camas'],
    ['escritorio-laptop-luz-de-tarde-hotel-quinta-azul.jpg', 'Escritorio junto a la ventana'],
    ['habitacion-camas-cojines-lampara-hotel-quinta-azul.jpg', 'Cabecera de madera, lámpara y cojines'],
    ['habitacion-closet-pantalla-frigobar-hotel-quinta-azul.jpg', 'Clóset, pantalla y frigobar frente a las camas'],
    ['habitacion-camas-queen-pantalla-closet-hotel-quinta-azul.jpg', 'La habitación vista desde la cama'],
    ['patio-habitaciones-desde-arriba-hotel-quinta-azul.jpg', 'El patio y las habitaciones, vistos desde arriba'],
    ['pasillo-vista-sierra-atardecer-hotel-quinta-azul.jpg', 'El pasillo de las habitaciones, con vista a la sierra'],
    ['alberca-atardecer-palmas-hotel-quinta-azul.jpg', 'La alberca al atardecer, a unos pasos de las habitaciones']
  ],
  videos: [
    { id: 'como-llegar', forma: 'vertical', titulo: 'Cómo llegar al hotel', texto: 'De la carretera a nuestra puerta, en un minuto.', dur: '1:04', fecha: '2026-10-15', cartel: 'alberca-sierra-cielo-rosa-hotel-quinta-azul.jpg', cartelAlt: 'La alberca del Hotel Quinta Azul con la sierra al fondo' },
    { id: 'xenpal', forma: 'horizontal', titulo: 'Planes cerca: Xenpal', texto: 'Animales, tractor y sierra, a 11 minutos del hotel.', dur: '0:51', fecha: '2026-10-20', cartel: 'xenpal-entrada-arco-letrero-cerca-hotel-quinta-azul.jpg', cartelAlt: 'Entrada de Xenpal con la sierra de García al fondo' }
  ],
  cine: { s: 'Míralo antes', o: 'de venir', texto: 'Dos videos cortos, grabados aquí: el camino hasta nuestra puerta y un plan que queda a 15 minutos.' },
  instagram: [
    ['instagram-1-del-otro-lado.jpg', 'Publicación: del otro lado te esperan días diferentes'],
    ['instagram-2-a-30-minutos.jpg', 'Publicación: a solo 30 minutos de Monterrey'],
    ['instagram-3-alberca.jpg', 'Publicación: alberca, buena vista y tiempo para descansar'],
    ['instagram-4-resenas.jpg', 'Publicación: 4.9 de 5 en las reseñas de Google'],
    ['instagram-5-trabaja.jpg', 'Publicación: trabaja desde un lugar diferente'],
    ['instagram-6-preguntas.jpg', 'Publicación: lo que no preguntan, también hay alberca']
  ]
};

const la: Hotel = {
  id: 'la', nombre: 'Hotel Los Arcos Inn', corto: 'Los Arcos Inn', sitio: 'https://www.hotelarcosinn.com', rutaHabs: 'habitaciones',
  descripcion: 'Hotel con jardín en el centro de García, Nuevo León, a 15 minutos de las Grutas de García. Habitaciones sencillas y triples, departamentos con cocina, alberca con chapoteadero y palapa techada para huéspedes.',
  clave: 'Hotel cerca de las Grutas de García, Nuevo León',
  wa: '528126155485', tel: '81 2615 5485', telLink: '+528126155485', turnstile: '0x4AAAAAAEp0gFQd6jsJHiw2', correo: 'losarcos105@gmail.com', ig: '@losarcosinn105', igUrl: 'https://www.instagram.com/losarcosinn105/', facebook: 'https://www.facebook.com/profile.php?id=100063553089595',
  redes: [['instagram', 'Instagram @losarcosinn105', 'https://www.instagram.com/losarcosinn105/'], ['facebook', 'Facebook', 'https://www.facebook.com/profile.php?id=100063553089595'], ['tiktok', 'TikTok @los_arcos_inn', 'https://www.tiktok.com/@los_arcos_inn']],
  rutaPalapa: 'palapa', fundado: '2019-03-01',
  dir1: 'Mariano Escobedo 105-A, entre Bernardo Reyes y Morelos', dir2: 'Centro, García, N.L.', calle: 'Mariano Escobedo 105-A, entre Bernardo Reyes y Morelos, Centro',
  // Punto del perfil de Google («Hotel Los Arcos Inn», comprobado el 13 de noviembre de 2026). Las de la web anterior
  // (25.8163, -100.5945) quedaban unos 250 m al noreste.
  lat: 25.8148343, lng: -100.5971123, pin: [34, 22], pinCel: [28, 22],
  rating: 4.6, resenas: 133, resenasAl: '17 de noviembre de 2026', habitaciones: 8,
  dist: { monterrey: 30, grutas: 15, grutasKm: 9.5, xenpal: 10 },   // Xenpal: 10 minutos según el documento de cambios del 17 de noviembre de 2026
  resena: 'Me encantó el lugar, está muy bonito y amplio; las habitaciones súper limpias y la alberca también. Lo recomiendo ampliamente y claro que sí regreso.',
  hero: { img: 'fachada-arcos-alberca-reflejo-atardecer-hotel-los-arcos-inn.jpg', ancha: 'fachada-arcos-alberca-reflejo-atardecer-horizontal-hotel-los-arcos-inn.jpg', alt: 'Fachada naranja con arcos y alberca del Hotel Los Arcos Inn al atardecer, en García, Nuevo León', l1: 'Descanso, familia y', o: 'momentos para recordar', frase: 'Habitaciones desde $900\u00A0+\u00A0IVA y departamentos con cocina, con jardín, alberca y chapoteadero, a 15 minutos de las Grutas de García.' },
  ventana: { mas: [{ img: 'arcos-palmas-patio-atardecer-hotel-los-arcos-inn.jpg', alt: 'Arcos de dos niveles y palmas en el patio del Hotel Los Arcos Inn, al atardecer' }, { img: 'alberca-cascada-muro-verde-atardecer-hotel-los-arcos-inn.jpg', alt: 'La alberca del Hotel Los Arcos Inn, con cascada y muro verde, al atardecer' }], zoom: 1.28, foco: '50% 84%', img: 'jardin-alberca-desde-un-arco-atardecer-hotel-los-arcos-inn.jpg', alt: 'El jardín y la alberca del Hotel Los Arcos Inn vistos a través de uno de sus arcos, al atardecer', s: 'El lugar que le da nombre', o: 'a Los Arcos Inn', texto: 'En el Hotel Los Arcos Inn lo primero que se nota es el verde. Detrás de los arcos hay un jardín amplio en pleno centro de García, donde los niños corren hacia el agua y los grandes se sientan a la sombra de la palapa. Desde 2019 recibimos a familias que vienen a las Grutas, a una fiesta en alguna quinta o a ver a los suyos desde Texas.', pie: 'La alberca y el jardín, abiertos hasta las 10\u00A0PM' },
  cifras: [{ valor: 15, sufijo: 'min', texto: 'a las Grutas de García' }, { valor: 42, sufijo: '', texto: 'huéspedes caben en el hotel' }, { valor: 10, sufijo: 'PM', texto: 'hora en que cierra la alberca' }],
  ficha: [['reloj', 'Entrada 2\u00A0PM · salida 11\u00A0AM'], ['olla', 'Departamentos con cocina'], ['auto', 'Estacionamiento gratis'], ['wifi', 'WiFi gratis'], ['tarjeta', 'Efectivo y tarjeta']],
  habs: [
    // Documento de cambios del 17 de noviembre de 2026: 2 sencillas (1 o 2 personas), 4 triples (3 a 6) y 2 departamentos
    // (4 a 8). La habitación doble ya no se vende. Todos los precios son «desde» y sin IVA.
    { id: 'sencilla', nombre: 'Habitación sencilla', corto: 'Sencilla', personas: 2, para: '1 o 2 personas', camas: '1 cama queen', precio: 900, texto: 'Para quien viene solo o en pareja, por trabajo o de paso. Hay dos, cada una con cama queen, aire acondicionado, televisión, frigobar, microondas y baño.', incluye: [['cama', 'Cama queen'], ['frio', 'Aire acondicionado'], ['tv', 'Televisión'], ['refri', 'Frigobar'], ['micro', 'Microondas'], ['ducha', 'Baño']],
      fotos: [['recamara-cama-queen-detalle-hotel-los-arcos-inn.jpg', 'Habitación sencilla con cama queen del Hotel Los Arcos Inn'], ['habitacion-sencilla-cama-queen-hotel-los-arcos-inn.jpg', 'La cama queen vista de frente, con aire acondicionado'], ['bano-lavabo-negro-toallas-hotel-los-arcos-inn.jpg', 'Baño privado con lavabo'], ['departamento-escritorio-para-trabajar-hotel-los-arcos-inn.jpg', 'Escritorio con WiFi']] },
    { id: 'triple', nombre: 'Habitación triple', corto: 'Triple', personas: 6, para: '3 a 6 personas', camas: '3 camas queen, una con sofá cama', precio: 1500, texto: 'La habitación de las familias, en la planta alta: tres camas queen, y una de ellas tiene además sofá cama, con aire acondicionado, televisión, microondas y baño. Espacio para que nadie duerma apretado y para que la plática siga antes de apagar la luz. Hay cuatro.', incluye: [['cama', 'Tres camas queen, una con sofá cama'], ['frio', 'Aire acondicionado'], ['tv', 'Televisión'], ['micro', 'Microondas'], ['ducha', 'Baño']],
      fotos: [['habitacion-dos-camas-de-lado-hotel-los-arcos-inn.jpg', 'Habitación con camas queen del Hotel Los Arcos Inn'], ['departamento-escritorio-para-trabajar-hotel-los-arcos-inn.jpg', 'Escritorio con WiFi']] },
    { id: 'depa', nombre: 'Departamento con cocina', corto: 'Departamento', personas: 8, para: 'De 4 a 8 personas', camas: '4 camas en 2 recámaras', precio: 2000, texto: 'Cuatro camas, cocina, sala, comedor y baño. Para quedarse varios días, desayunar en casa y salir a las Grutas sin prisa.', incluye: [['cama', 'Cuatro camas'], ['olla', 'Cocina'], ['sillon', 'Sala'], ['comida', 'Comedor'], ['ducha', 'Baño']],
      fotos: [['departamento-sala-sofa-pantalla-grande-hotel-los-arcos-inn.jpg', 'Sala del departamento con sofá y pantalla'], ['departamento-cocina-barra-bancos-hotel-los-arcos-inn.jpg', 'Cocina equipada con barra para cuatro'], ['departamento-dos-recamaras-hotel-los-arcos-inn.jpg', 'Las dos recámaras vistas desde la sala'], ['recamara-cama-queen-detalle-hotel-los-arcos-inn.jpg', 'Recámara con cama queen'], ['recamara-dos-camas-hotel-los-arcos-inn.jpg', 'Recámara con dos camas'], ['departamento-bano-regadera-cancel-hotel-los-arcos-inn.jpg', 'Baño con regadera y cancel de vidrio'], ['departamento-sala-pantalla-luz-de-tarde-hotel-los-arcos-inn.jpg', 'Sala del segundo departamento'], ['departamento-cocina-luz-de-tarde-hotel-los-arcos-inn.jpg', 'Cocina y comedor del segundo departamento'], ['departamento-recamara-dos-camas-rosa-hotel-los-arcos-inn.jpg', 'Recámara con dos camas del segundo departamento'], ['departamento-closet-con-equipaje-hotel-los-arcos-inn.jpg', 'Clóset abierto, cómoda y espejo'], ['departamento-sala-vista-al-jardin-hotel-los-arcos-inn.jpg', 'La sala, con vista a la alberca']] }
  ],
  notaPrecio: 'Precios por noche, más IVA.',
  // Lo que comparten todas las unidades; lo de cada tipo va en su «incluye» (la triple no trae frigobar)
  incluye: [['ducha', 'Baño privado'], ['wifi', 'WiFi'], ['auto', 'Estacionamiento'], ['alberca', 'Alberca y chapoteadero'], ['hoja', 'Jardín'], ['asador', 'Palapa con asador']],
  incluido: [
    { t: 'Alberca y chapoteadero', p: 'Abiertos hasta las 10\u00A0PM, rodeados de jardín.', img: 'alberca-flotadores-camastros-atardecer-hotel-los-arcos-inn.jpg', alt: 'Alberca y chapoteadero en el jardín' },
    { t: 'Palapa techada', p: 'Con asador, para los huéspedes, rodeada de jardín.', img: 'fachada-palapa-puerta-de-cerca-atardecer-hotel-los-arcos-inn.jpg', alt: 'La palapa techada vista desde la alberca, al atardecer' },
    { t: 'Jardín y áreas verdes', p: 'Palmas y pasto para convivir sin salir del hotel.', img: 'jardin-palmas-atardecer-hotel-los-arcos-inn.jpg', alt: 'Jardín del hotel al atardecer' },
    { t: 'Departamentos con cocina', p: 'Dos recámaras, sala y cocina para estancias largas.', img: 'departamento-cocina-luz-de-tarde-hotel-los-arcos-inn.jpg', alt: 'Cocina y comedor de un departamento, con luz de tarde' }
  ],
  // La palapa es solo para huéspedes: no se rentan eventos (documento de cambios del 17 de noviembre de 2026)
  palapa: { s: 'Palapa techada con asador', o: 'para los huéspedes', texto: 'De regreso de las Grutas, la familia se junta en la palapa: alguien prende el asador, otro pone el partido en la tele y la mesa grande se llena. Tiene parrilla de gas y lavabo, y es solo para huéspedes, así que siempre está entre conocidos.',
    img: 'palapa-arco-asador-mesa-atardecer-hotel-los-arcos-inn.jpg', alt: 'La palapa del Hotel Los Arcos Inn: arco naranja, asador de ladrillo y mesa, con luz de atardecer',
    galeria: [['jardin-alberca-entre-palmas-hotel-los-arcos-inn.jpg', 'El jardín, junto a la palapa'], ['alberca-jardin-desde-arriba-atardecer-hotel-los-arcos-inn.jpg', 'La alberca vista desde arriba'], ['arcos-dos-niveles-palmas-patio-hotel-los-arcos-inn.jpg', 'Arcos y palmas'], ['alberca-vista-aerea-hotel-los-arcos-inn.jpg', 'El jardín y la alberca entre los árboles']],
    incluye: [['casa', 'Techo completo'], ['asador', 'Asador y parrilla de gas'], ['agua', 'Lavabo'], ['tv', 'Televisión'], ['comida', 'Mesa de jardín con sillas'], ['hoja', 'Rodeada de jardín']],
    puntos: { img: 'palapa-asador-barra-pantalla-hotel-los-arcos-inn.jpg', alt: 'La palapa del Hotel Los Arcos Inn: asador de ladrillo, parrilla de gas, mesa con sillas, pantalla y abanicos de techo',
      lista: [{ x: 53, y: 40, t: 'Asador de ladrillo', p: 'De carbón, con su campana. Ustedes ponen lo que se va a asar.' }, { x: 39, y: 51, t: 'Parrilla de gas', p: 'Para calentar tortillas, frijoles y guisos junto al asador.' },
        { x: 72, y: 63, t: 'Mesa y sillas', p: 'Para comer a la sombra, con el jardín enfrente.' }, { x: 93, y: 31, t: 'Televisión', p: 'Para ver el partido mientras sale la cena.' }, { x: 37, y: 16, t: 'Abanicos de techo', p: 'Dos abanicos y techo completo para las tardes de calor.' }] } },
  ofertas: [['Reserva con tiempo', 'mejor precio'], ['Desde 3 habitaciones', 'tarifa de grupo']],
  cierre: { s: '¿Tienes plan', o: 'para el feriado?' },
  pasos: ['Sal de Monterrey por la carretera a García (avenida Heberto Castillo).', 'Entra al centro del pueblo.', 'Busca la calle Mariano Escobedo, entre Bernardo Reyes y Morelos: verás los arcos naranjas.', 'El estacionamiento es privado y está dentro del hotel.'],
  heroes: { habitaciones: 'departamento-sala-vista-al-jardin-hotel-los-arcos-inn.jpg', celebraciones: 'jardin-alberca-entre-palmas-hotel-los-arcos-inn.jpg', ubicacion: 'sierra-camino-a-xenpal-cerca-hotel-los-arcos-inn.jpg', contacto: 'alberca-jardin-desde-arriba-atardecer-hotel-los-arcos-inn.jpg', planes: 'sierra-canon-camino-a-xenpal-cerca-hotel-los-arcos-inn.jpg' },
  celebrar: ['alberca-flotadores-camastros-atardecer-hotel-los-arcos-inn.jpg', 'jardin-palmas-atardecer-hotel-los-arcos-inn.jpg', 'arcos-palmas-patio-atardecer-hotel-los-arcos-inn.jpg', 'palapa-asador-barra-pantalla-hotel-los-arcos-inn.jpg'],
  trabajo: { img: 'departamento-escritorio-para-trabajar-hotel-los-arcos-inn.jpg', s: 'Si vienes a trabajar', o: 'a García', texto: 'Muy cerca del corredor industrial. Estacionamiento privado gratis, WiFi, factura y departamentos por semana o mes para proyectos largos.',
    datos: [['wifi', 'WiFi y escritorio'], ['auto', 'Estacionamiento privado, sin costo'], ['ok', 'Factura para tu empresa'], ['cama', 'Departamento por semana o mes']], sello: ['2', 'departamentos con cocina'] },
  mosaico: ['departamento-cocina-barra-bancos-hotel-los-arcos-inn.jpg', 'recamara-cama-queen-detalle-hotel-los-arcos-inn.jpg', 'habitacion-sencilla-cama-queen-hotel-los-arcos-inn.jpg', 'departamento-recamara-dos-camas-rosa-hotel-los-arcos-inn.jpg', 'bano-lavabo-negro-toallas-hotel-los-arcos-inn.jpg'],
  grupos: { img: 'arcos-dos-niveles-palmas-patio-hotel-los-arcos-inn.jpg', alt: 'Los dos niveles de arcos del Hotel Los Arcos Inn, con palmas y luz de tarde',
    datos: [['etiqueta', 'Tarifa de grupo desde 3 habitaciones'], ['cama', 'Departamentos con cocina para quedarse más'], ['auto', 'Estacionamiento privado para todos']], sello: ['8', 'habitaciones y departamentos'] },
  distancias: [[30, 'Monterrey', 'Por la carretera Monterrey-García'], [15, 'Grutas de García', 'y Los Faisanes'], [10, 'Xenpal', 'Sobre el camino a las Grutas'], [3, 'Plaza principal', 'Caminando por Morelos']],
  planesFotos: { grutas: 'grutas-de-garcia-interior-cerca-hotel-los-arcos-inn.jpg', distancias: 'alberca-jardin-desde-arriba-atardecer-hotel-los-arcos-inn.jpg', depa: 'departamento-cocina-barra-bancos-hotel-los-arcos-inn.jpg', trabajo: 'departamento-escritorio-para-trabajar-hotel-los-arcos-inn.jpg', xenpal: 'xenpal-llamas-atardecer-cerca-hotel-los-arcos-inn.jpg' },
  pagos: ['tarjeta', 'Efectivo y tarjeta', 'Aceptamos tarjeta y te damos factura.'],
  galeria: [
    ['departamento-sala-sofa-pantalla-grande-hotel-los-arcos-inn.jpg', 'Sala del departamento con sofá y pantalla'],
    ['departamento-dos-recamaras-hotel-los-arcos-inn.jpg', 'Las dos recámaras vistas desde la sala'],
    ['departamento-cocina-barra-bancos-hotel-los-arcos-inn.jpg', 'Cocina equipada con barra para cuatro'],
    ['recamara-cama-queen-detalle-hotel-los-arcos-inn.jpg', 'Recámara con cama queen'],
    ['bano-lavabo-negro-toallas-hotel-los-arcos-inn.jpg', 'Baño con lavabo y repisa de toallas'],
    ['recamara-dos-camas-hotel-los-arcos-inn.jpg', 'Recámara con dos camas'],
    ['departamento-sala-pantalla-luz-de-tarde-hotel-los-arcos-inn.jpg', 'Sala del segundo departamento'],
    ['departamento-cocina-luz-de-tarde-hotel-los-arcos-inn.jpg', 'Cocina y comedor del segundo departamento'],
    ['departamento-bano-regadera-cancel-hotel-los-arcos-inn.jpg', 'Baño con regadera y cancel de vidrio'],
    ['departamento-recamara-dos-camas-rosa-hotel-los-arcos-inn.jpg', 'Recámara con dos camas del segundo departamento'],
    ['departamento-closet-con-equipaje-hotel-los-arcos-inn.jpg', 'Clóset abierto, cómoda y espejo'],
    ['habitacion-sencilla-cama-queen-hotel-los-arcos-inn.jpg', 'La cama queen vista de frente'],
    ['departamento-escritorio-recamaras-hotel-los-arcos-inn.jpg', 'Escritorio en la sala del departamento'],
    ['departamento-sala-vista-al-jardin-hotel-los-arcos-inn.jpg', 'La sala, con vista a la alberca'],
    ['departamento-cocina-equipada-hotel-los-arcos-inn.jpg', 'La cocina con luz de tarde']
  ],
  videos: [
    { id: 'alberca', forma: 'vertical', ambiente: true, titulo: 'La alberca, tal cual', texto: 'Así se ve cualquier mañana.', dur: '0:13', fecha: '2026-10-15', cartel: 'video-alberca-hotel-los-arcos-inn.jpg', cartelAlt: 'Alberca, palmas y arcos del Hotel Los Arcos Inn' },
    { id: 'como-llegar', forma: 'vertical', titulo: 'De la plaza al hotel', texto: 'Caminando desde la plaza principal, a unas cuadras.', dur: '1:05', fecha: '2026-10-15', cartel: 'entrada-barda-naranja-letrero-hotel-los-arcos-inn.jpg', cartelAlt: 'Barda naranja con el logotipo de Los Arcos Inn, sobre la calle Mariano Escobedo' },
    { id: 'xenpal', forma: 'horizontal', titulo: 'Planes cerca: Xenpal', texto: 'Animales, tractor y sierra, a 10 minutos del hotel.', dur: '0:52', fecha: '2026-10-20', cartel: 'xenpal-entrada-arco-letrero-cerca-hotel-los-arcos-inn.jpg', cartelAlt: 'Entrada de Xenpal con la sierra de García al fondo' }
  ],
  cine: { s: 'Míralo antes', o: 'de venir', texto: 'La alberca tal cual, el camino desde la plaza y un plan que queda a 15 minutos. Todo grabado aquí.' },
  instagram: [
    ['instagram-1-el-nombre.jpg', 'Publicación: el lugar que le da nombre a Los Arcos Inn'],
    ['instagram-2-tu-estancia.jpg', 'Publicación: todo lo que tiene tu estancia'],
    ['instagram-3-alberca-jardin.jpg', 'Publicación: la alberca en el jardín'],
    ['instagram-4-van-cuatro.jpg', 'Publicación: ¿van cuatro personas a García?'],
    ['instagram-5-que-tan-cerca.jpg', 'Publicación: ¿qué tan cerca queda García?'],
    ['instagram-6-espacios.jpg', 'Publicación: hay detalles que hacen la diferencia']
  ]
};

export const HOTELES = { qa, la };
export const H: Hotel = HOTELES[__HOTEL__];
export const foto = (f: string) => H.id + '/' + f;
export const dinero = (n: number) => '$' + n.toLocaleString('es-MX');
// Descripción de una foto por su archivo: la que ya tiene en las habitaciones o en las galerías ('' si no hay)
const DESCRITAS = new Map<string, string>([...H.habs.flatMap((x) => x.fotos), ...H.palapa.galeria, ...H.galeria].filter(([, a]) => a).map(([f, a]) => [f, a] as [string, string]));
export const altDe = (archivo?: string) => (archivo && DESCRITAS.get(archivo)) || '';
export const waLink = (msg?: string) => 'https://wa.me/' + H.wa + '?text=' + encodeURIComponent(msg ?? 'Hola, quiero reservar en el ' + H.nombre);
export const mapsBuscar = () => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(H.nombre + ', ' + H.dir1 + ', García, Nuevo León');
export const mapsRuta = () => 'https://www.google.com/maps/dir/?api=1&destination=' + H.lat + ',' + H.lng;
export const wazeRuta = () => 'https://waze.com/ul?ll=' + H.lat + ',' + H.lng + '&navigate=yes';

// Punto de enfoque de una foto cuando un marco la recorta (panel, tarjeta, vista previa): qué parte debe verse.
// Sin dato, el centro. Se usa como estilo del marco: style={foco(foto)}; lo aplica la regla «--foco» de detalles.css.
const FOCOS: Record<string, string> = {
  'palapa-asador-columnas-atardecer-hotel-quinta-azul.jpg': '50% 12%',       // vertical con mucho piso: se ve la palapa
  'habitacion-dos-camas-queen-de-frente-hotel-quinta-azul.jpg': '50% 82%',   // las camas, no la pared
  'palapa-asador-barra-atardecer-hotel-quinta-azul.jpg': '50% 22%',          // la barra y los bancos, menos piso
  'terraza-vista-sierra-atardecer-hotel-quinta-azul.jpg': '80% 50%',         // la sierra, no la columna
  'departamento-escritorio-para-trabajar-hotel-los-arcos-inn.jpg': '64% 50%', // el escritorio, no la puerta
  'xenpal-llamas-atardecer-cerca-hotel-los-arcos-inn.jpg': '72% 50%',           // la llama blanca al centro
};
export const foco = (foto?: string) => (foto && FOCOS[foto] ? '--foco:' + FOCOS[foto] : undefined);
// Encuadre de una foto de portada en celular (la pantalla es vertical y solo cabe una franja de la foto apaisada)
const FOCOS_CEL: Record<string, string> = { 'habitacion-camas-cojines-lampara-hotel-quinta-azul.jpg': '10% 50%' };
export const focoCel = (foto?: string) => (foto && FOCOS_CEL[foto] ? '--foco-cel:' + FOCOS_CEL[foto] : undefined);
