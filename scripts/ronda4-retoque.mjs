// Cuarta ronda del retoque con IA (19 de noviembre de 2026): el hotel pidió quitar de las fotos de la palapa de Quinta
// Azul las varillas y los restos de construcción que se ven arriba, en la abertura del techo.
// Arma E:/hoteles-contenido/para-retocar/ronda-4/<clave>/ con la foto tal como está en el sitio, una copia con lo que se
// quita marcado en rojo y la instrucción lista para pegar; deja RONDA-4.md y manifiesto-4.json. Las fotos retocadas
// regresan a «devueltas-4» con el nombre de su clave. Revisarlas: node scripts/revision-retoque.mjs --carpeta=devueltas-4 --manifiesto=manifiesto-4.json
// Uso: node scripts/ronda4-retoque.mjs
import { RAIZ } from './_raiz.mjs';
import sharp from 'sharp';
import { mkdirSync, copyFileSync, writeFileSync } from 'node:fs';
const PAQ = 'E:/hoteles-contenido/para-retocar', SAL = PAQ + '/ronda-4', A = RAIZ + 'src/assets/qa/';

// zonas: rectángulos [x, y, ancho, alto] en fracciones de la foto, donde está lo que se quita
const FOTOS = [
  { c: 'QA-V01', sitio: 'palapa-asador-columnas-atardecer-hotel-quinta-azul.jpg', que: 'La palapa: asador entre columnas de azulejo, foto vertical',
    uso: 'Celebraciones («Qué incluye la palapa») y portada del artículo de la posada navideña',
    zonas: [[0.30, 0, 0.70, 0.215]],
    pide: 'Arriba, en la abertura del techo, se ven varillas de construcción, postes delgados, un bloque de concreto sin terminar con varillas a la derecha y cables cruzando el cielo. Quita todo eso y deja solo el cielo con sus nubes, la orilla blanca del techo limpia y recta, y la lámpara del poste azul a la izquierda.' },
  { c: 'QA-V02', sitio: 'palapa-asador-barra-atardecer-hotel-quinta-azul.jpg', que: 'La palapa: asador, barra y bancos rojos, foto horizontal',
    uso: 'Inicio y Celebraciones: foto grande de la palapa y la foto de «punto por punto»',
    zonas: [[0.52, 0, 0.26, 0.09]],
    pide: 'Arriba al centro, en la abertura del techo, asoman varillas de construcción contra el cielo. Quítalas y deja solo el cielo y la orilla blanca del techo, limpia y recta.' },
];
const BASE = 'Retoca esta fotografía de la palapa de un hotel. Conserva todo lo demás exactamente igual: el asador, los azulejos, los bancos rojos, el piso, los abanicos, las lámparas, la luz cálida de la tarde, los colores y el encuadre. No cambies el tamaño ni la proporción de la imagen, no agregues objetos ni personas, y no pongas texto ni marcas de agua. El cielo que quede donde estaban las cosas que se quitan debe verse natural, del mismo tono y con nubes que sigan a las de alrededor.';

mkdirSync(SAL, { recursive: true }); mkdirSync(PAQ + '/devueltas-4', { recursive: true });
const man = [], bloques = [];
for (const x of FOTOS) {
  const dir = `${SAL}/${x.c}`; mkdirSync(dir, { recursive: true });
  const f1 = `1-FOTO-A-RETOCAR__${x.c}.jpg`; copyFileSync(A + x.sitio, `${dir}/${f1}`);
  const i = await sharp(`${dir}/${f1}`).metadata(), W = i.width, H = i.height;
  // 2. la misma foto con lo que se quita marcado en rojo (solo para ubicarlo; no se adjunta)
  const g = Math.max(8, Math.round(W / 220));
  const marcas = x.zonas.map(([a, b, c, d]) => `<rect x="${Math.round(a * W)}" y="${Math.round(b * H) + g}" width="${Math.round(c * W) - g}" height="${Math.round(d * H) - g}" fill="none" stroke="#ff2a2a" stroke-width="${g}" rx="${g * 3}"/>`).join('');
  await sharp(`${dir}/${f1}`).composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${marcas}</svg>`) }]).jpeg({ quality: 85 }).toFile(`${dir}/2-QUE-SE-QUITA__marcado-en-rojo.jpg`);
  const txt = `${x.pide} ${BASE} La imagen mide ${W} × ${H} píxeles y la necesito de vuelta al mismo tamaño.`;
  writeFileSync(`${dir}/INSTRUCCION.txt`, `${x.c} · Hotel Quinta Azul · ${x.que}\nDónde va: ${x.uso}\n\nQUÉ ADJUNTAR\n  Imagen 1: ${f1}  (la foto que se retoca)\n  (La imagen 2-QUE-SE-QUITA es solo para ti: marca en rojo lo que hay que quitar. No se adjunta.)\n\nINSTRUCCIÓN PARA PEGAR\n${txt}\n\nGUÁRDALA EN\n  ${PAQ}/devueltas-4/${x.c}.jpg\n`);
  man.push({ clave: x.c, hotel: 'qa', grupo: 'B', origen: `${dir}/${f1}`, ancho: W, alto: H, factor: 1, pedirAncho: W, pedirAlto: H, uso: x.uso, que: x.que, sitio: x.sitio.replace(/-hotel-quinta-azul\.jpg$/, '') });
  bloques.push(`### ${x.c} · ${x.que}\n\n- **Carpeta:** \`ronda-4/${x.c}\`\n- **Dónde va:** ${x.uso}\n- **Tamaño:** ${W} × ${H} (igual)\n- **Qué se quita:** ${x.pide}\n`);
  console.log(`${x.c}  ${W}×${H}  ${x.que}`);
}
writeFileSync(PAQ + '/manifiesto-4.json', JSON.stringify(man, null, 2));
writeFileSync(PAQ + '/RONDA-4.md', `# Fotos para retocar · cuarta ronda (19 de noviembre de 2026)

El hotel pidió quitar de las fotos de la palapa de Quinta Azul las varillas y los restos de construcción que se ven arriba, en la abertura del techo. Son **2 fotos**; las otras dos fotos de la palapa no muestran el cielo.

## Cómo usar cada carpeta

Cada carpeta trae la foto tal como está en el sitio (\`1-FOTO-A-RETOCAR\`), una copia con lo que se quita marcado en rojo (\`2-QUE-SE-QUITA\`, solo para ubicarlo; no se adjunta) y un \`INSTRUCCION.txt\` con el texto listo para pegar.

Guarda cada resultado en la carpeta \`devueltas-4\` con el nombre de la clave (\`QA-V01.jpg\`, \`QA-V02.jpg\`).

## Cómo saber si sirvió, antes de mandármela

- Ya no hay varillas, postes ni concreto sin terminar contra el cielo.
- Todo lo demás sigue igual: mismos azulejos, mismos bancos, misma luz y mismo encuadre. Ponla junto a la original y pasa de una a otra: solo debe cambiar el cielo de arriba.

---

${bloques.join('\n')}`);
console.log('\nListo: ' + SAL);
