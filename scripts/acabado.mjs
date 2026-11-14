// Acabado común: el último paso de color para que todas las fotos del sitio parezcan de la misma sesión.
// No inventa nada ni cambia la escena: solo temperatura, exposición, contraste, viveza y el azul del cielo.
// La referencia son las fotos ajustadas por el diseñador (las de los posts); aquí están sus medidas y las recetas
// que llevan a esas medidas a las fotos que no pasaron por sus manos.
//
//   node scripts/acabado.mjs medir ruta1 ruta2 …            → medidas de cada foto (para comparar contra la referencia)
//   node scripts/acabado.mjs probar receta entrada salida   → aplica una receta a una foto suelta
//
// Desde otros scripts: import { acabar, medir, RECETAS } from './acabado.mjs'
import sharp from 'sharp';

// sRGB ↔ luz lineal, con tablas (rápido para fotos de 8 megapíxeles)
const A_LIN = new Float32Array(256); for (let i = 0; i < 256; i++) { const c = i / 255; A_LIN[i] = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }
const N = 4096, A_SRGB = new Uint8Array(N + 1); for (let i = 0; i <= N; i++) { const c = i / N; A_SRGB[i] = Math.round(255 * (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055)); }
const paso = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// Recetas. Cada campo es opcional:
//   exp       exposición (1 = igual), en luz lineal
//   blanco    [rojo/verde, azul/verde] al que se lleva el blanco de la foto (paredes, techos, sábanas)
//   fuerza    cuánto del camino hacia ese blanco se recorre (0 a 1)
//   calor     [rojo, azul] ganancia fija de temperatura cuando la foto no tiene blancos que medir (exteriores)
//   contraste curva en S sobre la luz (0 = nada)
//   negros    cuánto se hunden las sombras más profundas (0 = nada)
//   viveza    sube el color de lo apagado sin empujar lo que ya está saturado
//   color     saturación pareja de toda la foto (1 = igual; menos de 1 la calma)
//   cielo     [saturación, luz] solo sobre los azules de cielo y agua
//   verdes    [saturación, hacia amarillo] solo sobre el pasto y las hojas
export const RECETAS = {
  // Interiores de Quinta Azul: el blanco cálido de las habitaciones retocadas (lámpara encendida)
  'interior-qa': { blanco: [1.06, 0.945], fuerza: 0.85 },
  // Interiores de Los Arcos: mismo blanco, un punto menos cálido porque el departamento es blanco y gris
  'interior-la': { blanco: [1.055, 0.955], fuerza: 0.85 },
  // Exterior de día sin acabado: lo lleva al día del diseñador (cielo azul hondo, color vivo, sombras con cuerpo)
  'dia': { calor: [1.03, 0.965], contraste: 0.22, negros: 0.02, viveza: 0.32, cielo: [1.28, 0.9], verdes: [1.1, 0.06] },
  // Igual, más suave, para fotos que ya traen buen color y solo les falta cuerpo
  'dia-suave': { calor: [1.02, 0.975], contraste: 0.14, negros: 0.012, viveza: 0.18, cielo: [1.14, 0.95] },
  // Igual que «dia» para fotos tomadas a contraluz o con calima, que además quedaron oscuras
  'dia-clara': { exp: 1.18, calor: [1.03, 0.965], contraste: 0.22, negros: 0.02, viveza: 0.32, cielo: [1.28, 0.9], verdes: [1.1, 0.06] },
  // Al revés: fotos de día que llegaron pasadas de color (cielo eléctrico); las baja al día del diseñador
  'dia-hdr': { color: 0.9, cielo: [0.84, 1.02] },
  // Tarde: para fotos de luz baja que quedaron pálidas
  'tarde': { calor: [1.045, 0.94], contraste: 0.16, negros: 0.015, viveza: 0.22, cielo: [1.1, 0.96] },
  ninguno: {},
};

// Medidas de una foto: de qué color es su blanco, cuánta luz y contraste tiene, cuánto color y cómo es su azul.
export async function medir(entrada) {
  const { data, info } = await sharp(entrada).rotate().resize({ width: 400 }).removeAlpha().toColourspace('srgb').raw().toBuffer({ resolveWithObject: true });
  const n = info.width * info.height, lum = new Float32Array(n), claros = [];
  let sat = 0, az = [0, 0, 0, 0], vd = [0, 0, 0, 0];
  for (let i = 0, k = 0; k < n; i += 3, k++) {
    const r = data[i], g = data[i + 1], b = data[i + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = 0.2126 * r + 0.7152 * g + 0.0722 * b, s = mx ? (mx - mn) / mx : 0;
    lum[k] = l; sat += s;
    if (mx < 250 && s < 0.22) claros.push([l, r, g, b]);
    if (b > r * 1.18 && b >= g * 1.02 && l > 70) { az[0] += r; az[1] += g; az[2] += b; az[3]++; }
    if (g > r * 1.06 && g > b * 1.25 && l > 40) { vd[0] += r; vd[1] += g; vd[2] += b; vd[3]++; }
  }
  const o = Float32Array.from(lum).sort(), pc = (p) => o[Math.min(n - 1, Math.floor(n * p))];
  claros.sort((a, b) => b[0] - a[0]);
  const top = claros.slice(0, Math.max(50, Math.round(n * 0.06))), w = top.reduce((a, p) => [a[0] + p[1], a[1] + p[2], a[2] + p[3]], [0, 0, 0]);
  const color = (c) => { if (c[3] < n * 0.01) return null; const [r, g, b] = c.map((v) => v / c[3]), mx = Math.max(r, g, b), mn = Math.min(r, g, b); return { parte: c[3] / n, sat: (mx - mn) / mx, luz: mx, rb: r / b, gb: g / b }; };
  return { rg: w[0] / w[1], bg: w[2] / w[1], p2: pc(0.02), p50: pc(0.5), p98: pc(0.98), sat: sat / n, azul: color(az), verde: color(vd) };
}

// Aplica una receta. Devuelve el objeto de sharp listo para .resize() / .jpeg() / .toFile().
export async function acabar(entrada, receta) {
  const R = typeof receta === 'string' ? RECETAS[receta] : receta;
  if (!R) throw new Error('No existe la receta ' + receta);
  const base = sharp(entrada).rotate().removeAlpha().toColourspace('srgb');
  if (!Object.keys(R).length) return base;
  // 1. Temperatura: ganancias en luz lineal. Con «blanco» se calculan midiendo la foto (dos vueltas afinan el tiro).
  let gr = 1, gb = 1;
  if (R.blanco) {
    const m = await medir(entrada), f = R.fuerza ?? 1;
    // solo entibia: una foto que ya es más cálida que el objetivo (luz de lámpara, luz de tarde) se queda como está
    const orR = Math.max(m.rg, m.rg + (R.blanco[0] - m.rg) * f), obB = Math.min(m.bg, m.bg + (R.blanco[1] - m.bg) * f);
    gr = (orR / m.rg) ** 2.2; gb = (obB / m.bg) ** 2.2;
  } else if (R.calor) { gr = R.calor[0] ** 2.2; gb = R.calor[1] ** 2.2; }
  // la temperatura no debe cambiar la luz de la foto: se compensa para que un gris quede igual de claro
  const comp = 1 / (0.2126 * gr + 0.7152 + 0.0722 * gb), exp = (R.exp ?? 1) * comp;
  const kr = gr * exp, kg = exp, kb = gb * exp;
  const con = R.contraste || 0, neg = R.negros || 0, viv = R.viveza || 0, col = R.color ?? 1, [cs, cl] = R.cielo || [1, 1], [vs, va] = R.verdes || [1, 0];
  const { data, info } = await base.raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  for (let i = 0; i < data.length; i += ch) {
    let r = A_LIN[data[i]] * kr, g = A_LIN[data[i + 1]] * kg, b = A_LIN[data[i + 2]] * kb;
    // de vuelta a valores de pantalla (0 a 1), cuidando que los claros no se quemen de golpe
    const mx0 = Math.max(r, g, b); if (mx0 > 1) { const k = 1 / mx0; r *= k; g *= k; b *= k; }
    r = A_SRGB[Math.round(r * N)] / 255; g = A_SRGB[Math.round(g * N)] / 255; b = A_SRGB[Math.round(b * N)] / 255;
    let l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    // 2. Contraste y negros: una curva sobre la luz; el color la sigue en proporción para no cambiar de tono
    if ((con || neg) && l > 0.0005) {
      let l2 = l; if (neg) l2 = Math.max(0, (l2 - neg) / (1 - neg));
      if (con) l2 = l2 + con * (l2 * l2 * (3 - 2 * l2) - l2);
      const k = l2 / l; r *= k; g *= k; b *= k; l = l2;
    }
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), s = mx > 0 ? (mx - mn) / mx : 0;
    // 3. Viveza: más color donde falta, casi nada donde sobra, y nada en la piel muy clara ni en lo casi blanco
    let k = col * (1 + viv * (1 - s) * paso(0.04, 0.2, s));
    // 4. Cielo y agua: los azules
    const azul = b > 0 ? paso(0.1, 0.3, (b - Math.max(r, g * 0.98)) / b) * paso(0.22, 0.4, l) : 0;
    if (azul) k *= 1 + (cs - 1) * azul;
    // 5. Verdes: pasto y hojas
    const verde = g > 0 ? paso(0.05, 0.22, (g - Math.max(r, b * 1.1)) / g) : 0;
    if (verde) k *= 1 + (vs - 1) * verde;
    if (k !== 1) { r = l + (r - l) * k; g = l + (g - l) * k; b = l + (b - l) * k; }
    if (azul && cl !== 1) { const q = 1 + (cl - 1) * azul; r *= q; g *= q; b *= q; }
    if (verde && va) { r += (g - r) * va * verde * 0.5; }   // un punto hacia el verde cálido de la tarde
    data[i] = r <= 0 ? 0 : r >= 1 ? 255 : Math.round(r * 255); data[i + 1] = g <= 0 ? 0 : g >= 1 ? 255 : Math.round(g * 255); data[i + 2] = b <= 0 ? 0 : b >= 1 ? 255 : Math.round(b * 255);
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: ch } });
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('acabado.mjs')) {
  const [modo, ...resto] = process.argv.slice(2);
  if (modo === 'medir') {
    console.log('blanco r/v  a/v   luz p2 p50 p98   color   azul(parte sat luz)   verde(parte sat luz)');
    for (const f of resto) { const m = await medir(f), c = (x) => x ? `${(x.parte * 100).toFixed(0).padStart(3)}% ${x.sat.toFixed(2)} ${Math.round(x.luz).toString().padStart(3)}` : '  —          ';
      console.log(`${m.rg.toFixed(3)} ${m.bg.toFixed(3)}   ${[m.p2, m.p50, m.p98].map((v) => String(Math.round(v)).padStart(3)).join(' ')}   ${m.sat.toFixed(3)}   ${c(m.azul)}   ${c(m.verde)}   ${f.split(/[\\/]/).pop().replace(/-hotel.*$/, '').slice(0, 46)}`); }
  } else if (modo === 'probar') {
    const [receta, entrada, salida] = resto;
    const i = await (await acabar(entrada, receta)).jpeg({ quality: 90, mozjpeg: true }).toFile(salida); console.log(salida, i.width + '×' + i.height);
  } else console.log('Uso: node scripts/acabado.mjs medir ruta…  |  probar receta entrada salida');
}
