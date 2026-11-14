// Cuánto cuesta de verdad el guion del óvalo: lo corre 30 veces dentro de la página y da el promedio, primero
// forzando a redibujar todo (como cuando llega la letra) y después sin cambios (como en un aviso repetido).
// Uso: node scripts/costo-ovalo.mjs <url> [ancho] [alto]
const { chromium } = await import('./_pw.mjs');
const [url, w = 1905, h = 910] = process.argv.slice(2);
const nav = await chromium.launch({ channel: 'msedge' }), p = await (await nav.newContext({ viewport: { width: +w, height: +h } })).newPage();
await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(1500);
console.log(JSON.stringify(await p.evaluate(() => {
  const n = document.querySelectorAll('.ovalo svg, .nombre-serie svg').length, medir = (arg) => { const t = performance.now(); for (let i = 0; i < 30; i++) window.__ajustarOvalos(arg); return +((performance.now() - t) / 30).toFixed(2); };
  return { ovalos: n, redibujarTodoMs: medir(true), sinCambiosMs: medir() };
})));
await nav.close();
