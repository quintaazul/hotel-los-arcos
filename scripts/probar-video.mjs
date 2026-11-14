// Prueba del reproductor de video y del pin del mapa en el sitio compilado: reproduce de verdad, mueve el avance y el
// volumen, usa el teclado, y comprueba que el pin del mapa entra sin girar. Deja fotos en .capturas/video/.
// Uso: node scripts/probar-video.mjs [url-quinta-azul] [url-los-arcos]
import { mkdirSync } from 'node:fs';
const { chromium } = await import('./_pw.mjs');
const [QA = 'http://127.0.0.1:4321', LA = 'http://127.0.0.1:4322'] = process.argv.slice(2);
const DIR = decodeURIComponent(new URL('../.capturas/video/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')); mkdirSync(DIR, { recursive: true });
const nav = await chromium.launch({ channel: 'msedge' });
let fallas = 0;
const ok = (c, que, d = '') => { if (!c) fallas++; console.log((c ? '  ✓ ' : '  ✗ ') + que + (d !== '' ? ' · ' + d : '')); };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function reproductor(url, nombre, w, h, tactil) {
  console.log(`\n── ${nombre} · ${w}×${h}${tactil ? ' · táctil' : ''}`);
  const ctx = await nav.newContext({ viewport: { width: w, height: h }, isMobile: tactil, hasTouch: tactil });
  const p = await ctx.newPage(); const errores = []; p.on('pageerror', (e) => errores.push(e.message));
  await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(400);
  const caja = p.locator('[data-video]:not([data-ambiente])').first(), marco = caja.locator('.video-caja');
  await marco.scrollIntoViewIfNeeded(); await p.evaluate(() => { const m = document.querySelector('[data-video]:not([data-ambiente]) .video-caja').getBoundingClientRect(); scrollBy(0, m.top - (innerHeight - m.height) / 2); }); await p.waitForTimeout(900);
  const estado = () => caja.evaluate((c) => { const v = c.querySelector('video'); const cs = (s) => getComputedStyle(c.querySelector(s)); return { clases: c.className.replace('video ', ''), t: +v.currentTime.toFixed(2), d: +(v.duration || 0).toFixed(1), pausado: v.paused, vol: +v.volume.toFixed(2), mudo: v.muted, tiempo: c.querySelector('[data-v-tiempo]').textContent, ctrl: cs('.video-ctrl').opacity, volVisible: cs('.video-vol-caja').visibility, avance: c.querySelector('[data-v=barra]').style.getPropertyValue('--avance') }; });
  const foto = (n) => marco.screenshot({ path: DIR + nombre + '-' + n + '.png' });
  await foto('1-cartel');
  const cajaR = await marco.boundingBox();
  ok(cajaR.width > 200, 'El reproductor mide', Math.round(cajaR.width) + '×' + Math.round(cajaR.height));

  // Reproducir
  if (tactil) await caja.locator('[data-v=iniciar]').tap(); else await caja.locator('[data-v=iniciar]').click();
  await p.waitForFunction(() => { const v = document.querySelector('[data-video]:not([data-ambiente]) video'); return v.currentTime > 0.6 && !v.paused; }, null, { timeout: 20000 }).catch(() => {});
  let e = await estado();
  ok(!e.pausado && e.t > 0.5 && /activo/.test(e.clases) && /listo/.test(e.clases) && !/cargando/.test(e.clases), 'Reproduce y quita el cartel', `t=${e.t}s de ${e.d}s · clases: ${e.clases}`);
  ok(/^0:0\d \/ \d:\d\d$/.test(e.tiempo) && +e.avance > 0, 'El tiempo y la raya de avance corren', e.tiempo + ' · avance ' + e.avance);
  ok(e.ctrl === '1', 'Los controles están a la vista al empezar');
  if (!tactil) await p.mouse.move(cajaR.x + cajaR.width / 2, cajaR.y + cajaR.height * 0.6);
  await p.waitForTimeout(300); await foto('2-corriendo');

  if (!tactil) {
    // Volumen: sale al acercar el ratón al botón de sonido
    const bs = await caja.locator('[data-v=sonido]').boundingBox();
    await p.mouse.move(bs.x + bs.width / 2, bs.y + bs.height / 2); await p.waitForTimeout(350);
    e = await estado(); ok(e.volVisible === 'visible', 'El deslizador de volumen sale al acercar el ratón al botón de sonido'); await foto('3-volumen');
    const vb = await caja.locator('[data-v=volumen]').boundingBox();
    await p.mouse.move(vb.x + vb.width / 2, vb.y + vb.height * 0.6); await p.mouse.down(); await p.mouse.move(vb.x + vb.width / 2, vb.y + vb.height * 0.62, { steps: 3 }); await p.mouse.up(); await p.waitForTimeout(150);
    e = await estado(); ok(e.vol > 0.2 && e.vol < 0.6 && !e.mudo, 'Arrastrar el deslizador cambia el volumen', 'volumen ' + Math.round(e.vol * 100) + ' %'); await foto('4-volumen-bajo');
    await caja.locator('[data-v=sonido]').click(); e = await estado(); ok(e.mudo && /sin-sonido/.test(e.clases), 'El botón silencia');
    await caja.locator('[data-v=sonido]').click(); e = await estado(); ok(!e.mudo && e.vol > 0.2, 'Y al volver a tocarlo regresa al volumen que tenía', Math.round(e.vol * 100) + ' %');
    ok(Math.abs(JSON.parse(await p.evaluate(() => sessionStorage.getItem('video-sonido'))).v - e.vol) < 0.01, 'El volumen queda recordado para los demás videos');
    // Avance: tocar la raya a la mitad
    const bb = await caja.locator('[data-v=barra]').boundingBox();
    await p.mouse.click(bb.x + bb.width * 0.5, bb.y + bb.height / 2); await p.waitForTimeout(500);
    e = await estado(); ok(Math.abs(e.t / e.d - 0.5) < 0.08, 'Tocar la raya a la mitad lleva el video a la mitad', `t=${e.t}s de ${e.d}s`);
    // Teclado
    await caja.locator('[data-v=barra]').focus(); await p.keyboard.press('k'); await p.waitForTimeout(250);
    e = await estado(); ok(e.pausado && /pausado/.test(e.clases), 'La tecla K pausa'); await foto('5-pausado');
    const t0 = e.t; await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(300); e = await estado(); ok(Math.abs(t0 - 5 - e.t) < 0.6, 'La flecha izquierda regresa 5 segundos', `${t0}s → ${e.t}s`);
    await p.keyboard.press('ArrowUp'); e = await estado(); const v1 = e.vol; await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown'); e = await estado(); ok(e.vol < v1, 'Las flechas arriba y abajo mueven el volumen', Math.round(v1 * 100) + ' % → ' + Math.round(e.vol * 100) + ' %');
    await p.keyboard.press('m'); e = await estado(); ok(e.mudo, 'La tecla M silencia'); await p.keyboard.press('m');
    await p.keyboard.press('k'); await p.waitForTimeout(300); e = await estado(); ok(!e.pausado, 'K otra vez sigue');
    // Se esconden solos
    await p.mouse.move(5, 5); await caja.evaluate((c) => document.activeElement?.blur()); await p.waitForTimeout(3600);
    e = await estado(); ok(e.ctrl === '0' && /quieto/.test(e.clases), 'A los tres segundos sin moverse, los controles se esconden'); await foto('6-quieto');
  } else {
    e = await estado(); ok(e.volVisible === 'hidden', 'En celular no sale deslizador de volumen (manda el botón del teléfono); queda el de silenciar');
    await p.waitForTimeout(3400); e = await estado(); ok(/quieto/.test(e.clases), 'Los controles se esconden solos');
    const t1 = e.t; await marco.tap({ position: { x: cajaR.width / 2, y: cajaR.height * 0.4 } }); await p.waitForTimeout(350); e = await estado();
    ok(!e.pausado && !/quieto/.test(e.clases), 'El primer toque solo enseña los controles (no pausa)'); await foto('3-controles');
    await marco.tap({ position: { x: cajaR.width / 2, y: cajaR.height * 0.4 } }); await p.waitForTimeout(350); e = await estado(); ok(e.pausado, 'El segundo toque pausa'); await foto('4-pausado');
  }
  // Final: vuelve el cartel con «otra vez»
  await caja.evaluate((c) => { const v = c.querySelector('video'); v.currentTime = Math.max(0, v.duration - 0.4); v.play(); }); await p.waitForTimeout(1500);
  e = await estado(); ok(/otra-vez/.test(e.clases) && !/activo/.test(e.clases), 'Al terminar regresa el cartel con el botón de repetir'); await foto('7-final');
  const desborde = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  ok(desborde <= 0 && !errores.length, 'Sin desbordes ni errores', errores.join(' | '));
  await ctx.close();
}

async function pin(url, nombre, w, h) {
  const ctx = await nav.newContext({ viewport: { width: w, height: h }, isMobile: w < 800, hasTouch: w < 800 }); const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(500);
  // baja hasta que el mapa entra y mide el giro del pin cuadro por cuadro mientras cae
  await p.evaluate(() => { window.__giros = []; const pin = document.querySelector('[data-pin]'); const t0 = performance.now();
    const mide = () => { const s = getComputedStyle(pin), m = s.transform.match(/matrix\(([^)]+)\)/); if (m && +s.opacity > 0.02) { const [a, b] = m[1].split(',').map(Number); window.__giros.push(Math.round(Math.atan2(b, a) * 180 / Math.PI)); } if (performance.now() - t0 < 4000) requestAnimationFrame(mide); }; requestAnimationFrame(mide);
    document.querySelector('.mapa').scrollIntoView({ block: 'center' }); });
  await p.waitForTimeout(700); await p.locator('.pin').first().evaluate((e) => e.getBoundingClientRect()); await p.screenshot({ path: DIR + nombre + '-pin-cayendo.png' });
  await p.waitForTimeout(3400);
  const giros = await p.evaluate(() => window.__giros), distintos = [...new Set(giros)];
  ok(giros.length > 20 && distintos.length === 1 && distintos[0] === -45, `Pin del mapa · ${nombre} ${w}×${h}: entra con la gota ya derecha en los ${giros.length} cuadros medidos`, 'giros vistos: ' + distintos.join(', ') + '°');
  await p.screenshot({ path: DIR + nombre + '-pin-quieto.png' });
  await ctx.close();
}

await pin(LA + '/', 'la', 1905, 910); await pin(QA + '/', 'qa', 1905, 910); await pin(LA + '/ubicacion', 'la-cel', 430, 932);
await reproductor(QA + '/ubicacion', 'qa-vertical', 1905, 910, false);
await reproductor(LA + '/blog/xenpal-con-ninos', 'la-horizontal', 1905, 910, false);
await reproductor(QA + '/ubicacion', 'qa-celular', 430, 932, true);
await reproductor(QA + '/ubicacion', 'qa-720p', 1280, 620, false);
await nav.close();
console.log(fallas ? `\n${fallas} comprobaciones fallaron` : '\nReproductor y pin: todo bien');
