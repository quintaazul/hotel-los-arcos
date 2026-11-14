// Todas las imágenes que se ven en un sitio, juntas en hojas, para juzgar a ojo si comparten identidad gráfica.
// Parte de la auditoría (scripts/auditar-imagenes.mjs). Cada miniatura lleva su número, su origen y su nombre.
// Uso: node scripts/hoja-auditoria.mjs qa|la [--por=28]
import { RAIZ } from './_raiz.mjs';
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
const hotel = process.argv[2], POR = +((process.argv.find((a) => a.startsWith('--por=')) || '').slice(6) || 28), COLS = 7, AN = 268, AL = 250;
const dir = `${RAIZ}src/assets/${hotel}/`, sal = RAIZ + '.capturas/auditoria';
const filas = JSON.parse(readFileSync(`${sal}/${hotel}.json`, 'utf8')).filter((f) => f.origen !== 'logotipo');
const corto = { 'banco con acabado': 'ACAB', 'diseñador': 'DIS', 'retocada con IA': 'RET', 'sitio viejo': 'VIEJA', 'banco (sin acabado)': 'BANCO', 'post de redes': 'POST', 'portada de video': 'VIDEO' };
const color = { ACAB: '#1d6b3a', DIS: '#1d6b3a', RET: '#1f5f8b', VIEJA: '#a33', BANCO: '#a33', POST: '#666', VIDEO: '#a33' };
for (let i = 0, h = 1; i < filas.length; i += POR, h++) {
  const piezas = [], lote = filas.slice(i, i + POR);
  for (let k = 0; k < lote.length; k++) {
    const f = lote[k], c = corto[f.origen] || '?';
    const img = await sharp(dir + f.archivo).resize({ width: AN, height: AL - 32, fit: 'contain', background: '#222' }).jpeg({ quality: 80 }).toBuffer();
    const rot = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${AN}" height="32"><rect width="100%" height="100%" fill="${color[c] || '#111'}"/><text x="6" y="21" font-family="Arial" font-size="13" fill="#fff">${i + k + 1} ${c} ${f.archivo.replace(/-hotel.*$|\.(jpg|webp|png)$/g, '').slice(0, 30)}</text></svg>`);
    const x = (k % COLS) * (AN + 5), y = Math.floor(k / COLS) * (AL + 5);
    piezas.push({ input: img, left: x, top: y }, { input: rot, left: x, top: y + AL - 32 });
  }
  const nombre = `${sal}/${hotel}-todas-${h}.jpg`;
  await sharp({ create: { width: COLS * (AN + 5), height: Math.ceil(lote.length / COLS) * (AL + 5), channels: 3, background: '#555' } }).composite(piezas).jpeg({ quality: 84 }).toFile(nombre);
  console.log(nombre);
}
