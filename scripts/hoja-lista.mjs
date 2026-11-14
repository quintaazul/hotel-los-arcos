// Hoja de miniaturas de una lista cualquiera de fotos, cada una con su rótulo. Sirve para mirar juntas fotos de
// carpetas distintas (por ejemplo, las del diseñador que no se usan, o un antes y después).
// Uso: node scripts/hoja-lista.mjs salida.jpg [--cols=6] [--an=300] [--al=300] ruta1 ruta2 …
//      Una ruta puede llevar rótulo propio: "rótulo=ruta"
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { dirname, basename } from 'node:path';
export async function hoja(salida, lista, { cols = 6, an = 300, al = 300 } = {}) {
  mkdirSync(dirname(salida), { recursive: true });
  const piezas = [];
  for (let k = 0; k < lista.length; k++) {
    const [rot, ruta] = lista[k].includes('=') ? [lista[k].slice(0, lista[k].indexOf('=')), lista[k].slice(lista[k].indexOf('=') + 1)] : [basename(lista[k]).replace(/-hotel.*$|\.(jpe?g|webp|png|jfif)$/gi, ''), lista[k]];
    const img = await sharp(ruta).rotate().resize({ width: an, height: al - 26, fit: 'contain', background: '#222' }).jpeg({ quality: 84 }).toBuffer();
    const t = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${an}" height="26"><rect width="100%" height="100%" fill="#111"/><text x="5" y="18" font-family="Arial" font-size="12.5" fill="#fff">${rot.replace(/[<>&]/g, '').slice(0, Math.floor(an / 6.6))}</text></svg>`);
    const x = (k % cols) * (an + 4), y = Math.floor(k / cols) * (al + 4);
    piezas.push({ input: img, left: x, top: y }, { input: t, left: x, top: y + al - 26 });
  }
  await sharp({ create: { width: cols * (an + 4), height: Math.ceil(lista.length / cols) * (al + 4), channels: 3, background: '#555' } }).composite(piezas).jpeg({ quality: 85 }).toFile(salida);
  return salida;
}
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('hoja-lista.mjs')) {
  const arg = process.argv.slice(2), op = (n, d) => +((arg.find((a) => a.startsWith('--' + n + '=')) || '').slice(n.length + 3) || d);
  const [salida, ...lista] = arg.filter((a) => !a.startsWith('--'));
  console.log(await hoja(salida, lista, { cols: op('cols', 6), an: op('an', 300), al: op('al', 300) }));
}
