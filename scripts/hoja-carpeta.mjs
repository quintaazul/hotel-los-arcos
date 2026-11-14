// Hojas de contacto de una carpeta entera (12 fotos por hoja), con el tamaño de cada foto.
// Uso: node scripts/hoja-carpeta.mjs "<carpeta>" <prefijo-de-salida>
import { RAIZ } from './_raiz.mjs';
import { readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
const [carpeta, prefijo] = process.argv.slice(2); const POR = +(process.env.POR || 12);
const fotos = readdirSync(carpeta).filter((x) => /\.(jpe?g|png|webp|jfif)$/i.test(x)).sort().map((x) => carpeta.replace(/[\\/]$/, '') + '/' + x);
const tam = {}; for (const f of fotos) { const m = await sharp(f).metadata(); const k = m.width + '×' + m.height; tam[k] = (tam[k] || 0) + 1; }
console.log(fotos.length, 'fotos. Tamaños:', Object.entries(tam).map(([k, n]) => `${k} (${n})`).join(', '));
for (let i = 0; i < fotos.length; i += POR) execFileSync(process.execPath, [RAIZ + 'scripts/hoja-fotos.mjs', 'x', `${RAIZ}.capturas/fotos/${prefijo}-${i / POR + 1}.jpg`, ...fotos.slice(i, i + POR)], { stdio: 'inherit' });
