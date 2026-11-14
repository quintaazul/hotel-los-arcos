// Hoja de contacto: junta varias fotos de un hotel con su nombre y tamaño, para elegir a ojo.
// Uso: node scripts/hoja-fotos.mjs qa|la salida.jpg foto1 foto2 ...   (nombres dentro de src/assets/<hotel>/ o rutas completas)
import { RAIZ } from './_raiz.mjs';
import sharp from 'sharp';
import { existsSync } from 'node:fs';
const [hotel, salida, ...fotos] = process.argv.slice(2);
const dir = `${RAIZ}src/assets/${hotel}/`, AN = +(process.env.AN || 470), AL = +(process.env.AL || 360), COLS = +(process.env.COLS || 4), piezas = [];
let i = 0;
for (const f of fotos) {
  const ruta = existsSync(f) ? f : dir + f; if (!existsSync(ruta)) { console.log('no existe', f); continue; }
  const m = await sharp(ruta).metadata();
  const img = await sharp(ruta).resize({ width: AN, height: AL - 34, fit: 'contain', background: '#222' }).jpeg({ quality: 78 }).toBuffer();
  const nombre = f.split(/[\\/]/).pop().replace(/^Gemini_Generated_Image_(\w{6})\w*/, 'G-$1').replace(/-hotel.*$|\.(webp|jpe?g|png|jfif)$/g, '').replace(/[<>&]/g, '').slice(0, 46);
  const rotulo = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${AN}" height="34"><rect width="100%" height="100%" fill="#111"/><text x="8" y="22" font-family="Arial" font-size="15" fill="#fff">${i + 1}. ${nombre} · ${m.width}×${m.height}</text></svg>`);
  const x = (i % COLS) * (AN + 6), y = Math.floor(i / COLS) * (AL + 6);
  piezas.push({ input: img, left: x, top: y }, { input: rotulo, left: x, top: y + AL - 34 });
  i++;
}
await sharp({ create: { width: COLS * (AN + 6), height: Math.ceil(i / COLS) * (AL + 6), channels: 3, background: '#555' } }).composite(piezas).jpeg({ quality: 80 }).toFile(salida);
console.log(salida, i, 'fotos');
