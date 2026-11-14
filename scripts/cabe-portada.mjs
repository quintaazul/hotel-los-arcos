// ¿La portada de cada página cabe en una pantalla? Dice cuántos píxeles se pasa del alto visible en cada tamaño
// apaisado (en celular y tableta de pie la portada puede ser más alta que la pantalla; ahí no aplica).
// Uso: node scripts/cabe-portada.mjs <url> [url2] [--pantallas=1366x650,1280x620]
const { chromium } = await import('./_pw.mjs');
const arg = process.argv.slice(2), bases = arg.filter((a) => !a.startsWith('--'));
const PANT = ((arg.find((a) => a.startsWith('--pantallas=')) || '').slice(12) || '2560x1300,1905x910,1366x650,1280x620').split(',').map((x) => x.split('x').map(Number));
const nav = await chromium.launch({ channel: 'msedge' }); let mal = 0;
for (const base of bases) {
  const rutas = [...(await (await fetch(base + '/sitemap-0.xml')).text()).matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((m) => m[1] || '/');
  for (const [w, h] of PANT) {
    const p = await (await nav.newContext({ viewport: { width: w, height: h } })).newPage();
    for (const r of rutas) {
      await p.goto(base + r, { waitUntil: 'load' }); await p.waitForTimeout(700);
      const sobra = await p.evaluate(() => { const s = document.querySelector('.portada'); return s ? Math.round(s.getBoundingClientRect().height - innerHeight) : null; });
      if (sobra > 1) { mal++; console.log(`✗ ${w}×${h} ${base.slice(-4)}${r} se pasa ${sobra} px`); }
    }
    await p.context().close();
  }
}
await nav.close();
console.log(mal ? `\n${mal} portadas no caben en su pantalla` : 'Todas las portadas caben en su pantalla');
