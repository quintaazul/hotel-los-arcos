// Prepara para la web el material que mandan los hoteles (fotos y videos originales).
// Lee la carpeta del banco, que NO vive en el proyecto, y escribe en src/assets/<hotel>/.
// Uso: node scripts/material.mjs [fotos|videos|redes|todo] [carpeta del banco]
// Necesita ffmpeg en el PATH para los videos. Todo lo que hace está en las listas de abajo:
// para cambiar una foto o un video se cambia su renglón y se vuelve a correr.
import { mkdirSync, existsSync, rmSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import sharp from 'sharp';
import { acabar } from './acabado.mjs';

const que = process.argv[2] || 'todo';
// --solo=texto: de la lista elegida, procesa únicamente las fotos cuyo nombre contiene ese texto
const SOLO = (process.argv.find((x) => x.startsWith('--solo=')) || '').slice(7);
const BANCO = (process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '') || process.env.BANCO || 'E:/hoteles-contenido/03. CONTENIDO';
const F = join(BANCO, '3.1 BANCO DE AUDIOVISUALES/3.1.1 FOTOGRAFÍAS');
const V = join(BANCO, '3.1 BANCO DE AUDIOVISUALES/3.1.2 VÍDEOS');
const R = join(BANCO, '3.3 POST Y VIDEOS/2026');
const destino = (h, n) => { const d = join('src/assets', h); mkdirSync(d, { recursive: true }); return join(d, n); };
if (!existsSync(BANCO)) { console.error('No encuentro el banco de material en ' + BANCO); process.exit(1); }

// ───────── Estándar de fotos ─────────
// Lado largo máximo del original que guardamos (el sitio saca de aquí los tamaños chicos).
const LADO = 2400;
// Revelado: un ajuste corto y parejo para que las fotos de teléfono se vean del mismo mundo
// que las fotos ya editadas del sitio. [brillo, saturación, contraste, rojo, verde, azul]
const REVELADO = {
  telefono: [1.02, 1.06, 1.05, 1.015, 1.0, 0.975],   // iPhone y Samsung a tamaño completo
  whatsapp: [1.04, 1.1, 1.07, 1.025, 1.0, 0.96],     // fotos frías y planas reenviadas por WhatsApp
  rosado: [1.04, 1.06, 1.06, 1.012, 1.004, 0.972],      // el departamento de colchas rosas trae un tinte magenta
  paisaje: [1.0, 1.1, 1.06, 1.01, 1.0, 0.99],
  ninguno: [1, 1, 1, 1, 1, 1]
};
// Acabado común (scripts/acabado.mjs): la receta de color que lleva cada foto para que todas parezcan de la misma
// sesión. Se busca por hotel y nombre de la foto (sin «-cabecera» ni «-horizontal»: los recortes heredan la receta
// de su foto). Una foto con receta no lleva revelado: la receta ya hace ese trabajo. Las que no aparecen aquí
// entran tal cual (las de luz de tarde del diseñador, que son la referencia).
const INT_QA = ['cama-cojines-orquidea-detalle', 'escritorio-espejo-orquidea', 'habitacion-dos-camas-queen-abanico', 'habitacion-dos-camas-queen-pantalla', 'mueble-pantalla-microondas-frigobar', 'habitacion-doble-dos-camas',
  'habitacion-camas-cojines-lampara', 'habitacion-camas-frigobar-pantalla', 'habitacion-camas-pantalla-frigobar'];
const INT_LA = ['departamento-closet-con-equipaje', 'departamento-cocina-barra-bancos', 'departamento-cocina-equipada', 'departamento-dos-recamaras', 'departamento-escritorio-para-trabajar', 'departamento-sala-sofa-pantalla-grande',
  'departamento-sala-vista-al-jardin', 'recamara-dos-camas', 'recamara-cama-queen-detalle', 'bano-lavabo-negro-toallas', 'departamento-bano-regadera-cancel', 'departamento-recamara-dos-camas-rosa', 'departamento-escritorio-recamaras',
  'habitacion-doble-dos-camas', 'habitacion-sencilla-cama-queen', 'departamento-cocinando-en-la-estufa', 'cocinando-en-la-estufa-del-departamento'];
const ACABADO = {
  ...Object.fromEntries(INT_QA.map((n) => ['qa/' + n, 'interior-qa'])), ...Object.fromEntries(INT_LA.map((n) => ['la/' + n, 'interior-la'])),
  'qa/patio-edificio-arbol-palma-de-dia': 'dia', 'qa/sierra-de-garcia-panoramica-cerca': 'dia', 'qa/edificio-azul-patio-de-dia': 'dia-hdr',
  'qa/xenpal-taquilla-cabanas-cerca': 'dia', 'la/xenpal-taquilla-cabanas-cerca': 'dia', 'qa/xenpal-palapa-mirador-cerca': 'dia', 'la/xenpal-palapa-mirador-cerca': 'dia',
  'la/sierra-de-garcia-paredes-de-roca-cerca': 'dia-clara', 'la/alberca-vista-aerea-de-dia': 'dia-suave',
};
async function foto({ de, a, h, rev = 'telefono', corte, lado = LADO }) {
  if (SOLO && !a.includes(SOLO)) return;
  const hoteles = h === 'ambos' ? ['qa', 'la'] : [h];
  for (const hotel of hoteles) {
    const receta = ACABADO[hotel + '/' + a.replace(/-\{hotel\}.*$/, '').replace(/-(cabecera|horizontal)$/, '')];
    const [br, sat, con, r, g, b] = REVELADO[receta ? 'ninguno' : rev];
    let img = receta ? await acabar(de, receta) : sharp(de).rotate();
    if (corte) {
      const m = await img.raw().toBuffer({ resolveWithObject: true });
      const [x, y, w, al] = corte;   // fracciones del ancho y del alto
      img = sharp(m.data, { raw: { width: m.info.width, height: m.info.height, channels: m.info.channels } }).extract({ left: Math.round(x * m.info.width), top: Math.round(y * m.info.height), width: Math.round(w * m.info.width), height: Math.round(al * m.info.height) });
    }
    const nombre = a.replace('{hotel}', hotel === 'qa' ? 'hotel-quinta-azul' : 'hotel-los-arcos-inn');
    const info = await img
      .resize({ width: lado, height: lado, fit: 'inside', withoutEnlargement: true })
      .modulate({ brightness: br, saturation: sat })
      .linear(con, -(128 * (con - 1)))
      .recomb([[r, 0, 0], [0, g, 0], [0, 0, b]])
      .sharpen({ sigma: 0.5 })
      .jpeg({ quality: 88, mozjpeg: true })
      .toFile(destino(hotel, nombre));
    console.log(`  foto  ${hotel}/${nombre}  ${info.width}x${info.height}  ${Math.round(info.size / 1024)} KB${receta ? '  · acabado ' + receta : ''}`);
  }
}

const QA = join(F, 'Hotel Quinta');
const D1 = join(F, 'Hotel Arcos/Departamento Deluxe con 2 habitaciones/Departamento uno/PHOTO-2026-09-07-18-11-');
const D2 = join(F, 'Hotel Arcos/Departamento Deluxe con 2 habitaciones/Departamento dos/PHOTO-2026-09-07-18-11-');
const XE = join(F, 'Xenpal, se puede usar para los dos hoteles');
const FOTOS = [
  // Quinta Azul: habitación (las dos tarifas usan el mismo cuarto de dos camas queen)
  { h: 'qa', de: QA + '/Habitación doble/IMG_4833.jpeg', a: 'habitacion-dos-camas-queen-amplia-hotel-quinta-azul.jpg' },
  { h: 'qa', de: QA + '/Habitación doble/IMG_4842.jpeg', a: 'habitacion-dos-camas-queen-de-frente-hotel-quinta-azul.jpg' },
  { h: 'qa', de: QA + '/Habitación doble/IMG_4844.jpeg', a: 'habitacion-closet-pantalla-frigobar-hotel-quinta-azul.jpg' },
  { h: 'qa', de: QA + '/Habitación doble/IMG_4855.jpeg', a: 'habitacion-camas-queen-pantalla-closet-hotel-quinta-azul.jpg' },
  { h: 'qa', de: QA + '/Habitación doble/IMG_4834.jpeg', a: 'habitacion-frigobar-microondas-hotel-quinta-azul.jpg' },
  { h: 'qa', de: QA + '/Habitación doble/IMG_4854.jpeg', a: 'habitacion-cabecera-cojines-hotel-quinta-azul.jpg' },
  { h: 'qa', de: QA + '/Zona de estudio/IMG_4847.jpeg', a: 'escritorio-espejo-zona-de-trabajo-hotel-quinta-azul.jpg' },
  { h: 'qa', de: QA + '/Zona de estudio/IMG_4853.jpeg', a: 'escritorio-silla-cortina-hotel-quinta-azul.jpg' },
  { h: 'qa', de: QA + '/Baño/IMG_4866.jpeg', a: 'bano-privado-regadera-hotel-quinta-azul.jpg' },
  { h: 'qa', de: QA + '/Hotel exterior/WhatsApp Image 2026-10-15 at 10.27.04 AM (1).jpeg', a: 'patio-vista-aerea-hotel-quinta-azul-garcia.jpg', rev: 'ninguno' },
  { h: 'qa', de: QA + '/alberca/WhatsApp Image 2026-10-15 at 10.28.26 AM (1).jpeg', a: 'alberca-chapoteadero-de-dia-hotel-quinta-azul.jpg', rev: 'whatsapp' },
  // Los Arcos: los dos departamentos
  { h: 'la', de: D1 + '42(17).jpg', a: 'departamento-sala-sofa-pantalla-hotel-los-arcos-inn.jpg', rev: 'whatsapp' },
  { h: 'la', de: D1 + '42(22).jpg', a: 'departamento-cocina-barra-desayunador-hotel-los-arcos-inn.jpg', rev: 'whatsapp' },
  { h: 'la', de: D1 + '42(30).jpg', a: 'departamento-recamara-cama-queen-hotel-los-arcos-inn.jpg', rev: 'whatsapp' },
  { h: 'la', de: D1 + '42(20).jpg', a: 'departamento-recamara-dos-camas-hotel-los-arcos-inn.jpg', rev: 'whatsapp' },
  { h: 'la', de: D1 + '42(16).jpg', a: 'departamento-dos-recamaras-puertas-hotel-los-arcos-inn.jpg', rev: 'whatsapp' },
  { h: 'la', de: D1 + '42(5).jpg', a: 'departamento-closet-comoda-hotel-los-arcos-inn.jpg', rev: 'whatsapp' },
  { h: 'la', de: D1 + '42(28).jpg', a: 'departamento-escritorio-puertas-hotel-los-arcos-inn.jpg', rev: 'whatsapp' },
  { h: 'la', de: D1 + '42(7).jpg', a: 'bano-lavabo-negro-hotel-los-arcos-inn.jpg', rev: 'whatsapp' },
  { h: 'la', de: D1 + '42(35).jpg', a: 'habitacion-cama-queen-de-frente-hotel-los-arcos-inn.jpg', rev: 'whatsapp' },
  { h: 'la', de: D1 + '42(32).jpg', a: 'habitacion-dos-camas-de-lado-hotel-los-arcos-inn.jpg', rev: 'whatsapp' },
  { h: 'la', de: D2 + '42(15).jpg', a: 'departamento-sala-lila-pantalla-hotel-los-arcos-inn.jpg', rev: 'rosado' },
  { h: 'la', de: D2 + '42(16).jpg', a: 'departamento-cocina-comedor-hotel-los-arcos-inn.jpg', rev: 'rosado' },
  { h: 'la', de: D2 + '42(17).jpg', a: 'departamento-recamara-camas-rosas-hotel-los-arcos-inn.jpg', rev: 'rosado' },
  { h: 'la', de: D2 + '42(7).jpg', a: 'departamento-bano-regadera-hotel-los-arcos-inn.jpg', rev: 'rosado' },
  // Xenpal y la sierra: sirven a los dos hoteles (cada uno guarda su copia con su nombre)
  { h: 'ambos', de: XE + '/20261010_105336.jpg.jpeg', a: 'xenpal-entrada-letrero-sierra-cerca-{hotel}.jpg', rev: 'paisaje' },
  { h: 'ambos', de: XE + '/20261010_105313.jpg.jpeg', a: 'xenpal-taquilla-cabanas-cerca-{hotel}.jpg', rev: 'paisaje' },
  { h: 'ambos', de: XE + '/20261010_105448.jpg.jpeg', a: 'xenpal-palapa-mirador-cerca-{hotel}.jpg', rev: 'paisaje' },
  { h: 'ambos', de: XE + '/20261010_112051.jpg.jpeg', a: 'sierra-canon-camino-a-xenpal-cerca-{hotel}.jpg', rev: 'paisaje', corte: [0, 0.06, 0.9, 0.76] }
];

// ───────── Estándar de video ─────────
// H.264 con el arranque al principio del archivo (empieza a verse sin bajarlo completo).
// Verticales a 720x1280 con tope de 1.6 Mbps; horizontales a 1280 de ancho con tope de 2 Mbps.
// Así un minuto pesa unos 12 MB. Nunca más de 25 MB por archivo (límite de Cloudflare).
// «color»: filtro de ffmpeg para las tomas crudas (las del diseñador ya vienen editadas). COLOR_DIA es el mismo
// acabado suave de las fotos de día: un punto más cálido, con más cuerpo y más color.
const COLOR_DIA = 'colorchannelmixer=rr=1.03:bb=0.965,eq=contrast=1.06:saturation=1.2';
function video({ h, de, a, ancho, alto, crf = 27, tope = 1600, ini, dur, mudo = false, estable = false, cuadro, color }) {
  if (SOLO && !a.includes(SOLO)) return;
  const sal = destino(join(h, 'video'), a + '.mp4');
  const corte = [...(ini != null ? ['-ss', String(ini)] : []), ...(dur != null ? ['-t', String(dur)] : [])];
  let filtros = `scale=${ancho}:${alto}:flags=lanczos,setsar=1` + (color ? ',' + color : '');
  const tmp = join(tmpdir(), 'hoteles-estabiliza'); mkdirSync(tmp, { recursive: true });
  if (estable) {
    // Dos pasadas: mide el temblor de la mano y después lo compensa con un recorte mínimo.
    execFileSync('ffmpeg', ['-v', 'error', '-y', ...corte, '-i', de, '-an', '-vf', 'vidstabdetect=shakiness=6:accuracy=12:result=t.trf', '-f', 'null', '-'], { cwd: tmp, stdio: 'inherit' });
    filtros = `vidstabtransform=input=t.trf:smoothing=28:zoom=4:interpol=bicubic,unsharp=5:5:0.5,` + filtros;
  }
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...corte, '-i', de, '-vf', filtros, '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-maxrate', tope + 'k', '-bufsize', tope * 2 + 'k', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    ...(mudo ? ['-an'] : ['-c:a', 'aac', '-b:a', '96k', '-ac', '2']), join(process.cwd(), sal)], { cwd: tmp, stdio: 'inherit' });
  if (estable) rmSync(join(tmp, 't.trf'), { force: true });
  if (cuadro != null) execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(cuadro), '-i', sal, '-frames:v', '1', '-q:v', '2', destino(h, 'video-' + a + '-' + (h === 'qa' ? 'hotel-quinta-azul' : 'hotel-los-arcos-inn') + '.jpg')]);
  console.log(`  video ${h}/video/${a}.mp4  ${(statSync(sal).size / 1048576).toFixed(1)} MB`);
}
const VIDEOS = [
  { h: 'qa', de: R + '/Hotel Quinta Azul/Octubre/Vídeos/V1M10A26 - Cómo llegar al hotel/1. EDITADOS/Como llegar al hotel Quinta Azul.mp4', a: 'como-llegar', ancho: 720, alto: 1280 },
  { h: 'qa', de: R + '/Hotel Quinta Azul/Octubre/Vídeos/Planes cerca a Quinta Azul - Xenpal/Planes cerca a Quinta Azul - Xenpal.mp4', a: 'xenpal', ancho: 1280, alto: 960, tope: 2000 },
  { h: 'la', de: R + '/Hotel Los Arcos Inn/10 Octubre/Vídeos/V1M10A26 - Cómo llegar al hotel/1. EDITADOS/Reel De la plaza a los Arcos Inn.mp4', a: 'como-llegar', ancho: 720, alto: 1280 },
  { h: 'la', de: R + '/Hotel Los Arcos Inn/10 Octubre/Vídeos/Planes cerca a los Arcos Inn/Planes cerca a Los Arcos Inn - Xenpal.mp4', a: 'xenpal', ancho: 1280, alto: 960, tope: 2000 },
  // Toma de ambiente: la alberca de Los Arcos, del recorrido crudo (sin sonido y estabilizada)
  { h: 'la', de: V + '/Hotel Arcos/IMG_2277.MOV', a: 'alberca', ancho: 720, alto: 1280, crf: 27, ini: 649.5, dur: 13, mudo: true, estable: true, cuadro: 6, color: COLOR_DIA }
];
// Cuadros sueltos de los recorridos crudos que sirven como foto
const CUADROS = [
  { h: 'la', de: V + '/Hotel Arcos/IMG_2277.MOV', seg: 613, a: 'entrada-barda-naranja-logo-hotel-los-arcos-inn.jpg' },
  { h: 'la', de: V + '/Hotel Arcos/IMG_2277.MOV', seg: 1, a: 'plaza-principal-iglesia-garcia-cerca-hotel-los-arcos-inn.jpg' }
];

// ───────── Publicaciones de redes (tira de Instagram) ─────────
const IG_QA = R + '/Hotel Quinta Azul';
const IG_LA = R + '/Hotel Los Arcos Inn';
const REDES = [
  { h: 'qa', de: IG_QA + '/NOVIEMBRE/POST/Post-Del otro lado Quinta Azul/Del-Otro-lado-Post-Quinta-Azul.jpg', a: 'instagram-1-del-otro-lado.jpg' },
  { h: 'qa', de: IG_QA + '/SEPTIEMBRE/POST/A 30 mins de Monterrey/Carrusel-Quinta-Azul-A-30-mins-de-Monterrey-portada.jpg', a: 'instagram-2-a-30-minutos.jpg' },
  { h: 'qa', de: IG_QA + '/SEPTIEMBRE/POST/A 30 mins de Monterrey/Carrusel-Quinta-Azul-A-30-mins-de-Monterrey-slide-2.jpg', a: 'instagram-3-alberca.jpg' },
  { h: 'qa', de: IG_QA + '/Octubre/POST/Reseñas Google/Calificación-Google-Quinta-Azul.jpg', a: 'instagram-4-resenas.jpg' },
  { h: 'qa', de: IG_QA + '/SEPTIEMBRE/POST/Trabaja desde un lugar diferente/Carrusel-Quinta-Azul-trabaja-desde-cualquier-lugar.jpg', a: 'instagram-5-trabaja.jpg' },
  { h: 'qa', de: IG_QA + '/Octubre/POST/Carrusel Preguntas frecuentes/4 Carrusel-preguntas-frecuentes-Alberca-Quinta-Azul.jpg', a: 'instagram-6-preguntas.jpg' },
  { h: 'la', de: IG_LA + '/09 SEPTIEMBRE/POST/Nombre los arcos/Nombre-Los-Arcos-Inn.jpg', a: 'instagram-1-el-nombre.jpg' },
  { h: 'la', de: IG_LA + '/09 SEPTIEMBRE/POST/Carrusel presentacion/Carrusel-Los-Arcos-Inn-Portada.jpg', a: 'instagram-2-tu-estancia.jpg' },
  { h: 'la', de: IG_LA + '/09 SEPTIEMBRE/POST/Carrusel presentacion/Carrusel-Los-Arcos-Inn-Slide-2.jpg', a: 'instagram-3-alberca-jardin.jpg' },
  { h: 'la', de: IG_LA + '/09 SEPTIEMBRE/POST/Carrusel departamento 4 personas/Carrusel-van-4-personas-Los-Arcos-Inn-portada.jpg', a: 'instagram-4-van-cuatro.jpg' },
  { h: 'la', de: IG_LA + '/10 Octubre/Carruseles/C3M10A26 - ¿Qué tan lejos queda García_/1-Carrusel-Los-Arcos-Inn-que-tan-cerca-queda-portada.jpg', a: 'instagram-5-que-tan-cerca.jpg' },
  { h: 'la', de: IG_LA + '/10 Octubre/Carruseles/Carrusel hay espacios que marcan la diferencia/1-Carrusel-Los-Arcos-Inn-espacios-que-marcan-la-diferencia-portada.jpg', a: 'instagram-6-espacios.jpg' }
];

// ───────── Fotos ajustadas por el diseñador (las mismas de los posts) ─────────
// Llegaron el 10 de noviembre de 2026 en «Hoteles Mexico MTY/Imagenes hoteles/Imagenes Ajustadas». Parten de fotos
// reales del hotel y ya traen la luz, el color y el tamaño de los posts (verticales de 1856 × 2304), así que entran
// SIN revelado: son la referencia de estilo de todo el sitio. Cada renglón: clave del archivo → nombre en el sitio.
const DIS = process.env.DISENADOR || 'E:/hoteles-contenido/disenador/Hoteles Mexico MTY/Imagenes hoteles/Imagenes Ajustadas';
const DIS_LA = { '2ox8s8': 'fachada-naranja-palmas-flores', '3wm6hr': 'departamento-cocina-barra-bancos', '41tn17': 'departamento-cocina-equipada', '4dhtiq': 'jardin-alberca-desde-los-arcos-de-dia',
  '6urt5j': 'departamento-dos-recamaras', '7ipa9s': 'alberca-jardin-desde-arriba-atardecer', '97a67b': 'departamento-cocina-luz-de-tarde', 'ax1mbb': 'departamento-escritorio-para-trabajar',
  'egkue4': 'alberca-cascada-muro-verde-de-dia', 'fjqzz1': 'fachada-arcos-alberca-reflejo-atardecer', 'fncmr9': 'jardin-palmas-atardecer', 'g3yj7i': 'arcos-dos-niveles-palmas-patio',
  'hr4avw': 'departamento-sala-pantalla-luz-de-tarde', 'it24ps': 'recamara-cama-queen-detalle', 'j6vq5f': 'departamento-cocinando-en-la-estufa', 'l15gz0': 'departamento-sala-vista-al-jardin',
  'm8dati': 'arcos-palmas-patio-de-dia', 'o848o6': 'departamento-sala-sofa-pantalla-grande', 'r74yvs': 'jardin-alberca-desde-un-arco-atardecer', 'sg97w7': 'jardin-alberca-entre-palmas',
  'tblcq9': 'departamento-closet-con-equipaje', 'wh4asy': 'recamara-dos-camas', 'x8ajpx': 'alberca-palapa-arcos-atardecer', 'z2bmpp': 'alberca-flotadores-camastros-atardecer' };
const DIS_QA = { '3sjdk0': 'escritorio-espejo-orquidea', '4cmbbm': 'habitacion-dos-camas-queen-abanico', '52dk25': 'edificio-patio-cielo-de-atardecer', '8mxq00': 'habitacion-dos-camas-queen-pantalla',
  'a7ixu1': 'pasillos-dos-pisos-habitaciones', 'bjz81k': 'cama-cojines-orquidea-detalle', 'c3z8uy': 'patio-habitaciones-desde-arriba-de-dia', 'c7084w': 'edificio-escalera-atardecer',
  'ee4cq6': 'alberca-sierra-atardecer', 'eh48ha': 'bano-regadera-cancel', 'jfkqj0': 'habitacion-camas-pantalla-frigobar', 'n7ocd0': 'alberca-sierra-cielo-rosa', 'nj94cm': 'mueble-pantalla-microondas-frigobar',
  'odc37y': 'habitacion-doble-dos-camas', 's53mmn': 'alberca-flotadores-camastro-de-dia', 'sv41am': 'edificio-escalera-cielo-azul', 'tqcrru': 'estacionamiento-con-autos-de-dia', 'tw18x5': 'patio-edificio-palmas-cielo-azul',
  'vv1cfr': 'terraza-vista-sierra-atardecer', 'w8ftdl': 'escritorio-laptop-luz-de-tarde', 'wtemso': 'pasillo-vista-sierra-atardecer' };
// Lugares cerca: sirven a los dos hoteles
const DIS_CERCA = { 'Animales Xenpal': 'xenpal-venado', 'Entrada Xenpal': 'xenpal-entrada-arco-letrero', 'Grutas Garcia': 'grutas-de-garcia-interior', 'Llamas Xenpal': 'xenpal-llamas-atardecer',
  'Montañas Xenpal': 'sierra-camino-a-xenpal', 'Montañas': 'sierra-de-garcia-sobre-el-pueblo', 'Monterrey': 'monterrey-vista-de-la-ciudad', 'Xenpal Carro': 'xenpal-estacionamiento-entrada' };
function archivoGemini(carpeta, clave) {
  // los archivos se llaman «Gemini_Generated_Image_<clave>….jfif»; la clave son sus primeras 6 letras
  const f = readdirSync(`${DIS}/${carpeta}`).find((x) => x.startsWith('Gemini_Generated_Image_' + clave));
  if (!f) throw new Error('No encuentro la foto del diseñador ' + clave + ' en ' + carpeta);
  return `${DIS}/${carpeta}/${f}`;
}
const DISENADOR = [
  ...Object.entries(DIS_LA).map(([k, n]) => ({ h: 'la', de: () => archivoGemini('Hotel Los Arcos Inn', k), a: n + '-{hotel}.jpg', rev: 'ninguno' })),
  ...Object.entries(DIS_QA).map(([k, n]) => ({ h: 'qa', de: () => archivoGemini('Hotel Quinta Azul', k), a: n + '-{hotel}.jpg', rev: 'ninguno' })),
  ...Object.entries(DIS_CERCA).map(([k, n]) => ({ h: 'ambos', de: () => `${DIS}/Lugares Cerca/${k}.jfif`, a: n + '-cerca-{hotel}.jpg', rev: 'ninguno' })),
];

if (que === 'disenador' || que === 'todo') {
  if (!existsSync(DIS)) console.log('Sin la carpeta del diseñador (' + DIS + '): se salta');
  else { console.log('Fotos del diseñador'); for (const f of DISENADOR) await foto({ ...f, de: f.de() }); }
}
if (que === 'fotos' || que === 'todo') { console.log('Fotos'); for (const f of FOTOS) await foto(f); }

// ───────── Fotos retocadas con inteligencia artificial (10 de noviembre de 2026) ─────────
// Fotos reales del hotel que se llevaron al acabado del diseñador fuera del proyecto: misma escena, luz cálida,
// blancos limpios, sin objetos sueltos. El paquete que se mandó lo arma scripts/paquete-retoque.mjs y lo que regresó
// se revisa con scripts/recibir-retoque.mjs y scripts/medir-retoque.mjs. Solo entran las que mejoraron de verdad:
// las 15 del grupo B. Las 19 del grupo A («solo ampliar») regresaron estiradas, sin detalle nuevo, y no se usan.
// Corren después de «fotos» porque sustituyen a varias de esa lista. Entran sin revelado y hasta 3200 px de lado.
const RET = process.env.RETOCADAS || 'E:/hoteles-contenido/para-retocar/devueltas';
const devuelta = (clave) => { const f = readdirSync(RET).find((x) => x.toUpperCase().startsWith(clave)); if (!f) throw new Error('No encuentro la foto retocada ' + clave + ' en ' + RET); return RET + '/' + f; };
const RET_QA = { 'QA-B01': 'palapa-asador-barra-atardecer', 'QA-B02': 'palapa-barra-bancos-alberca-al-fondo', 'QA-B03': 'palapa-barra-bancos-luz-de-tarde', 'QA-B04': 'palapa-asador-columnas-atardecer',
  'QA-B05': 'habitacion-camas-cojines-lampara', 'QA-B06': 'habitacion-camas-frigobar-pantalla' };
const RET_LA = { 'LA-B01': 'palapa-arco-asador-mesa-atardecer', 'LA-B02': 'palapa-asador-barra-pantalla', 'LA-B03': 'habitacion-sencilla-cama-queen', 'LA-B04': 'habitacion-doble-dos-camas',
  'LA-B05': 'departamento-recamara-dos-camas-rosa', 'LA-B06': 'bano-lavabo-negro-toallas', 'LA-B07': 'departamento-bano-regadera-cancel', 'LA-B08': 'departamento-escritorio-recamaras', 'LA-B09': 'entrada-barda-naranja-letrero' };
// Cabeceras de las páginas interiores: una franja ancha y baja (2 a 1). De cada foto se guarda ese recorte aparte,
// con el mismo nombre más «-cabecera»; PortadaCorta lo usa en pantallas apaisadas y deja la foto completa para celular.
// [x, y, ancho, alto] en fracciones de la foto.
const CABECERAS = [
  { h: 'qa', de: () => devuelta('QA-B05'), a: 'habitacion-camas-cojines-lampara-cabecera-{hotel}.jpg', corte: [0, 0.3, 1, 0.6667] },
  { h: 'qa', de: () => devuelta('QA-B02'), a: 'palapa-barra-bancos-alberca-al-fondo-cabecera-{hotel}.jpg', corte: [0, 0.27, 1, 0.6667] },
  { h: 'ambos', de: () => DIS + '/Lugares Cerca/Montañas Xenpal.jfif', a: 'sierra-camino-a-xenpal-cerca-cabecera-{hotel}.jpg', corte: [0, 0.22, 1, 0.6696] },
];
if (que === 'retocadas' || que === 'todo') {
  if (!existsSync(RET)) console.log('Sin la carpeta de fotos retocadas (' + RET + '): se salta');
  else {
    console.log('Fotos retocadas');
    for (const [k, n] of Object.entries(RET_QA)) await foto({ h: 'qa', de: devuelta(k), a: n + '-{hotel}.jpg', rev: 'ninguno', lado: 3200 });
    for (const [k, n] of Object.entries(RET_LA)) await foto({ h: 'la', de: devuelta(k), a: n + '-{hotel}.jpg', rev: 'ninguno', lado: 3200 });
    console.log('Cabeceras');
    for (const c of CABECERAS) await foto({ ...c, de: c.de(), rev: 'ninguno', lado: 3200 });
  }
}
// ───────── Segunda ronda del retoque (10 de noviembre de 2026) ─────────
// Las fotos del sitio viejo que seguían en uso a 1080 px, ahora en alta: misma escena, con el detalle reconstruido
// (medidas con scripts/medir-retoque.mjs: nitidez media 2.2 contra el estirado normal). La primera es la portada
// del inicio de Quinta Azul en pantallas apaisadas; las cabeceras son recortes 2 a 1 de la misma escena que la foto
// vertical del diseñador, que sigue siendo la del celular. LA-A04 no se usa: es la alberca a mediodía y en su lugar
// va la versión de atardecer del diseñador.
const RET2 = process.env.RETOCADAS2 || 'E:/hoteles-contenido/para-retocar/devueltas-2';
const devuelta2 = (clave) => { const f = readdirSync(RET2).find((x) => x.toUpperCase().startsWith(clave)); if (!f) throw new Error('No encuentro la foto ' + clave + ' en ' + RET2); return RET2 + '/' + f; };
const RONDA2 = [
  { h: 'qa', k: 'QA-A01', a: 'edificio-escalera-atardecer-horizontal-{hotel}.jpg', lado: 3840 },
  { h: 'la', k: 'LA-A01', a: 'fachada-palapa-puerta-de-cerca-atardecer-{hotel}.jpg' },   // en reserva: no es la portada (ver arriba)
  { h: 'qa', k: 'QA-A02', a: 'edificio-azul-patio-de-dia-{hotel}.jpg' },
  { h: 'qa', k: 'QA-A02', a: 'edificio-azul-patio-de-dia-cabecera-{hotel}.jpg', corte: [0, 0.2, 1, 0.75] },
  { h: 'qa', k: 'QA-A03', a: 'alberca-atardecer-palmas-{hotel}.jpg' },
  { h: 'qa', k: 'QA-A05', a: 'patio-edificio-arbol-palma-de-dia-{hotel}.jpg' },
  { h: 'qa', k: 'QA-A06', a: 'sierra-de-garcia-panoramica-cerca-{hotel}.jpg' },
  { h: 'la', k: 'LA-A02', a: 'jardin-alberca-entre-palmas-cabecera-{hotel}.jpg', corte: [0, 0.1, 1, 0.8504] },
  { h: 'la', k: 'LA-A03', a: 'departamento-sala-vista-al-jardin-cabecera-{hotel}.jpg', corte: [0, 0.035, 1, 0.9294] },
  { h: 'la', k: 'LA-A11', a: 'alberca-vista-aerea-de-dia-{hotel}.jpg' },
  { h: 'la', k: 'LA-A12', a: 'cocinando-en-la-estufa-del-departamento-{hotel}.jpg' },
  { h: 'la', k: 'LA-A13', a: 'sierra-de-garcia-paredes-de-roca-cerca-{hotel}.jpg' },
];
if (que === 'ronda2' || que === 'retocadas' || que === 'todo') {
  if (!existsSync(RET2)) console.log('Sin la carpeta de la segunda ronda (' + RET2 + '): se salta');
  else { console.log('Segunda ronda'); for (const f of RONDA2) await foto({ h: f.h, de: devuelta2(f.k), a: f.a, corte: f.corte, rev: 'ninguno', lado: f.lado || 3200 }); }
}
// ───────── Tercera ronda del retoque (10 de noviembre de 2026) ─────────
// Lo que el acabado de color no puede hacer: cambiar la hora del día. Ocho fotos de día del propio hotel, reiluminadas
// a luz de tarde para que no desentonen junto a las de atardecer (misma escena, revisadas una por una contra su
// original), y los dos recortes del diseñador que faltaban en alta: la portada de Los Arcos en computadora (el recorte
// [0, .12, 1, .58] de la vertical «fjqzz1»; la foto LA-A01 de la segunda ronda es la misma fachada más de cerca y pierde
// por composición) y su cabecera de Contacto (recorte [0, .36, 1, .4028] de «7ipa9s»). El paquete lo arma
// scripts/ronda3-retoque.mjs. Las versiones de día siguen disponibles con el apellido «-de-dia».
const RET3 = process.env.RETOCADAS3 || 'E:/hoteles-contenido/para-retocar/devueltas-3';
const devuelta3 = (clave) => { const f = readdirSync(RET3).find((x) => x.toUpperCase().startsWith(clave)); if (!f) throw new Error('No encuentro la foto ' + clave + ' en ' + RET3); return RET3 + '/' + f; };
const RONDA3 = [
  { h: 'qa', k: 'QA-T01', a: 'alberca-flotadores-camastro-{hotel}.jpg' },
  { h: 'qa', k: 'QA-T02', a: 'patio-habitaciones-desde-arriba-{hotel}.jpg' },
  { h: 'qa', k: 'QA-T03', a: 'edificio-azul-patio-atardecer-{hotel}.jpg' },
  { h: 'qa', k: 'QA-T03', a: 'edificio-azul-patio-atardecer-cabecera-{hotel}.jpg', corte: [0, 0.2, 1, 0.75] },
  { h: 'qa', k: 'QA-T04', a: 'patio-edificio-arbol-palma-{hotel}.jpg' },
  { h: 'qa', k: 'QA-T05', a: 'estacionamiento-con-autos-{hotel}.jpg' },
  { h: 'la', k: 'LA-T01', a: 'alberca-cascada-muro-verde-atardecer-{hotel}.jpg' },
  { h: 'la', k: 'LA-T02', a: 'arcos-palmas-patio-atardecer-{hotel}.jpg' },
  { h: 'la', k: 'LA-T03', a: 'alberca-vista-aerea-{hotel}.jpg' },
  { h: 'la', k: 'LA-R01', a: 'fachada-arcos-alberca-reflejo-atardecer-horizontal-{hotel}.jpg', lado: 3840 },
  { h: 'la', k: 'LA-R02', a: 'alberca-jardin-desde-arriba-atardecer-cabecera-{hotel}.jpg', lado: 3840 },
];
if (que === 'ronda3' || que === 'retocadas' || que === 'todo') {
  if (!existsSync(RET3)) console.log('Sin la carpeta de la tercera ronda (' + RET3 + '): se salta');
  else { console.log('Tercera ronda'); for (const f of RONDA3) await foto({ h: f.h, de: devuelta3(f.k), a: f.a, corte: f.corte, rev: 'ninguno', lado: f.lado || 3200 }); }
}
if (que === 'redes' || que === 'todo') {
  console.log('Redes');
  for (const p of REDES) { const i = await sharp(p.de).resize({ width: 1080 }).jpeg({ quality: 86, mozjpeg: true }).toFile(destino(p.h, p.a)); console.log(`  post  ${p.h}/${p.a}  ${Math.round(i.size / 1024)} KB`); }
}
if (que === 'videos' || que === 'todo') {
  console.log('Videos');
  for (const v of VIDEOS) video(v);
  for (const c of CUADROS) {
    if (SOLO && !c.a.includes(SOLO)) continue;
    const tmp = join(tmpdir(), 'hoteles-cuadro.png');
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(c.seg), '-i', c.de, '-frames:v', '1', tmp]);
    await foto({ h: c.h, de: tmp, a: c.a, rev: 'telefono' });
  }
}
