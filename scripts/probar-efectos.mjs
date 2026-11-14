// Prueba de uso de los efectos en el sitio compilado: puntos con dedo, ratón y teclado
const pw = await import('./_pw.mjs');
const nav = await pw.chromium.launch({ channel: 'msedge' });
const abiertos = (p) => p.evaluate(() => [...document.querySelectorAll('.punto')].map((x, i) => x.classList.contains('abierto') ? i + 1 : 0).filter(Boolean).join(',') || 'ninguno');
for (const [h, base, habs] of [['QA', 'http://127.0.0.1:4321', '/hospedaje'], ['LA', 'http://127.0.0.1:4322', '/habitaciones']]) {
  // celular: tocar
  let ctx = await nav.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }), p = await ctx.newPage(); const err = []; p.on('pageerror', (e) => err.push(String(e)));
  await p.goto(base + '/celebraciones', { waitUntil: 'load' }); await p.locator('.puntos').scrollIntoViewIfNeeded(); await p.waitForTimeout(1800);
  const r = [await abiertos(p)];
  await p.locator('.punto button').nth(1).tap(); await p.waitForTimeout(300); r.push(await abiertos(p));
  await p.locator('.punto button').nth(1).tap(); await p.waitForTimeout(300); r.push(await abiertos(p));
  await p.locator('.punto button').nth(2).tap(); await p.waitForTimeout(300); r.push(await abiertos(p));
  const nota = await p.evaluate(() => { const n = document.querySelector('.punto.abierto .nota').getBoundingClientRect(), f = document.querySelector('.puntos-foto').getBoundingClientRect(); return { debajoDeLaFoto: n.top >= f.bottom - 1, dentroDePantalla: n.left >= 0 && n.right <= innerWidth + 1 }; });
  console.log(h, 'celular · abiertos al entrar, tocar 2, tocar 2 otra vez, tocar 3:', r.join(' → '), '· nota', JSON.stringify(nota));
  console.log(h, 'celular · errores', err.length);
  await ctx.close();
  // computadora: ratón, índice y teclado
  ctx = await nav.newContext({ viewport: { width: 1600, height: 900 } }); p = await ctx.newPage(); p.on('pageerror', (e) => err.push(String(e)));
  await p.goto(base + '/celebraciones', { waitUntil: 'load' }); await p.locator('.puntos').scrollIntoViewIfNeeded(); await p.waitForTimeout(1800);
  const s = [];
  await p.locator('.punto button').nth(2).hover(); await p.waitForTimeout(250); s.push(await abiertos(p));
  await p.locator('[data-ir-punto]').nth(3).hover(); await p.waitForTimeout(250); s.push(await abiertos(p));
  await p.locator('.punto button').first().focus(); await p.keyboard.press('Tab'); await p.waitForTimeout(250); s.push(await abiertos(p));
  await p.keyboard.press('Escape'); await p.waitForTimeout(200); s.push(await abiertos(p));
  const fuera = await p.evaluate(() => { let n = 0; document.querySelectorAll('.punto').forEach((x) => { x.classList.add('abierto'); }); document.querySelectorAll('.nota').forEach((x) => { const b = x.getBoundingClientRect(); if (b.left < 0 || b.right > innerWidth) n++; }); return n; });
  console.log(h, 'computadora · ratón en 3, índice en 4, Tab desde 1, Esc:', s.join(' → '), '· notas que se salen de la pantalla:', fuera, '· errores', err.length ? err.join(' | ') : 'ninguno');
  await ctx.close();
}
await nav.close();
