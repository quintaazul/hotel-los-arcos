// Junta varias capturas en hojas de contacto para revisarlas de un vistazo.
// Uso: node scripts/hoja.mjs <carpeta> <prefijo> [columnas] [ancho de cada una]
import sharp from 'sharp';
import { readdirSync } from 'node:fs';
const [carpeta, prefijo, colsTxt = '2', anchoTxt = '720'] = process.argv.slice(2);
const cols = +colsTxt, ancho = +anchoTxt, porHoja = cols * 3;
const archivos = readdirSync(carpeta).filter((f) => f.startsWith(prefijo + '-') && f.endsWith('.jpg')).sort();
for (let h = 0; h * porHoja < archivos.length; h++) {
  const grupo = archivos.slice(h * porHoja, (h + 1) * porHoja);
  const piezas = await Promise.all(grupo.map(async (f) => {
    const img = sharp(`${carpeta}/${f}`).resize({ width: ancho });
    const buf = await img.toBuffer();
    const { height } = await sharp(buf).metadata();
    return { buf, height };
  }));
  const alto = Math.max(...piezas.map((p) => p.height));
  const filas = Math.ceil(grupo.length / cols);
  const lienzo = sharp({ create: { width: cols * ancho + (cols - 1) * 8, height: filas * alto + (filas - 1) * 8, channels: 3, background: '#ff00ff' } });
  const salida = `${carpeta}/hoja-${prefijo}-${h}.jpg`;
  await lienzo.composite(piezas.map((p, i) => ({ input: p.buf, left: (i % cols) * (ancho + 8), top: Math.floor(i / cols) * (alto + 8) }))).jpeg({ quality: 72 }).toFile(salida);
  console.log(salida, grupo.join(','));
}
