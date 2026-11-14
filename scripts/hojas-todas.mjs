// Pasada final: TODAS las páginas de los dos hoteles, pantalla por pantalla, en hojas que se puedan leer (.capturas/hojas).
// Uso: node scripts/hojas-todas.mjs [cel|pc] [qa|la] [/ruta1,/ruta2]   (en Git Bash, con MSYS_NO_PATHCONV=1 si se pasan rutas)
// Sirve para la revisión de composición: foto que no va con su texto, foto repetida, texto descentrado, cosas apretadas.
// Celular (390×844): 4 pantallas por hoja, a tamaño real. Computadora (1905×910): 4 pantallas por hoja, a la mitad.
import { RAIZ } from './_raiz.mjs';
import { createRequire } from 'node:module'; const sharp = createRequire(RAIZ + 'package.json')('sharp');
const { chromium } = await import('./_pw.mjs');
const P = {
  qa: [4321, ['/', '/hospedaje', '/celebraciones', '/ubicacion', '/contacto', '/preguntas-frecuentes', '/blog', '/blog/que-hacer-en-garcia', '/blog/posada-navidena-en-palapa', '/politicas', '/no-existe']],
  la: [4322, ['/', '/habitaciones', '/departamentos', '/empresas', '/celebraciones', '/ubicacion', '/contacto', '/preguntas-frecuentes', '/blog', '/blog/bautizo-en-jardin', '/blog/grutas-de-garcia-horarios-y-precios', '/terminos', '/no-existe']],
};
const solo = process.argv[2], soloH = process.argv[3], soloR = process.argv[4] ? process.argv[4].split(',') : null;
import { mkdirSync } from 'node:fs'; mkdirSync('.capturas/hojas', { recursive: true });   // «cel» o «pc»
const TAM = { cel: [390, 844, 4, 1], pc: [1905, 910, 4, 0.5] };
const nav = await chromium.launch({ channel: 'msedge' }); const indice = [];
for (const [hotel, [puerto, rutas]] of Object.entries(P)) for (const [tam, [w, h, porHoja, escala]] of Object.entries(TAM)) {
  if ((solo && solo !== tam) || (soloH && soloH !== hotel)) continue;
  const ctx = await nav.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: w < 800, hasTouch: w < 800 });
  for (const ruta of rutas) { if (soloR && !soloR.includes(ruta)) continue;
    const p = await ctx.newPage(); await p.goto('http://127.0.0.1:' + puerto + ruta, { waitUntil: 'load' }); await p.waitForTimeout(1300);
    const total = await p.evaluate(() => document.documentElement.scrollHeight), paso = Math.round(h * 0.94), n = Math.min(40, Math.ceil((total - h * 0.06) / paso));
    const tomas = [];
    for (let i = 0; i < n; i++) { await p.evaluate((y) => scrollTo(0, y), i * paso); await p.waitForTimeout(i === 0 ? 300 : 750); tomas.push(await p.screenshot({ type: 'jpeg', quality: 80 })); }
    const nombre = hotel + '-' + tam + '-' + (ruta === '/' ? 'inicio' : ruta.slice(1).replace(/\//g, '_'));
    const cw = Math.round(w * escala), ch = Math.round(h * escala), M = 6, ROT = 22;
    for (let k = 0; k * porHoja < tomas.length; k++) {
      const grupo = tomas.slice(k * porHoja, (k + 1) * porHoja); const cols = tam === 'cel' ? grupo.length : Math.min(2, grupo.length), filas = Math.ceil(grupo.length / cols);
      const piezas = await Promise.all(grupo.map(async (b, j) => { const num = k * porHoja + j + 1; const img = escala === 1 ? b : await sharp(b).resize(cw, ch).toBuffer();
        const rot = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cw}" height="${ROT}"><rect width="${cw}" height="${ROT}" fill="#111"/><text x="6" y="16" font-family="Arial" font-size="13" font-weight="700" fill="#fff">${nombre} · pantalla ${num} de ${n}</text></svg>`);
        const x = M + (j % cols) * (cw + M), y = M + Math.floor(j / cols) * (ch + ROT + M); return [{ input: rot, left: x, top: y }, { input: img, left: x, top: y + ROT }]; }));
      const archivo = `.capturas/hojas/${nombre}-${String(k + 1).padStart(2, '0')}.jpg`;
      await sharp({ create: { width: M + cols * (cw + M), height: M + filas * (ch + ROT + M), channels: 3, background: '#333' } }).composite(piezas.flat()).jpeg({ quality: 80 }).toFile(archivo);
      indice.push(archivo);
    }
    console.log(nombre, n, 'pantallas'); await p.close();
  }
  await ctx.close();
}
await nav.close(); console.log(indice.length, 'hojas');
