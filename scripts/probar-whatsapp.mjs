// Prueba de los mensajes de WhatsApp: elige fechas y huéspedes como lo haría una persona y lee qué mensaje llevaría
// cada botón (no abre WhatsApp ni manda nada: intercepta la ventana que se abriría).
// Uso: node scripts/probar-whatsapp.mjs [url-quinta-azul] [url-los-arcos]
const { chromium } = await import('./_pw.mjs');
const [QA = 'http://127.0.0.1:4321', LA = 'http://127.0.0.1:4322'] = process.argv.slice(2);
const nav = await chromium.launch({ channel: 'msedge' });
let fallas = 0;
const ok = (cond, que, detalle = '') => { if (!cond) fallas++; console.log((cond ? '  ✓ ' : '  ✗ ') + que + (detalle ? '\n      ' + String(detalle).replace(/\n/g, '\n      ') : '')); };
const texto = (href) => { try { return new URL(href).searchParams.get('text') || ''; } catch { return ''; } };

async function sitio(base, habs, rutaHabs, rutaPalapa) {
  console.log('\n══ ' + base);
  const ctx = await nav.newContext({ viewport: { width: 1905, height: 910 } });
  await ctx.addInitScript(() => { window.__abiertos = []; window.open = (u) => { window.__abiertos.push(String(u)); return null; }; });
  const p = await ctx.newPage(); const errores = []; p.on('pageerror', (e) => errores.push(e.message));
  const enlace = async (sel, n = 0) => texto(await p.locator(sel).nth(n).getAttribute('href'));
  const abierto = async () => texto(await p.evaluate(() => window.__abiertos.pop() || ''));
  const cuantos = () => p.evaluate(() => window.__abiertos.length);

  // 1. Sin elegir nada: mensajes limpios, sin fechas inventadas
  await p.goto(base + '/', { waitUntil: 'load' }); await p.waitForTimeout(500);
  const m0 = await enlace('.cabecera a.boton[href*="wa.me"]');
  ok(/^Hola, quiero reservar en el Hotel [^\n]+$/.test(m0), 'Menú «Reservar», sin elegir nada: solo la frase', m0);

  // 2. Comparador: elegir 3 personas
  const seg = p.locator('.segmento[data-sugerencias]').first(); await seg.scrollIntoViewIfNeeded(); await seg.locator('button[data-personas="3"]').click(); await p.waitForTimeout(150);
  const m1 = await enlace('.cabecera a.boton[href*="wa.me"]');
  ok(/Huéspedes: 3 adultos/.test(m1) && !/Llegada/.test(m1), 'Tras elegir 3 en el comparador, el menú lleva los huéspedes (y no fechas)', m1);
  ok((await p.locator('#val-personas').textContent()) === '3 adultos', 'La barra de la portada también muestra 3 adultos');

  // 3. Barra: elegir fechas
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(200);
  await p.locator('[data-fechas]').first().click(); await p.waitForTimeout(250);
  const dias = p.locator('#pop-fechas .dia:not(:disabled)'); await dias.nth(12).click(); await p.waitForTimeout(120); await dias.nth(15).click(); await p.waitForTimeout(120);
  await p.locator('#pop-fechas [data-listo]').click(); await p.waitForTimeout(150);
  const barra = await p.evaluate(() => [document.querySelector('#val-llegada').textContent, document.querySelector('#val-salida').textContent, document.querySelector('#val-estimado').textContent, document.querySelector('#sub-estimado').textContent].join(' | '));
  console.log('    barra: ' + barra);
  const m2 = await enlace('.cabecera a.boton[href*="wa.me"]');
  ok(/Llegada: [^\n]+ \d+ de [^\n]+\nSalida: [^\n]+ \d+ de [^\n]+ \(3 noches\)\nHuéspedes: 3 adultos/.test(m2), 'Menú «Reservar» con fechas y huéspedes', m2);
  const m3 = await enlace('.habs-lista .hab a.boton[href*="wa.me"]', habs.indice);
  ok(new RegExp('^Hola, quiero reservar ' + habs.frase + ' en el Hotel').test(m3) && /Llegada:/.test(m3) && /Huéspedes: 3 adultos/.test(m3), '«Reservar esta» (' + habs.frase + ') lleva habitación, fechas y huéspedes', m3);
  ok(/Llegada:/.test(await enlace('#wa-flota')) && /Llegada:/.test(await enlace('.pie a.boton[href*="wa.me"]')), 'El botón flotante y el del pie llevan lo mismo');

  // 4. Agregar un niño y consultar disponibilidad
  await p.locator('#btn-personas').click(); await p.waitForTimeout(200); await p.locator('#pop-personas [data-paso="ninos"][data-delta="1"]').click(); await p.locator('#pop-personas [data-listo]').click(); await p.waitForTimeout(150);
  await p.locator('#f-reserva button[type="submit"]').click(); await p.waitForTimeout(250);
  const m4 = await abierto();
  ok(/^Hola, quiero reservar en el Hotel [^.]+\. ¿Tienen disponibles? .+\?\nLlegada: .+\nSalida: .+\(3 noches\)\nHuéspedes: 3 adultos y 1 niño$/.test(m4), '«Consultar disponibilidad» manda fechas, noches, adultos y niños', m4);

  // 5. Detalle de la habitación (se arma al abrirlo)
  const det = p.locator('.habs-lista .hab [data-detalle]').first(); await det.scrollIntoViewIfNeeded(); await det.click(); await p.waitForTimeout(600);
  const pie = p.locator('.cajon-pie a[href*="wa.me"]').last(); await pie.click({ trial: false }).catch(() => {}); await p.waitForTimeout(200);
  const m5 = texto(await pie.getAttribute('href').catch(() => ''));
  ok(/Llegada:/.test(m5) && /1 niño/.test(m5), 'El botón «Reservar» del detalle de la habitación también', m5);

  // 6. Otra página: la selección sigue
  await p.goto(base + '/' + rutaHabs, { waitUntil: 'load' }); await p.waitForTimeout(500);
  ok(/3 adultos, 1 niño/.test(await p.locator('#val-personas').textContent()) && !/Elige/.test(await p.locator('#val-llegada').textContent()), 'En Habitaciones la barra abre con las mismas fechas y huéspedes', await p.locator('#val-llegada').textContent() + ' → ' + await p.locator('#val-salida').textContent() + ' · ' + await p.locator('#val-personas').textContent());
  const m6 = await enlace('.partida a[href*="wa.me"]');
  ok(/grupo|descuento/.test(m6) && /Llegada:/.test(m6), 'El botón de grupos o descuento lleva las fechas', m6);

  // 7. Contacto: abre con lo elegido; al enviar NO abre WhatsApp; si falla, el respaldo va completo
  await p.goto(base + '/contacto', { waitUntil: 'load' }); await p.waitForTimeout(600);
  const pre = await p.evaluate(() => ['llegada', 'salida', 'personas'].map((n) => document.querySelector('form[data-enviar] [name="' + n + '"]').value).join(' | '));
  ok(/^\d{4}-\d\d-\d\d \| \d{4}-\d\d-\d\d \| 4$/.test(pre), 'El formulario de Contacto abre con llegada, salida y 4 personas', pre);
  const f = p.locator('form[data-enviar]'); await f.locator('#c-nombre').fill('Prueba Automática'); await f.locator('#c-contacto').fill('8100000000'); await f.locator('#c-mensaje').fill('Llegamos tarde.');
  await f.locator('#c-priv').check({ force: true }).catch(async () => { await f.locator('.casilla').first().click(); });
  const antes = await cuantos();
  await Promise.all([p.waitForResponse((r) => r.url().includes('/api/contacto'), { timeout: 8000 }).catch(() => null), f.locator('button[type=submit]').click()]); await p.waitForTimeout(800);
  ok((await cuantos()) === antes, 'Enviar el formulario no abre WhatsApp por su cuenta');
  const estado = await p.evaluate(() => ({ fallo: !document.querySelector('[data-form-fallo]').hidden, ok: !document.querySelector('[data-form-ok]').hidden, wa: document.querySelector('[data-form-wa]').href }));
  if (estado.fallo) { const m7 = texto(estado.wa); ok(/Nombre: Prueba Automática\nContacto: 8100000000\nLlegada: .+\nSalida: .+\nPersonas: 4\n(Habitación: .+\n)?Motivo: .+\nMensaje: Llegamos tarde\./.test(m7), 'Respaldo por WhatsApp del formulario (aquí el envío falla porque no hay servicio de correo)', m7); }
  else ok(estado.ok, 'El formulario se envió y muestra el aviso de recibido');

  // 8. Palapa: cotización (solo Quinta Azul la renta; la de Los Arcos es solo para huéspedes y no lleva formulario)
  await p.goto(base + '/' + rutaPalapa, { waitUntil: 'load' }); await p.waitForTimeout(600);
  if (await p.locator('form[data-fiesta]').count()) {
  const m8 = await enlace('.celebra a.fila-plan[href*="wa.me"]');
  ok(/palapa/.test(m8) && !/\n/.test(m8), 'Tipo de fiesta sin elegir nada: solo la frase (no se mezcla con la estancia)', m8);
  const fc = p.locator('form[data-fiesta]'); await fc.scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
  await fc.locator('[data-fecha] .ctrl-btn').first().click(); await p.waitForTimeout(250); await fc.locator('[data-fecha] .dia:not(:disabled)').nth(3).click(); await p.waitForTimeout(250);
  await fc.locator('[data-contador] button').last().click(); await p.waitForTimeout(150);
  await fc.locator('button[type=submit]').click(); await p.waitForTimeout(300);
  const m9 = await abierto();
  ok(/^Hola, quiero cotizar la palapa (.+ )?del Hotel [^\n]+\.\nFecha: [^\n]+ \d+ de [^\n]+\nPersonas: 41\nMotivo: .+$/.test(m9), '«Cotizar por WhatsApp» manda fecha, personas y motivo', m9);
  const m10 = await enlace('.celebra a.fila-plan[href*="wa.me"]');
  ok(/Fecha: /.test(m10) && /Personas: 41/.test(m10) && !/Motivo/.test(m10), 'Después, cada tipo de fiesta lleva la fecha y las personas (sin repetir el motivo)', m10);
  const m11 = await enlace('.portada a.boton[href*="wa.me"]');
  ok(/Fecha: /.test(m11) && /Motivo: /.test(m11), 'El botón de la portada de Celebraciones lleva fecha, personas y motivo', m11);
  ok(!/Fecha:/.test(await enlace('.cabecera a.boton[href*="wa.me"]')) && /Llegada:/.test(await enlace('.cabecera a.boton[href*="wa.me"]')), 'El «Reservar» del menú sigue llevando la estancia, no la fiesta');
  } else {
    const mp = await enlace('main a[href*="wa.me"]');
    ok(/Llegada:/.test(mp) && /Huéspedes:/.test(mp), 'Palapa para huéspedes (sin cotización): su botón de WhatsApp lleva la estancia elegida', mp);
  }

  if (errores.length) { fallas++; console.log('  ✗ errores en la página: ' + errores.slice(0, 3).join(' | ')); }
  await ctx.close();
}
await sitio(QA, { indice: 0, frase: 'la habitación con vista a la sierra' }, 'hospedaje', 'celebraciones');
await sitio(LA, { indice: 2, frase: 'el departamento con cocina' }, 'habitaciones', 'palapa');
await nav.close();
console.log(fallas ? `\n${fallas} comprobaciones fallaron` : '\nTodos los mensajes de WhatsApp llevan lo elegido');
