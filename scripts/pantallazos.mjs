// Una página vista como la ve una persona: pantalla por pantalla. Toma una captura por cada alto de pantalla
// (lo que queda a la vista al detenerse ahí) y las junta en una hoja, en orden. Sirve para juzgar la estética:
// ¿cada pantalla es una composición completa?, ¿hay huecos?, ¿las piezas guardan proporción?
// El tamaño es el área visible real del navegador, no la resolución del monitor: una pantalla 1080p deja ~1905 × 910.
// Uso: node scripts/pantallazos.mjs <url> <salida.jpg> [--ancho=1905] [--alto=910] [--cols=3] [--paso=1] [--max=14]
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
const { chromium } = await import('./_pw.mjs');
const arg = process.argv.slice(2), op = (n, d) => +((arg.find((a) => a.startsWith('--' + n + '=')) || '').slice(n.length + 3) || d);
const [url, salida] = arg.filter((a) => !a.startsWith('--'));
const W = op('ancho', 1905), H = op('alto', 910), cols = op('cols', 3), paso = op('paso', 1), max = op('max', 14), movil = W < 800;
mkdirSync(dirname(salida), { recursive: true });
const nav = await chromium.launch({ channel: 'msedge', args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const ctx = await nav.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, isMobile: movil, hasTouch: movil }), p = await ctx.newPage();
await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(1500);
const total = await p.evaluate(() => document.documentElement.scrollHeight);
const n = Math.min(max, Math.max(1, Math.ceil((total - H) / (H * paso)) + 1));
const an = Math.round(1900 / cols) - 6, al = Math.round(an * H / W), piezas = [];
for (let i = 0; i < n; i++) {
  const y = Math.min(total - H, Math.round(i * H * paso));
  await p.evaluate(async (m) => { const d = m - scrollY, k = Math.max(1, Math.ceil(Math.abs(d) / 260)); for (let j = 1; j <= k; j++) { scrollTo(0, scrollY + d / k); await new Promise((ok) => setTimeout(ok, 30)); } scrollTo(0, m); }, y);
  await p.waitForTimeout(1500);
  const b = await sharp(await p.screenshot({ type: 'jpeg', quality: 84 })).resize(an, al).jpeg({ quality: 84 }).toBuffer();
  const t = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="34" height="22"><rect width="34" height="22" rx="4" fill="#d81b60"/><text x="17" y="16" text-anchor="middle" font-family="Arial" font-size="13" font-weight="700" fill="#fff">${i + 1}</text></svg>`);
  const x = 6 + (i % cols) * (an + 6), yy = 6 + Math.floor(i / cols) * (al + 6);
  piezas.push({ input: b, left: x, top: yy }, { input: t, left: x + 4, top: yy + 4 });
}
await nav.close();
await sharp({ create: { width: cols * (an + 6) + 6, height: Math.ceil(n / cols) * (al + 6) + 6, channels: 3, background: '#333' } }).composite(piezas).jpeg({ quality: 86 }).toFile(salida);
console.log(`${salida}  ${n} pantallas de ${W}×${H} (la página mide ${total} px)`);
