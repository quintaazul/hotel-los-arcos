import { estancia, fiesta, ponerEstancia, ponerFiesta, diaLargo, conRenglones, abrir, enlace } from './whatsapp';
// Controles propios del sitio: ventanas flotantes, desplegable, calendario, contador y validación.
// Nada usa los menús del navegador. En celular las ventanas flotantes se vuelven hojas que suben desde abajo.
const $ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T | null;
const $$ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll(s)] as T[];
const raiz = document.documentElement;
const esMovil = () => matchMedia('(max-width: 760px)').matches;
const lenis = () => (window as any).__lenis as { stop(): void; start(): void; scrollTo(y: number): void } | undefined;

/* ───────── Ventanas flotantes ───────── */
type Abierta = { panel: HTMLElement; btn: HTMLElement; padre: Node | null; sig: Node | null; alCerrar?: () => void };
let abierta: Abierta | null = null;

export function abrirFlota(panel: HTMLElement, btn: HTMLElement, opc: { foco?: () => HTMLElement | null; alCerrar?: () => void } = {}) {
  cerrarFlotas();
  abierta = { panel, btn, padre: null, sig: null, alCerrar: opc.alCerrar };
  if (esMovil()) {
    // La hoja se muda al final de la página mientras está abierta: así ningún contenedor la recorta ni la mueve.
    abierta.padre = panel.parentNode; abierta.sig = panel.nextSibling;
    document.body.appendChild(panel);
    $('#velo')?.classList.add('visible'); raiz.classList.add('con-flota'); lenis()?.stop();
    void panel.offsetHeight;
  } else {
    panel.classList.remove('arriba');
    const r = panel.getBoundingClientRect(), b = btn.getBoundingClientRect();
    if (r.top + r.height > innerHeight - 12 && b.top - r.height - 20 > 0) panel.classList.add('arriba');
    else if (r.top + r.height > innerHeight - 12) { const y = r.top + r.height - innerHeight + 24; lenis() ? lenis()!.scrollTo(scrollY + y) : scrollBy({ top: y, behavior: 'smooth' }); }
  }
  panel.classList.add('abierta'); btn.setAttribute('aria-expanded', 'true');
  setTimeout(() => (opc.foco?.() || $('[autofocus], button:not(:disabled), [tabindex="0"]', panel) || panel).focus({ preventScroll: true }), 60);
}

export function cerrarFlotas(devolver = false) {
  if (!abierta) return;
  const a = abierta; abierta = null;
  a.panel.classList.remove('abierta'); a.btn.setAttribute('aria-expanded', 'false');
  if (a.padre) {
    $('#velo')?.classList.remove('visible'); raiz.classList.remove('con-flota'); lenis()?.start();
    // vuelve a su lugar cuando termina de bajar
    setTimeout(() => { if (abierta?.panel !== a.panel) a.padre!.insertBefore(a.panel, a.sig); }, 520);
  }
  a.alCerrar?.();
  if (devolver) a.btn.focus({ preventScroll: true });
}
export const hayFlota = () => !!abierta;

document.addEventListener('pointerdown', (e) => {
  if (!abierta) return;
  const t = e.target as HTMLElement;
  if (t.id === 'velo' || (!abierta.panel.contains(t) && !abierta.btn.contains(t))) cerrarFlotas();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && abierta) { e.stopPropagation(); cerrarFlotas(true); } }, true);
document.addEventListener('focusin', (e) => {
  if (!abierta || esMovil()) return;
  const t = e.target as HTMLElement;
  if (!abierta.panel.contains(t) && !abierta.btn.contains(t)) cerrarFlotas();
});

/* ───────── Fechas ───────── */
export const HOY = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
export const masDias = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const mismoDia = (a: Date | null, b: Date | null) => !!a && !!b && a.getTime() === b.getTime();
export const iso = (d: Date) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
export const deIso = (s: string) => { const [a, m, d] = s.split('-').map(Number); return new Date(a, m - 1, d); };
// Los formateadores se crean una sola vez: crear uno por fecha (lo que hace toLocaleDateString) es lento,
// y el calendario escribe más de 60 fechas cada vez que se dibuja.
const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('es-MX', o);
const F = { corta: fmt({ day: 'numeric', month: 'short' }), media: fmt({ weekday: 'short', day: 'numeric', month: 'short' }), larga: fmt({ weekday: 'long', day: 'numeric', month: 'long' }), mes: fmt({ month: 'long', year: 'numeric' }), dia: fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) };
export const fechaCorta = (d: Date) => F.corta.format(d).replace('.', '');
export const fechaMedia = (d: Date) => F.media.format(d).replace(/\./g, '');
export const fechaLarga = (d: Date) => F.larga.format(d);
export const nombreMes = (d: Date) => { const n = F.mes.format(d); return n.charAt(0).toUpperCase() + n.slice(1); };

/** Días de un mes como botones. `clases` decide cómo se ve cada día (inicio, fin, rango). */
export function diasDelMes(base: Date, min: Date, clases: (f: Date) => string[]) {
  const desfase = (base.getDay() + 6) % 7, total = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  let h = '<span></span>'.repeat(desfase);
  for (let d = 1; d <= total; d++) {
    const f = new Date(base.getFullYear(), base.getMonth(), d), c = ['dia', ...clases(f)];
    if (mismoDia(f, HOY)) c.push('hoy');
    const marcado = c.includes('inicio') || c.includes('fin');
    h += `<button type="button" class="${c.join(' ')}" data-dia="${+f}"${f < min ? ' disabled' : ''} aria-pressed="${marcado}" aria-label="${F.dia.format(f)}" tabindex="-1">${d}</button>`;
  }
  return h;
}
/** Mueve el foco entre días con el teclado. Devuelve la fecha destino o null si la tecla no aplica. */
export function teclaDeDia(e: KeyboardEvent, desde: Date): Date | null {
  const paso: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
  if (e.key in paso) return masDias(desde, paso[e.key]);
  if (e.key === 'PageDown') return new Date(desde.getFullYear(), desde.getMonth() + 1, desde.getDate());
  if (e.key === 'PageUp') return new Date(desde.getFullYear(), desde.getMonth() - 1, desde.getDate());
  if (e.key === 'Home') return masDias(desde, -((desde.getDay() + 6) % 7));
  if (e.key === 'End') return masDias(desde, 6 - ((desde.getDay() + 6) % 7));
  return null;
}

/* ───────── Campo de fecha (una sola fecha) ───────── */
function campoFecha(caja: HTMLElement) {
  const inp = $<HTMLInputElement>('input[type="hidden"]', caja)!, btn = $('.ctrl-btn', caja)!, panel = $('.flota', caja)!;
  const val = $('.ctrl-val', btn)!, vacio = val.textContent || 'Elige fecha', titulo = $('[data-mes-nombre]', panel)!, dias = $('[data-dias]', panel)!, prev = $<HTMLButtonElement>('[data-mes="-1"]', panel)!;
  const otro = caja.dataset.despuesDe ? $<HTMLInputElement>('#' + caja.dataset.despuesDe) : null;
  let valor: Date | null = inp.value ? deIso(inp.value) : null;
  let mes = new Date((valor || HOY).getFullYear(), (valor || HOY).getMonth(), 1);
  const min = () => (otro?.value ? masDias(deIso(otro.value), 1) : HOY);
  const pintar = (enfocar?: Date) => {
    titulo.textContent = nombreMes(mes);
    dias.innerHTML = diasDelMes(mes, min(), (f) => (mismoDia(f, valor) ? ['inicio', 'fin'] : []));
    prev.disabled = mes <= new Date(min().getFullYear(), min().getMonth(), 1);
    const libres = $$('.dia:not(:disabled)', dias);
    const obj = enfocar ? libres.find((d) => +d.dataset.dia! === +enfocar) : null;
    const tab = obj || libres.find((d) => d.classList.contains('inicio')) || libres[0];
    if (tab) tab.tabIndex = 0;
    obj?.focus();
  };
  const poner = (f: Date | null, avisar = true) => {
    valor = f; inp.value = f ? iso(f) : ''; inp.dataset.texto = f ? fechaLarga(f) : '';
    val.textContent = f ? fechaMedia(f) : vacio; val.classList.toggle('sin-valor', !f);
    if (avisar) inp.dispatchEvent(new Event('change', { bubbles: true }));
  };
  inp.addEventListener('poner', (e) => poner((e as CustomEvent).detail ? new Date((e as CustomEvent).detail) : null, false));
  btn.addEventListener('click', () => {
    if (btn.getAttribute('aria-expanded') === 'true') return cerrarFlotas(true);
    const base = valor || min(); mes = new Date(base.getFullYear(), base.getMonth(), 1); pintar();
    abrirFlota(panel, btn, { foco: () => $('.dia[tabindex="0"]', dias) });
  });
  panel.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest('button') as HTMLElement | null; if (!t) return;
    if (t.dataset.dia) { poner(new Date(+t.dataset.dia)); cerrarFlotas(true); }
    else if (t.dataset.mes) { mes = new Date(mes.getFullYear(), mes.getMonth() + +t.dataset.mes, 1); pintar(); }
    else if (t.dataset.borrar !== undefined) { poner(null); pintar(); }
    else if (t.dataset.listo !== undefined) cerrarFlotas(true);
  });
  panel.addEventListener('keydown', (e) => {
    const d = (e.target as HTMLElement).closest('.dia') as HTMLElement | null; if (!d) return;
    let f = teclaDeDia(e, new Date(+d.dataset.dia!)); if (!f) return;
    e.preventDefault(); if (f < min()) f = min();
    mes = new Date(f.getFullYear(), f.getMonth(), 1); pintar(f);
  });
  // La salida nunca queda antes de la llegada
  otro?.addEventListener('change', () => { if (valor && otro.value && valor <= deIso(otro.value)) poner(null); });
}

/* ───────── Desplegable (lista de opciones) ───────── */
function desplegable(caja: HTMLElement) {
  const sel = $<HTMLSelectElement>('select', caja)!, btn = $('.ctrl-btn', caja)!, lista = $('.desp-lista', caja)!, val = $('.ctrl-val', btn)!;
  const check = lista.dataset.check || '';
  lista.innerHTML = [...sel.options].map((o, i) => `<li class="opcion" role="option" id="${sel.id}-o${i}" data-i="${i}" aria-selected="${o.selected}"><span>${o.textContent}</span>${check}</li>`).join('');
  const ops = $$('.opcion', lista);
  let activa = sel.selectedIndex, buscado = '', reloj = 0;
  const activar = (i: number) => {
    activa = Math.max(0, Math.min(ops.length - 1, i));
    ops.forEach((o, k) => o.classList.toggle('activa', k === activa));
    lista.setAttribute('aria-activedescendant', ops[activa].id); ops[activa].scrollIntoView({ block: 'nearest' });
  };
  const elegir = (i: number, cerrar = true) => {
    sel.selectedIndex = i; val.textContent = sel.options[i].textContent;
    ops.forEach((o, k) => o.setAttribute('aria-selected', String(k === i)));
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    if (cerrar) cerrarFlotas(true);
  };
  const abrir = () => { activar(sel.selectedIndex); abrirFlota(lista, btn, { foco: () => lista }); };
  const porLetra = (k: string) => {
    clearTimeout(reloj); buscado += k.toLowerCase(); reloj = window.setTimeout(() => (buscado = ''), 600);
    const i = ops.findIndex((o) => o.textContent!.trim().toLowerCase().startsWith(buscado));
    return i;
  };
  btn.addEventListener('click', () => (btn.getAttribute('aria-expanded') === 'true' ? cerrarFlotas(true) : abrir()));
  $('label', caja)?.addEventListener('click', (e) => { e.preventDefault(); btn.focus(); });
  btn.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); abrir(); }
    else if (e.key.length === 1 && /\S/.test(e.key)) { const i = porLetra(e.key); if (i >= 0) elegir(i, false); }
  });
  lista.addEventListener('click', (e) => { const o = (e.target as HTMLElement).closest('.opcion') as HTMLElement | null; if (o) elegir(+o.dataset.i!); });
  lista.addEventListener('pointermove', (e) => { const o = (e.target as HTMLElement).closest('.opcion') as HTMLElement | null; if (o && +o.dataset.i! !== activa) activar(+o.dataset.i!); });
  lista.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); activar(activa + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); activar(activa - 1); }
    else if (e.key === 'Home') { e.preventDefault(); activar(0); }
    else if (e.key === 'End') { e.preventDefault(); activar(ops.length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); elegir(activa); }
    else if (e.key === 'Tab') { elegir(activa, false); cerrarFlotas(); }
    else if (e.key.length === 1 && /\S/.test(e.key)) { const i = porLetra(e.key); if (i >= 0) activar(i); }
  });
}

/* ───────── Contador (número con − y +) ───────── */
function contador(caja: HTMLElement) {
  const inp = $<HTMLInputElement>('input', caja)!, min = +(inp.dataset.min || 0), max = +(inp.dataset.max || 99);
  const [menos, mas] = $$<HTMLButtonElement>('button', caja);
  const poner = (n: number) => { const v = Math.max(min, Math.min(max, Math.round(n) || min)); inp.value = String(v); menos.disabled = v <= min; mas.disabled = v >= max; };
  menos.addEventListener('click', () => { poner(+inp.value - 1); inp.dispatchEvent(new Event('change', { bubbles: true })); });
  mas.addEventListener('click', () => { poner(+inp.value + 1); inp.dispatchEvent(new Event('change', { bubbles: true })); });
  inp.addEventListener('input', () => { inp.value = inp.value.replace(/\D/g, '').slice(0, String(max).length); });
  inp.addEventListener('blur', () => poner(+inp.value));
  inp.addEventListener('keydown', (e) => { if (e.key === 'ArrowUp') { e.preventDefault(); poner(+inp.value + 1); } else if (e.key === 'ArrowDown') { e.preventDefault(); poner(+inp.value - 1); } });
  inp.addEventListener('poner', (e) => poner(+(e as CustomEvent).detail));
  poner(+inp.value);
}

/* ───────── Validación propia (sin los globos del navegador) ───────── */
function revisar(c: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) {
  const campo = c.closest('.campo, .casilla') as HTMLElement | null; if (!campo) return true;
  let msg = '';
  const v = c.type === 'checkbox' ? ((c as HTMLInputElement).checked ? 'x' : '') : c.value.trim();
  if ((c.required || c.dataset.requerido !== undefined) && !v) msg = campo.dataset.falta || 'Este dato hace falta.';
  else if (v && c.dataset.tipo === 'contacto' && !/^(\+?[\d\s().-]{8,}|[^\s@]+@[^\s@]+\.[^\s@]{2,})$/.test(v)) msg = 'Escribe un teléfono o un correo válido.';
  const e = $('.campo-error span', campo);
  campo.classList.toggle('mal', !!msg); if (e) e.textContent = msg;
  const visible = (campo.querySelector('.ctrl, input[type="checkbox"]') as HTMLElement | null) || c;
  visible.setAttribute('aria-invalid', String(!!msg));
  return !msg;
}

/* ───────── Arranque ───────── */
$$('[data-fecha]').forEach(campoFecha);
$$('[data-desplegable]').forEach(desplegable);
$$('[data-contador]').forEach(contador);
$$<HTMLFormElement>('form[data-whatsapp]:not([data-enviar])').forEach((f) => {
  f.noValidate = true;
  const dato = (n: string) => f.querySelector<HTMLInputElement>('[name="' + n + '"]');
  // Cotización de la palapa: lo que se elige aquí lo llevan también los demás botones de «Cotizar»; y si ya se eligió en esta visita, el formulario abre con eso
  if (f.hasAttribute('data-fiesta')) {
    const g = fiesta(), fe = dato('Fecha'), pe = dato('Personas');
    if (g.f && fe) fe.dispatchEvent(new CustomEvent('poner', { detail: g.f })); if (g.p && pe) pe.dispatchEvent(new CustomEvent('poner', { detail: g.p }));
    f.addEventListener('change', () => ponerFiesta({ f: fe?.value ? +deIso(fe.value) : undefined, p: +(pe?.value || 0) || undefined, tipo: (dato('Motivo')?.dataset.texto || dato('Motivo')?.value || '').trim() || undefined }, 'formulario'));
  }
  const campos = () => $$<HTMLInputElement>('input[name], input[required], textarea, select', f);
  f.addEventListener('change', (e) => { const c = e.target as HTMLInputElement; if (c.closest('.mal')) revisar(c); });
  f.addEventListener('input', (e) => { const c = e.target as HTMLInputElement; if (c.closest('.mal')) revisar(c); });
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const malos = campos().filter((c) => !revisar(c));
    if (malos.length) { const m = malos[0].closest('.campo, .casilla') as HTMLElement; ((m.querySelector('.ctrl, input[type="checkbox"]') as HTMLElement) || m).focus(); return; }
    // Maqueta local: arma el mensaje de WhatsApp. En el sitio publicado se guarda en la base y avisa por correo.
    const renglones: string[] = [];
    campos().forEach((c) => {
      if (!c.name || (c.type === 'radio' && !c.checked) || c.type === 'checkbox') return;
      const v = (/^\d{4}-\d\d-\d\d$/.test(c.value) ? diaLargo(+deIso(c.value)) : c.dataset.texto || c.value).trim(); if (v) renglones.push(c.name + ': ' + v);
    });
    abrir(f.dataset.numero!, conRenglones(f.dataset.whatsapp || 'Hola', renglones));
  });
});

/* ───────── Formulario de reserva: se manda al hotel por correo ─────────
   Igual que en los sitios publicados: POST /api/contacto, que guarda la solicitud y avisa al correo del hotel.
   Los nombres de los campos son los que espera ese servicio (nombre, contacto, fechas, personas, habitacion, motivo,
   mensaje, privacidad). La verificación anti-spam de Cloudflare solo se carga en el dominio real del hotel; en la
   copia de prueba y en la computadora no hace falta. Si el envío falla, se ofrece mandarla por WhatsApp. */
$$<HTMLFormElement>('form[data-enviar]').forEach((f) => {
  f.noValidate = true;
  const campos = () => $$<HTMLInputElement>('input[name], input[required], textarea, select', f);
  const valor = (n: string) => { const c = f.elements.namedItem(n) as (HTMLInputElement | RadioNodeList | null); return ((c as HTMLInputElement | null)?.value || '').trim(); };
  const texto = (n: string) => { const c = f.querySelector<HTMLInputElement>('[name="' + n + '"]'); return ((c?.dataset.texto || c?.value) || '').trim(); };
  const ok = $('[data-form-ok]', f), fallo = $('[data-form-fallo]', f), enReal = /(^|\.)(hotelquintaazul|hotelarcosinn)\.com$/.test(location.hostname);
  { const g = estancia(), pone = (n: string, v: unknown) => { const c = f.querySelector<HTMLInputElement>('[name="' + n + '"]'); if (c && v) c.dispatchEvent(new CustomEvent('poner', { detail: v })); };
    pone('llegada', g.ll); pone('salida', g.sa); pone('personas', g.ad ? g.ad + (g.ni || 0) : 0);
    f.addEventListener('change', (e) => { const n = (e.target as HTMLInputElement).name; if (!['llegada', 'salida', 'personas'].includes(n)) return;
      const ll = valor('llegada'), sa = valor('salida'), p = +valor('personas');
      ponerEstancia(n === 'personas' ? { ad: p || undefined, ni: 0, mas: false } : { ll: ll ? +deIso(ll) : undefined, sa: ll && sa ? +deIso(sa) : undefined }, 'contacto'); }); }
  let widget: string | undefined;
  if (enReal && f.dataset.turnstile) {
    const caja = $('[data-turnstile-caja]', f); if (caja) caja.hidden = false;
    (window as any).__alCargarTurnstile = () => { widget = (window as any).turnstile.render(caja, { sitekey: f.dataset.turnstile, action: 'contacto', appearance: 'interaction-only', language: 'es' }); };
    const s = document.createElement('script'); s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__alCargarTurnstile'; s.async = true; s.defer = true; document.head.appendChild(s);
  }
  f.addEventListener('change', (e) => { const c = e.target as HTMLInputElement; if (c.closest('.mal')) revisar(c); });
  f.addEventListener('input', (e) => { const c = e.target as HTMLInputElement; if (c.closest('.mal')) revisar(c); });
  $('[data-form-otra]', f)?.addEventListener('click', () => { f.reset(); f.classList.remove('enviado'); if (ok) ok.hidden = true; ($('.ctrl', f) as HTMLElement | null)?.focus(); });
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (f.classList.contains('enviando')) return;
    const malos = campos().filter((c) => !revisar(c));
    if (malos.length) { const m = malos[0].closest('.campo, .casilla') as HTMLElement; ((m.querySelector('.ctrl, input[type="checkbox"]') as HTMLElement) || m).focus(); return; }
    const llegada = texto('llegada'), salida = texto('salida'), hab = texto('habitacion').toLowerCase();
    const fechas = llegada && salida ? 'Del ' + llegada + ' al ' + salida : llegada ? 'Llegada: ' + llegada : 'Por definir';
    const d = new FormData();
    d.set('nombre', valor('nombre')); d.set('contacto', valor('contacto')); d.set('fechas', fechas); d.set('personas', valor('personas'));
    if (valor('llegada')) d.set('llegada', valor('llegada')); if (valor('llegada') && valor('salida')) d.set('salida', valor('salida'));   // aparte y en AAAA-MM-DD, para que el correo del hotel las muestre bien
    d.set('habitacion', hab.includes('sencilla') ? 'sencilla' : hab.includes('doble') ? 'doble' : hab.includes('triple') ? 'triple' : hab.includes('departamento') ? 'departamento' : '');
    d.set('motivo', valor('motivo')); d.set('mensaje', valor('mensaje') || '(sin mensaje)'); d.set('privacidad', 'si');
    const token = (f.querySelector('[name="cf-turnstile-response"]') as HTMLInputElement | null)?.value; if (token) d.set('cf-turnstile-response', token);
    f.classList.add('enviando'); if (fallo) fallo.hidden = true;
    try {
      const r = await fetch(f.dataset.enviar!, { method: 'POST', body: d, headers: { Accept: 'application/json' } });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j || !j.ok) throw new Error((j && (j.mensaje || j.error)) || '');
      const t = $('[data-form-ok-txt]', f); if (t && j.prueba && j.mensaje) t.textContent = j.mensaje;
      f.classList.add('enviado'); if (ok) { ok.hidden = false; ok.focus(); }
    } catch (err) {
      // no se pierde la reserva: los mismos datos, listos para mandarse por WhatsApp
      const dia = (n: string) => (valor(n) ? diaLargo(+deIso(valor(n))) : '');
      const renglones = ['Nombre: ' + valor('nombre'), 'Contacto: ' + valor('contacto'), dia('llegada') && 'Llegada: ' + dia('llegada'), dia('salida') && 'Salida: ' + dia('salida'), 'Personas: ' + valor('personas'), texto('habitacion') && 'Habitación: ' + texto('habitacion').replace(/^Habitación /i, ''), texto('motivo') && 'Motivo: ' + texto('motivo'), valor('mensaje') && 'Mensaje: ' + valor('mensaje')].filter(Boolean) as string[];
      const wa = $<HTMLAnchorElement>('[data-form-wa]', f); if (wa) wa.href = enlace(f.dataset.numero!, conRenglones(f.dataset.whatsapp || 'Hola', renglones));
      const t = $('[data-form-fallo-txt]', f), m = (err as Error).message; if (t && m && m.length < 160) t.textContent = m + ' También puedes mandarla por WhatsApp: ya va escrita.';
      if (fallo) fallo.hidden = false;
    } finally {
      f.classList.remove('enviando');
      if (widget !== undefined) (window as any).turnstile?.reset(widget);
    }
  });
});
