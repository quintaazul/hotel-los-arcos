// Amplía una foto con Real-ESRGAN (programa libre, en C:/dev/herramientas/realesrgan) para que tenga píxeles de
// sobra en pantallas 2K y 4K. No inventa cosas: reconstruye bordes y textura a partir de la foto real.
//
// Uso: node scripts/ampliar.mjs <entrada> <salida.jpg> [--lado=3200] [--mezcla=0.75]
//   --lado    lado largo del resultado en píxeles (por defecto el doble del original, con tope de 3200)
//   --mezcla  cuánto pesa la versión reconstruida frente a la foto original ampliada de forma normal (de 0 a 1).
//             Con 1 queda muy nítida pero el pasto y las hojas pueden verse «pintados»; 0.75 conserva textura real.
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const HERR = 'C:/dev/herramientas/realesrgan';
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith('--' + n + '=')); return a ? +a.slice(n.length + 3) : d; };
const [entrada, salida] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!entrada || !salida) { console.log('Uso: node scripts/ampliar.mjs <entrada> <salida.jpg> [--lado=3200] [--mezcla=0.75]'); process.exit(1); }

export async function ampliar(entrada, salida, { lado, mezcla = 0.75 } = {}) {
  const m = await sharp(entrada).metadata(), largo = Math.max(m.width, m.height);
  const meta = Math.round(lado || Math.min(3200, largo * 2)), f = meta / largo;
  const w = Math.round(m.width * f), h = Math.round(m.height * f);
  const tmp = mkdtempSync(join(tmpdir(), 'ampliar-'));
  try {
    // El programa trabaja mejor desde un PNG limpio (sin perfil ni giro pendiente)
    await sharp(entrada).rotate().png().toFile(join(tmp, 'e.png'));
    execFileSync(HERR + '/realesrgan-ncnn-vulkan.exe', ['-i', join(tmp, 'e.png'), '-o', join(tmp, 's.png'), '-n', 'realesrgan-x4plus', '-s', '4', '-m', HERR + '/models'], { stdio: 'ignore' });
    const rec = await sharp(join(tmp, 's.png')).resize(w, h, { kernel: 'lanczos3' }).removeAlpha().raw().toBuffer();
    const nat = await sharp(entrada).rotate().resize(w, h, { kernel: 'lanczos3' }).removeAlpha().raw().toBuffer();
    const out = Buffer.allocUnsafe(rec.length);
    for (let i = 0; i < rec.length; i++) out[i] = rec[i] * mezcla + nat[i] * (1 - mezcla) + 0.5;
    await sharp(out, { raw: { width: w, height: h, channels: 3 } }).sharpen({ sigma: 0.6, m1: 0.4, m2: 1.2 }).jpeg({ quality: 92, chromaSubsampling: '4:4:4', mozjpeg: true }).toFile(salida);
    return { de: `${m.width}×${m.height}`, a: `${w}×${h}` };
  } finally { rmSync(tmp, { recursive: true, force: true }); }
}
const t0 = Date.now();
const r = await ampliar(entrada, salida, { lado: arg('lado'), mezcla: arg('mezcla', 0.75) });
console.log(`${r.de} → ${r.a} en ${((Date.now() - t0) / 1000).toFixed(1)} s  ${salida}`);
