// Segunda ronda del retoque: las fotos del grupo A regresaron estiradas, sin detalle nuevo. Este script arma la lista
// de las que sí vale la pena repetir, con una instrucción distinta (reconstruir detalle, no «no cambies nada»).
// Las devueltas de esta ronda se guardan en «devueltas-2».
// Uso: node scripts/repetir-retoque.mjs
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
const PAQ = 'E:/hoteles-contenido/para-retocar';
const man = JSON.parse(readFileSync(PAQ + '/manifiesto.json', 'utf8'));
// prioridad y motivo de cada una
const REPETIR = {
  'QA-A01': ['Alta', 'Portada del inicio en computadora. Hoy usa un recorte de la foto vertical; con esta en alta se vería el edificio completo y nítido en pantallas 2K y 4K.'],
  'LA-A01': ['Alta', 'Portada del inicio en computadora. Igual que la de Quinta Azul: es lo primero que se ve.'],
  'QA-A03': ['Alta', 'Sigue en uso a 1080 px en el cuadro grande «Alberca hasta las 10 PM» y en tres lugares más.'],
  'QA-A05': ['Alta', 'Sigue en uso a 1080 px en Celebraciones y en la galería de la palapa.'],
  'QA-A02': ['Media', 'Cabecera de Contacto. Hoy usa un recorte de 1856 px: bien en 1080p, suave en 2K.'],
  'LA-A02': ['Media', 'Cabecera de Celebraciones. Hoy usa un recorte de 1856 px.'],
  'LA-A03': ['Media', 'Cabecera de Habitaciones. Hoy usa un recorte de 1856 px.'],
  'LA-A04': ['Media', 'Cabecera de Contacto. Hoy usa un recorte de 1856 px.'],
  'LA-A11': ['Media', 'Sigue en uso a 1600 px en la galería de la palapa.'],
  'QA-A06': ['Media', 'Sigue en uso a 1280 px.'],
  'LA-A12': ['Media', 'Sigue en uso a 1080 px en el plan de estancias largas.'],
  'LA-A13': ['Media', 'Sigue en uso a 1690 px.'],
};
const NO = ['QA-A04', 'LA-A05', 'LA-A06', 'LA-A07', 'LA-A08', 'LA-A09', 'LA-A10'];
const txt = (m) => `Esta imagen mide solo ${m.ancho} × ${m.alto} píxeles y necesito una versión de alta resolución real, de ${m.pedirAncho} × ${m.pedirAlto} píxeles. Reconstruye el detalle fino que una imagen tan chica no alcanza a tener: bordes nítidos y textura real en hojas, pasto, agua, azulejo, tela, muros y cielo, como si la misma escena se hubiera fotografiado con una cámara de alta resolución. No cambies la escena: mismos objetos, misma composición, mismos colores y misma luz; no agregues ni quites nada, y no pongas texto ni marcas de agua. No sirve estirar la imagen ni solo enfocarla: al verla al 100 % deben aparecer detalles nuevos y bordes limpios, sin aspecto pintado ni plástico.`;
mkdirSync(PAQ + '/repetir', { recursive: true }); mkdirSync(PAQ + '/devueltas-2', { recursive: true });
const filas = [];
for (const [clave, [prio, motivo]] of Object.entries(REPETIR)) {
  const m = man.find((x) => x.clave === clave); if (!m) throw new Error('No está en el manifiesto: ' + clave);
  const foto = PAQ + '/' + m.archivo, nombre = `${clave}__${m.archivo.split('__').pop()}`;
  copyFileSync(foto, `${PAQ}/repetir/${nombre}`);
  filas.push({ clave, prio, motivo, m, nombre });
}
const bloque = (p) => filas.filter((f) => f.prio === p).map((f) => `### ${f.clave} · ${f.m.que}\n\n- **Archivo:** \`repetir/${f.nombre}\`\n- **Por qué repetirla:** ${f.motivo}\n- **Tamaño:** ${f.m.ancho} × ${f.m.alto} → **${f.m.pedirAncho} × ${f.m.pedirAlto}** (por ${String(f.m.factor).replace('.', ',')})\n\n\`\`\`text\n${txt(f.m)}\n\`\`\`\n`).join('\n');
const md = `# Fotos para repetir (segunda ronda)

## Qué pasó

Las 15 fotos de «retocar y ampliar» quedaron bien y ya están en el sitio. Las 19 de «solo ampliar» regresaron con el tamaño pedido, pero **estiradas**: no traen detalle nuevo. Medidas contra su original ampliada de la forma normal, su nitidez es prácticamente la misma (1,10 de media; una ampliación de verdad da 1,4 o más). Un archivo de 4320 px con el detalle de uno de 1080 px pesa más y se ve igual, así que no las usé.

La causa más probable es la instrucción: decía «no cambies nada», y la herramienta la obedeció al pie de la letra devolviendo la misma imagen más grande. Hay que pedirle lo contrario: que reconstruya detalle.

## Qué cambia en esta ronda

1. **La instrucción.** Ahora pide reconstruir el detalle fino sin cambiar la escena. Va abajo, lista para pegar en cada foto.
2. **El ajuste de la herramienta.** Si tiene una función aparte de «ampliar» o «upscale», úsala en lugar de pedirlo por chat. Si deja elegir la resolución de salida (2K, 4K), elige la más alta en ese ajuste: escribir el tamaño en el texto no basta.
3. **Solo se adjunta la foto.** Sin capturas ni referencias: aquí no se retoca nada.

## Cómo saber si sirvió, antes de mandármela

Ábrela al 100 % y mira un borde fino: el marco de una ventana, una hoja de palma, la orilla de la alberca. Si se ve igual de borroso que la original agrandada, no sirvió. Si aparecen bordes limpios y textura que antes no estaba, sí.

## Dónde guardarlas

En la carpeta \`devueltas-2\`, con un nombre que empiece por la clave (por ejemplo \`QA-A01.jpg\`). Así no se confunden con las de la primera ronda.

## Son ${filas.length} fotos; las otras ${NO.length} no hace falta repetirlas

No hace falta repetir ${NO.join(', ')}: en esos lugares el sitio ya usa la versión vertical del diseñador, que tiene más resolución real.

---

## Prioridad alta (${filas.filter((f) => f.prio === 'Alta').length}): son las que más se notan

${bloque('Alta')}
## Prioridad media (${filas.filter((f) => f.prio === 'Media').length})

${bloque('Media')}`;
writeFileSync(PAQ + '/REPETIR.md', md);
console.log(`${filas.length} fotos por repetir en ${PAQ}/repetir  (instrucciones en REPETIR.md)`);
