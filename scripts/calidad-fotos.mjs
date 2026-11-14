// ¿Cada foto tiene suficientes píxeles para el tamaño al que se muestra?
// Lista los originales de un hotel con su tamaño y avisa cuáles se quedan cortos para 2K y 4K.
// Uso: node scripts/calidad-fotos.mjs qa|la [--todas]
import { RAIZ } from './_raiz.mjs';
import sharp from 'sharp';
import { readdirSync, statSync } from 'node:fs';
const hotel = process.argv[2] === 'la' ? 'la' : 'qa', todas = process.argv.includes('--todas');
const dir = `${RAIZ}src/assets/${hotel}/`;
const filas = [];
for (const f of readdirSync(dir).filter((x) => /\.(jpe?g|png|webp|avif)$/i.test(x))) {
  const m = await sharp(dir + f).metadata(), st = await sharp(dir + f).stats();
  // nitidez aproximada: cuánto cambia la imagen de un píxel al vecino (más bajo = más borrosa)
  const { data, info } = await sharp(dir + f).resize({ width: 800 }).greyscale().raw().toBuffer({ resolveWithObject: true });
  let s = 0, n = 0; for (let y = 1; y < info.height - 1; y++) for (let x = 1; x < info.width - 1; x++) { const i = y * info.width + x; const l = 4 * data[i] - data[i - 1] - data[i + 1] - data[i - info.width] - data[i + info.width]; s += l * l; n++; }
  filas.push({ f, w: m.width, h: m.height, kb: Math.round(statSync(dir + f).size / 1024), nitidez: Math.round(Math.sqrt(s / n) * 10) / 10 });
}
filas.sort((a, b) => Math.max(a.w, a.h) - Math.max(b.w, b.h));
console.log(`${hotel.toUpperCase()}: ${filas.length} fotos. Lado largo: ${filas.filter((x) => Math.max(x.w, x.h) < 1400).length} con menos de 1400 px, ${filas.filter((x) => Math.max(x.w, x.h) >= 1400 && Math.max(x.w, x.h) < 2000).length} entre 1400 y 2000, ${filas.filter((x) => Math.max(x.w, x.h) >= 2000).length} con 2000 o más.`);
for (const x of filas) if (todas || Math.max(x.w, x.h) < 2000) console.log(`  ${String(x.w).padStart(5)}×${String(x.h).padEnd(5)} ${String(x.kb).padStart(5)} KB  nitidez ${String(x.nitidez).padStart(5)}  ${x.f}`);
