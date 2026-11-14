// Recortes de cerca de piezas de una página. Uso: node recortes.mjs <salida.png> <ancho> <alto> <margen> <url>::<selector>[::n] ...
import sharp from 'sharp';
const { chromium } = await import('./_pw.mjs');
const [sal, W, H, M, ...pares] = process.argv.slice(2);
const nav = await chromium.launch({ channel: 'msedge' }), ctx = await nav.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: 1, isMobile: +W < 800, hasTouch: +W < 800 });
const piezas = []; let y = 0, ancho = 0; const paginas = {};
for (const par of pares) {
  const [url, sel, n = '1'] = par.split('::');
  const p = paginas[url] ??= await (async () => { const p = await ctx.newPage(); await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(1600); return p; })();
  const els = (await p.$$(sel)).slice(0, +n);
  for (const el of els) {
    try { await el.scrollIntoViewIfNeeded({ timeout: 1500 }); } catch { continue; }
    await p.waitForTimeout(1300);
    const b = await el.boundingBox(); if (!b) continue;
    const m = +M, clip = { x: Math.max(0, b.x - m), y: Math.max(0, b.y - m), width: Math.min(+W - Math.max(0, b.x - m), b.width + 2 * m), height: Math.min(+H - Math.max(0, b.y - m), b.height + 2 * m) };
    const img = await p.screenshot({ clip, type: 'png' });
    piezas.push({ input: img, left: 0, top: y }); y += Math.round(clip.height) + 8; ancho = Math.max(ancho, Math.round(clip.width));
  }
}
await nav.close();
await sharp({ create: { width: ancho, height: y, channels: 3, background: '#e8336d' } }).composite(piezas).png().toFile(sal);
console.log(piezas.length, 'recortes', ancho + '×' + y);
