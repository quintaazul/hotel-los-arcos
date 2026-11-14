// Mide el óvalo de un título: cuánto sobresale del texto y qué estilos le llegan. Uso: node scripts/medir-ovalo.mjs <url> [ancho] [alto]
const { chromium } = await import('./_pw.mjs');
const [url, w = 1905, h = 910] = process.argv.slice(2);
const nav = await chromium.launch({ channel: 'msedge' }), p = await (await nav.newContext({ viewport: { width: +w, height: +h } })).newPage();
await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(1500);
console.log(JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('.ovalo')].slice(0, 3).map((o) => {
  const b = o.getBoundingClientRect(), s = o.querySelector('svg'), sb = s.getBoundingClientRect(), cs = getComputedStyle(s), co = getComputedStyle(o), r = document.createRange(); r.selectNodeContents(o.firstChild); const t = r.getBoundingClientRect();
  const l = o.closest('.titulo').querySelector('.l > span').getBoundingClientRect();
  return { frase: o.firstChild.nodeValue, letra: co.fontSize, pad: co.padding, margen: co.marginLeft, texto: [Math.round(t.left), Math.round(t.right)], lineaDeArriba: Math.round(l.left), caja: [Math.round(b.left), Math.round(b.right), Math.round(b.top), Math.round(b.bottom)], svg: [Math.round(sb.left), Math.round(sb.right), Math.round(sb.top), Math.round(sb.bottom)], svgLeft: cs.left, svgWidth: cs.width, svgLetra: cs.fontSize };
})), null, 1));
await nav.close();
