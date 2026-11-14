// Antes y después, de cerca: recorta la misma zona de dos o más versiones de una foto y las pone lado a lado
// al tamaño real en que se verían (sin achicar), con un rótulo.
// Uso: node scripts/comparar-fotos.mjs salida.jpg <x%> <y%> <rotulo>=<ruta> <rotulo>=<ruta> ...
//   x%, y%: centro del recorte, en porcentaje del ancho y del alto. Todas las versiones se llevan al tamaño de la mayor.
import sharp from 'sharp';
const [salida, cx, cy, ...pares] = process.argv.slice(2);
const R = 620, versiones = pares.map((p) => { const i = p.indexOf('='); return { rotulo: p.slice(0, i), ruta: p.slice(i + 1) }; });
let W = 0, H = 0;
for (const v of versiones) { const m = await sharp(v.ruta).metadata(); v.w = m.width; v.h = m.height; if (m.width > W) { W = m.width; H = m.height; } }
const piezas = []; let k = 0;
for (const v of versiones) {
  const base = sharp(v.ruta).rotate().resize(W, H, { kernel: 'lanczos3', fit: 'fill' });
  const left = Math.max(0, Math.min(W - R, Math.round(W * cx / 100 - R / 2))), top = Math.max(0, Math.min(H - R, Math.round(H * cy / 100 - R / 2)));
  const img = await base.extract({ left, top, width: R, height: R }).jpeg({ quality: 90 }).toBuffer();
  const txt = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${R}" height="36"><rect width="100%" height="100%" fill="#111"/><text x="10" y="24" font-family="Arial" font-size="17" fill="#fff">${v.rotulo} · original ${v.w}×${v.h}</text></svg>`);
  piezas.push({ input: img, left: k * (R + 6), top: 0 }, { input: txt, left: k * (R + 6), top: R }); k++;
}
await sharp({ create: { width: k * (R + 6), height: R + 36, channels: 3, background: '#555' } }).composite(piezas).jpeg({ quality: 90 }).toFile(salida);
console.log(salida);
