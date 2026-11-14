// Tercera ronda del retoque con IA: lo que el acabado común (scripts/acabado.mjs) no puede hacer por sí solo.
//   Grupo T · «luz de tarde»: fotos de día del propio hotel que conviven en la misma página con fotos de atardecer.
//             El color ya es parejo; lo que cambia aquí es la hora del día, y eso solo se logra reiluminando.
//   Grupo R · «en alta»: dos recortes del diseñador que se muestran más grandes que sus píxeles.
// Arma E:/hoteles-contenido/para-retocar/ronda-3/<clave>/ con la foto, la captura del lugar donde va, las
// referencias exactas y la instrucción; deja RONDA-3.md y manifiesto-3.json; las devueltas van en «devueltas-3».
// Necesita los dos sitios compilados y servidos (4321 y 4322). Uso: node scripts/ronda3-retoque.mjs
import { RAIZ } from './_raiz.mjs';
import sharp from 'sharp';
import { readdirSync, mkdirSync, rmSync, existsSync, copyFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const P = RAIZ, PAQ = 'E:/hoteles-contenido/para-retocar', SAL = PAQ + '/ronda-3';
const AJ = 'E:/hoteles-contenido/disenador/Hoteles Mexico MTY/Imagenes hoteles/Imagenes Ajustadas';
const dis = (hotel, clave) => { const c = `${AJ}/${hotel === 'qa' ? 'Hotel Quinta Azul' : 'Hotel Los Arcos Inn'}`; return `${c}/${readdirSync(c).find((x) => x.includes(clave))}`; };
const r2 = (clave) => `${PAQ}/devueltas-2/${readdirSync(PAQ + '/devueltas-2').find((x) => x.toUpperCase().startsWith(clave))}`;
const puerto = { qa: 4321, la: 4322 }, nombreHotel = { qa: 'Hotel Quinta Azul', la: 'Hotel Los Arcos Inn' };

// de: foto que se manda · corte: si se manda solo un recorte · sitio: nombre de la foto en el sitio (para ubicarla en
// la página) · ruta: página donde se captura · refs: [archivo, por qué es la referencia] · pide: lo propio de esta foto
const FOTOS = [
  { c: 'QA-T01', h: 'qa', g: 'T', que: 'La alberca con flotadores y camastro', de: dis('qa', 's53mmn'), sitio: 'alberca-flotadores-camastro', ruta: '/celebraciones',
    uso: 'Inicio y Celebraciones: fila de fotos de la palapa', refs: [[dis('qa', 'ee4cq6'), 'la misma alberca ya resuelta al atardecer: esta es la luz y el cielo que se buscan'], [dis('la', 'z2bmpp'), 'la misma idea en el otro hotel: flotadores de colores con luz de tarde']],
    pide: 'Conserva los flotadores de colores, el camastro y las plantas tal como están. El agua sigue azul, con reflejos cálidos. El muro blanco toma un tono crema, no naranja.' },
  { c: 'QA-T02', h: 'qa', g: 'T', que: 'El patio y las habitaciones vistos desde arriba', de: dis('qa', 'c3z8uy'), sitio: 'patio-habitaciones-desde-arriba', ruta: '/hospedaje',
    uso: 'Hospedaje: galería «Míralas por dentro»', refs: [[dis('qa', '52dk25'), 'el mismo edificio ya resuelto al atardecer'], [dis('qa', 'c7084w'), 'la portada del sitio: mismo edificio, misma luz buscada']],
    pide: 'Las franjas azules del edificio se quedan azules. El piso del patio debe verse dorado y con sombras largas, no amarillo de mediodía. Puedes encender una luz cálida en el pasillo de las habitaciones, como en la referencia.' },
  { c: 'QA-T03', h: 'qa', g: 'T', que: 'El edificio azul y el patio, de día', de: r2('QA-A02'), sitio: 'edificio-azul-patio-de-dia', ruta: '/contacto',
    uso: 'Contacto: cabecera de la página (franja ancha, con el título blanco abajo a la izquierda)', refs: [[r2('QA-A01'), 'la portada del inicio: el mismo hotel al atardecer, con las luces del pasillo encendidas'], [dis('qa', '52dk25'), 'el mismo patio con cielo de atardecer']],
    pide: 'Va de fondo de un título blanco, abajo a la izquierda: esa zona (el piso del patio en sombra) debe quedar un poco más oscura y sin brillos. Quita el aspecto de colores exagerados: el azul del edificio se conserva, pero natural.' },
  { c: 'QA-T04', h: 'qa', g: 'T', que: 'El patio con el árbol, la palma y el muro', de: r2('QA-A05'), sitio: 'patio-edificio-arbol-palma', ruta: '/celebraciones',
    uso: 'Inicio y Celebraciones: fila de fotos', refs: [[dis('qa', '52dk25'), 'el mismo patio ya resuelto al atardecer'], [r2('QA-A01'), 'la portada del inicio: la luz que se busca']],
    pide: 'Conserva la sombra de la palma sobre el muro (alárgala y suavízala, como a esa hora). El marco azul del muro se queda azul.' },
  { c: 'QA-T05', h: 'qa', g: 'T', que: 'El estacionamiento con autos', de: dis('qa', 'tqcrru'), sitio: 'estacionamiento-con-autos', ruta: '/',
    uso: 'Inicio: foto chica dentro de la lista de lo que incluye la estancia', refs: [[dis('qa', 'vv1cfr'), 'la terraza del mismo hotel con la sierra al atardecer'], [dis('qa', 'wtemso'), 'el pasillo con la misma luz']],
    pide: 'Los autos se quedan exactamente igual (modelo, color y posición). La sierra del fondo toma la luz rosada de la referencia.' },
  { c: 'LA-T01', h: 'la', g: 'T', que: 'La alberca con la cascada y el muro verde, de día', de: dis('la', 'egkue4'), sitio: 'alberca-cascada-muro-verde-de-dia', ruta: '/celebraciones',
    uso: 'Inicio y Celebraciones: fila de fotos de la palapa', refs: [[dis('la', 'x8ajpx'), 'la misma alberca ya resuelta al atardecer'], [dis('la', 'z2bmpp'), 'la alberca con flotadores, misma luz buscada']],
    pide: 'El muro verde se conserva verde y la cascada igual. El agua sigue azul, con reflejos cálidos.' },
  { c: 'LA-T02', h: 'la', g: 'T', que: 'Los arcos, las palmas y el patio, de día', de: dis('la', 'm8dati'), sitio: 'arcos-palmas-patio-de-dia', ruta: '/celebraciones',
    uso: 'Inicio y Celebraciones: fila de fotos', refs: [[dis('la', 'g3yj7i'), 'el mismo patio de arcos ya resuelto con luz dorada'], [dis('la', 'fjqzz1'), 'la portada del sitio: el naranja de la fachada y el cielo que se buscan']],
    pide: 'El naranja de los muros es el color de la marca: se conserva, solo más cálido por la luz. El piso mojado puede quedarse, con reflejos dorados.' },
  { c: 'LA-T03', h: 'la', g: 'T', que: 'La alberca vista desde arriba, entre árboles', de: r2('LA-A11'), sitio: 'alberca-vista-aerea', ruta: '/celebraciones',
    uso: 'Inicio y Celebraciones: galería de la palapa', refs: [[dis('la', '7ipa9s'), 'la misma alberca vista desde arriba, ya resuelta al atardecer'], [dis('la', 'x8ajpx'), 'la alberca y la palapa con la misma luz']],
    pide: 'Las ramas y hojas del primer plano se conservan. El techo de teja toma un tono más cálido; el pasto, verde con luz dorada.' },
  { c: 'LA-R01', h: 'la', g: 'R', que: 'Portada del inicio: fachada, palmas, cielo y reflejo', de: dis('la', 'fjqzz1'), corte: [0, 0.12, 1, 0.58], sitio: 'fachada-arcos-alberca-reflejo-atardecer-horizontal', ruta: '/', factor: 2.07,
    uso: 'Inicio: la portada en computadora. Es lo primero que se ve; hoy mide 1856 px y en pantallas 2K y 4K se ve suave', refs: [] },
  { c: 'LA-R02', h: 'la', g: 'R', que: 'Cabecera de Contacto: la alberca y el jardín desde arriba', de: dis('la', '7ipa9s'), corte: [0, 0.36, 1, 0.4028], sitio: 'alberca-jardin-desde-arriba-atardecer-cabecera', ruta: '/contacto', factor: 2,
    uso: 'Contacto: cabecera de la página. Hoy mide 1856 px para una franja de 2000 px o más', refs: [] },
];
const TXT_T = (w, h) => `Edita la imagen 1, que es una foto real de un hotel tomada a mediodía, para que se vea tomada al final de la tarde, con la misma luz que las imágenes de referencia: sol bajo y cálido, cielo de atardecer (naranja y rosa cerca del horizonte, azul suave arriba), sombras largas y suaves, blancos cálidos sin quemar y colores vivos pero naturales. Es el mismo lugar y el mismo encuadre: conserva exactamente la arquitectura, los colores propios de muros y pisos, las plantas, los muebles y los objetos, cada uno en su sitio. No agregues personas, texto, marcas de agua ni objetos, y no quites nada. Debe seguir pareciendo una fotografía real, nítida, sin aspecto pintado ni plástico. Entrégala a ${w} × ${h} píxeles o más, con la misma proporción.`;
const TXT_R = (w0, h0, w, h) => `Esta imagen mide solo ${w0} × ${h0} píxeles y necesito una versión de alta resolución real, de ${w} × ${h} píxeles. Reconstruye el detalle fino que una imagen tan chica no alcanza a tener: bordes nítidos y textura real en hojas, pasto, agua, azulejo, teja, muros y cielo, como si la misma escena se hubiera fotografiado con una cámara de alta resolución. No cambies la escena: mismos objetos, misma composición, mismos colores y misma luz; no agregues ni quites nada, y no pongas texto ni marcas de agua. No sirve estirar la imagen ni solo enfocarla: al verla al 100 % deben aparecer detalles nuevos y bordes limpios, sin aspecto pintado ni plástico.`;

if (existsSync(SAL)) rmSync(SAL, { recursive: true, force: true });
mkdirSync(SAL, { recursive: true }); mkdirSync(PAQ + '/devueltas-3', { recursive: true });
const man = [], bloques = { T: [], R: [] };
for (const x of FOTOS) {
  const dir = `${SAL}/${x.c}`; mkdirSync(dir, { recursive: true });
  // 1. la foto, tal como está en su fuente (o su recorte, sin recomprimir de más)
  const f1 = `1-FOTO-A-RETOCAR__${x.c}.jpg`;
  if (x.corte) { const m = await sharp(x.de).rotate().metadata(), [a, b, c, d] = x.corte; await sharp(x.de).rotate().extract({ left: Math.round(a * m.width), top: Math.round(b * m.height), width: Math.round(c * m.width), height: Math.round(d * m.height) }).jpeg({ quality: 97, chromaSubsampling: '4:4:4' }).toFile(`${dir}/${f1}`); }
  else copyFileSync(x.de, `${dir}/${f1}`);
  const i = await sharp(`${dir}/${f1}`).rotate().metadata(), W = i.width, H = i.height;
  const pw = x.g === 'R' ? Math.round(W * x.factor / 16) * 16 : W, ph = x.g === 'R' ? Math.round(pw * H / W) : H;
  // 2. dónde va: captura de la página con la foto en su lugar
  const f2 = '2-DONDE-VA__captura-de-la-pagina.jpg';
  // la foto puede estar como <img>, como fuente de un <picture> o solo como enlace a su versión grande
  let captura = false;
  for (const sel of [`img[src*="${x.sitio}"]`, `picture:has(source[srcset*="${x.sitio}"])`, `[data-grande*="${x.sitio}"]`, `a[href*="${x.sitio}"]`]) {
    try { execFileSync(process.execPath, [P + 'scripts/foto-seccion.mjs', `http://127.0.0.1:${puerto[x.h]}${x.ruta}`, sel, `${dir}/${f2}`, '1080p', '--desfase=0.22'], { stdio: 'ignore' }); captura = true; break; } catch (e) { /* prueba el siguiente */ }
  }
  if (!captura) console.log(`   (sin captura del lugar para ${x.c}: no encontré la foto en ${x.ruta})`);
  // 3. referencias
  const adj = [[f1, 'la foto que se retoca'], ...(captura ? [[f2, `captura de la página: ${x.uso.toLowerCase()}. Solo sirve para entender el lugar; no se copia nada de ella`]] : [])];
  x.refs.forEach(([ruta, por], k) => { const f = `3-REFERENCIA-${k + 1}.jpg`; copyFileSync(ruta, `${dir}/${f}`); adj.push([f, 'referencia de luz y color: ' + por]); });
  const txt = (x.g === 'T' ? TXT_T(W, H) + ' ' + x.pide : TXT_R(W, H, pw, ph));
  writeFileSync(`${dir}/INSTRUCCION.txt`, `${x.c} · ${nombreHotel[x.h]} · ${x.que}\nDónde va: ${x.uso}\n\nQUÉ ADJUNTAR, EN ESTE ORDEN\n${(x.g === 'R' ? adj.slice(0, 1) : adj).map(([f, d], k) => `  Imagen ${k + 1}: ${f}  (${d})`).join('\n')}\n${x.g === 'R' ? '  (La captura 2-DONDE-VA es solo para ti: no se adjunta.)\n' : ''}\nINSTRUCCIÓN PARA PEGAR\n${txt}\n\nGUÁRDALA EN\n  ${PAQ}/devueltas-3/${x.c}.jpg\n`);
  man.push({ clave: x.c, hotel: x.h, grupo: x.g === 'R' ? 'A' : 'B', origen: `${dir}/${f1}`, ancho: W, alto: H, factor: x.g === 'R' ? x.factor : 1, pedirAncho: pw, pedirAlto: ph, uso: x.uso, que: x.que, sitio: x.sitio });
  bloques[x.g].push(`### ${x.c} · ${nombreHotel[x.h]} · ${x.que}\n\n- **Carpeta:** \`ronda-3/${x.c}\`\n- **Dónde va:** ${x.uso}\n- **Tamaño:** ${W} × ${H}${x.g === 'R' ? ` → **${pw} × ${ph}**` : ' (igual o mayor)'}\n${x.g === 'T' ? `- **Lo propio de esta foto:** ${x.pide}\n` : ''}`);
  console.log(`${x.c}  ${W}×${H}${x.g === 'R' ? ' → ' + pw + '×' + ph : ''}  ${x.que}`);
}
writeFileSync(PAQ + '/manifiesto-3.json', JSON.stringify(man, null, 2));
const md = `# Fotos para retocar · tercera ronda

## Cómo quedó el sitio antes de esta ronda

Ya no hay ninguna foto del sitio viejo ni sin acabado. Las 12 de la segunda ronda quedaron bien (ganaron detalle real y conservan la escena) y están puestas. Además, todas las fotos pasan ahora por un mismo acabado de color: los interiores comparten el mismo blanco cálido y las fotos de día comparten cielo, contraste y viveza con las del diseñador.

## Qué falta y por qué no lo puedo hacer yo

Lo único que el color no arregla es **la hora del día**. Hoy el sitio tiene dos luces: la de atardecer (la firma de los posts) y la de mediodía con cielo azul. Las dos son del diseñador y se ven bien, pero cuando una foto de mediodía queda al lado de una de atardecer se nota que no son de la misma sesión. Cambiar la hora de una foto es reiluminarla, y eso lo hace la IA, no un ajuste de color.

Por eso esta ronda son solo **${FOTOS.length} fotos**:

- **${bloques.T.length} de «luz de tarde»:** fotos de día del propio hotel que comparten página con fotos de atardecer.
- **${bloques.R.length} de «en alta»:** recortes del diseñador que se muestran más grandes que sus píxeles.

No mando las de la sierra, Xenpal ni las Grutas: son lugares que se visitan de día y ahí la luz de día es información, no un descuido.

## Cómo usar cada carpeta

Cada carpeta trae la foto (\`1-FOTO-A-RETOCAR\`), una captura de la página con la foto en su lugar (\`2-DONDE-VA\`), las referencias exactas de luz (\`3-REFERENCIA\`) y un \`INSTRUCCION.txt\` con el texto listo para pegar y el orden en que se adjuntan las imágenes.

Guarda cada resultado en la carpeta \`devueltas-3\` con el nombre de la clave (por ejemplo \`QA-T01.jpg\`).

## Cómo saber si sirvió, antes de mandármela

- **Luz de tarde:** ponla junto a la referencia 1. Deben parecer tomadas el mismo día a la misma hora. Revisa que no haya cambiado nada del lugar: mismas ventanas, mismas plantas, mismos muebles, mismos colores de muro.
- **En alta:** ábrela al 100 % y mira un borde fino (una hoja de palma, la orilla de la alberca). Si aparecen bordes limpios y textura que antes no estaba, sirvió.

---

## Luz de tarde (${bloques.T.length})

${bloques.T.join('\n')}
## En alta (${bloques.R.length})

Aquí solo se adjunta la foto; no se retoca nada. Si la herramienta tiene una función aparte de «ampliar» o «upscale», úsala y elige la resolución más alta.

${bloques.R.join('\n')}`;
writeFileSync(PAQ + '/RONDA-3.md', md);
console.log(`\n${FOTOS.length} fotos en ${SAL}  ·  instrucciones en ${PAQ}/RONDA-3.md  ·  devueltas en ${PAQ}/devueltas-3`);
