// Junta las fotos de scripts/motores.mjs en una hoja: una columna por motor, una fila por momento de la escena.
// Uso: node scripts/hoja-motores.mjs qa 720p [ancho-de-cada-foto]
import { RAIZ } from './_raiz.mjs';
import sharp from 'sharp';
import { existsSync } from 'node:fs';
const [sitio = 'qa', pantalla = '720p', anchoArg = '620'] = process.argv.slice(2);
const dir = RAIZ + '.capturas/motores', ancho = +anchoArg;
const motores = ['chromium', 'firefox', 'webkit'].filter((m) => existsSync(`${dir}/${sitio}-${pantalla}-${m}-arco-0.jpg`));
const momentos = ['arco-0', 'arco-1', 'arco-2', 'arco-3', 'habs'];
const piezas = []; let alto = 0;
for (const mo of momentos) for (const m of motores) {
  const f = `${dir}/${sitio}-${pantalla}-${m}-${mo}.jpg`; if (!existsSync(f)) continue;
  const b = await sharp(f).resize({ width: ancho }).jpeg({ quality: 74 }).toBuffer({ resolveWithObject: true });
  alto = b.info.height; piezas.push({ input: b.data, left: motores.indexOf(m) * (ancho + 6), top: momentos.indexOf(mo) * (alto + 6) });
}
const salida = `${dir}/hoja-${sitio}-${pantalla}.jpg`;
await sharp({ create: { width: motores.length * (ancho + 6), height: momentos.length * (alto + 6), channels: 3, background: '#d22' } }).composite(piezas).jpeg({ quality: 76 }).toFile(salida);
console.log(salida, '· columnas:', motores.join(', '));
