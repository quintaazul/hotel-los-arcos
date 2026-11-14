// Movimiento sin librerías. Las animaciones las hace el navegador con CSS (src/styles/movimiento.css);
// este código solo decide CUÁNDO: marca con «visto» lo que entra a la pantalla.
//
// Tres reglas que no se rompen:
// 1. Va escrito DENTRO de cada página, no en un archivo aparte (ver astro.config.mjs): no hay descarga que pueda
//    tardar, fallar o ser bloqueada por una extensión. Por eso este archivo no importa nada de otros.
// 2. El contenido nunca depende de un aviso del navegador para aparecer. Nada espera a IntersectionObserver ni a
//    requestAnimationFrame (se retrasan o se detienen con el equipo ocupado, pestañas en segundo plano o extensiones
//    pesadas): se mide la posición real de cada pieza y se dispara por tres caminos a la vez: el scroll, un reloj y
//    la carga. Si uno falla, los otros siguen. (El único aviso de cuadro que se pide es una cortesía al arrancar,
//    para dejar pintar la portada primero, y trae su propio reloj por si no llega.)
// 3. Al animar casi no se toca la página. Lo que va atado al scroll (paralaje, portada, mapa, galería) lo mueve el
//    navegador desde el CSS; aquí solo se cambian clases, una vez por pieza. Hay extensiones que vigilan cada cambio de la página, y
//    escribir estilos en cada cuadro las satura hasta congelar el navegador.

const raiz = document.documentElement;
const latido = () => { (window as any).__mov = Date.now(); };   // la red de seguridad de Base.astro vigila esta señal
const apagar = () => { raiz.classList.add('sin-mov'); };   // todo se muestra, sin animación
// Todo lo que corre después del arranque (scroll, reloj, carga) pasa por aquí: si un día falla, la página se muestra
// completa en lugar de quedarse con piezas escondidas.
function seguro<T extends unknown[]>(f: (...a: T) => void) { return (...a: T) => { try { f(...a); } catch (e) { apagar(); } }; }

function arrancar() {
  const $$ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => Array.prototype.slice.call(r.querySelectorAll(s)) as T[];
  const $ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T | null;
  const quieto = matchMedia('(prefers-reduced-motion: reduce)');
  const altoCab = () => { const c = $('#cabecera'); return c ? c.offsetHeight : 72; };
  // Duraciones del sistema (sistema.css), leídas de la página para no depender de otro archivo. En milisegundos.
  const dur = (nombre: string, respaldo: number) => { const v = getComputedStyle(raiz).getPropertyValue(nombre).trim(), n = parseFloat(v); return isNaN(n) ? respaldo : /ms$/.test(v) ? n : n * 1000; };
  const D = { escena: dur('--d-escena', 800), ambiente: dur('--d-ambiente', 1300) };
  const alCambiar = (m: MediaQueryList, f: () => void) => { if (m.addEventListener) m.addEventListener('change', f); else (m as any).addListener?.(f); };

  /* Enlaces a una parte de la misma página: bajan suave y dejan libre la cabecera */
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null;
    if (!a) return;
    const id = a.getAttribute('href')!;
    let el: Element | null = null;
    try { el = id.length > 1 ? document.querySelector(id) : null; } catch { /* un ancla que no es un selector válido */ }
    if (!el) return;
    e.preventDefault();
    const top = el.getBoundingClientRect().top + scrollY - altoCab() - 16;
    try { scrollTo({ top, behavior: quieto.matches ? 'auto' : 'smooth' }); } catch { scrollTo(0, top); }
    history.replaceState(null, '', id);
  });

  // Si la red de seguridad ya mostró todo (la página tardó demasiado en llegar), se queda así: no se esconde nada
  // de lo que la persona ya está viendo.
  if (raiz.classList.contains('sin-mov')) return;
  let primera = false;   // ¿ya corrió la primera pasada? (espera a que el navegador pinte la portada)

  /* La palabra «Reservar» ocupa todo el ancho */
  function ajustarPalabra() {
    $$('[data-palabra-cta]').forEach((p) => {
      const antes = p.style.fontSize;
      p.style.fontSize = '';
      const est = getComputedStyle(p);
      const pad = parseFloat(est.paddingLeft) + parseFloat(est.paddingRight);
      const disp = (p.parentElement ? p.parentElement.clientWidth : innerWidth) - pad;
      const ancho = p.scrollWidth - pad;
      const nuevo = ancho > 0 ? Math.min(parseFloat(est.fontSize) * disp / ancho, 380).toFixed(1) + 'px' : '';
      p.style.fontSize = nuevo === antes ? antes : nuevo;
    });
  }
  /* Galería que se desliza: el CSS la mueve; aquí solo se le dice cuánto mide el recorrido */
  function medirGalerias() {
    $$('[data-galeria]').forEach((p) => { const v = Math.max(0, p.scrollWidth - innerWidth + 32) + 'px'; if (p.style.getPropertyValue('--recorrido') !== v) p.style.setProperty('--recorrido', v); });
  }

  /* ── Lo que aparece al bajar ── */
  const SEL = '[data-titulo],[data-aparece],[data-revela],[data-nombre-serie],[data-contar],[data-indice],.habs-lista .hab,.mapa,.pie';
  let pendientes = $$(SEL).filter((el) => !el.classList.contains('visto'));

  /* Cifras que cuentan. El avance sale del reloj: si el navegador deja de avisar, igual termina. */
  function contar(el: HTMLElement) {
    const hasta = parseFloat(el.dataset.contar!), dec = +(el.dataset.decimales || 0);
    if (quieto.matches || isNaN(hasta)) return;
    const t0 = performance.now();
    const paso = () => { const p = Math.min(1, (performance.now() - t0) / D.ambiente); el.textContent = (hasta * (1 - Math.pow(2, -10 * p)) / (1 - Math.pow(2, -10))).toFixed(dec); if (p < 1) setTimeout(paso, 40); };
    paso();
  }

  /* Habitaciones: la foto cambia con una cortina cuando otra ficha pasa por el centro */
  const habs = $('[data-habs]');
  const capas = habs ? $$('.habs-media .capa', habs) : [], fichas = habs ? $$('.habs-lista .hab', habs) : [], cuenta = habs ? $('[data-cuenta]', habs) : null;
  let fichaActual = 0, finCortina = 0;
  function mostrarFicha(i: number) {
    if (i === fichaActual || !capas[i]) return;
    const prev = capas[fichaActual], sig = capas[i];
    capas.forEach((c) => c.classList.remove('sale', 'entra-abajo', 'entra-arriba'));
    prev.classList.add('sale');
    sig.classList.add('activa', i > fichaActual ? 'entra-abajo' : 'entra-arriba');
    clearTimeout(finCortina);
    finCortina = window.setTimeout(() => { capas.forEach((c, k) => { if (k !== i) c.classList.remove('activa', 'sale'); }); sig.classList.remove('entra-abajo', 'entra-arriba'); }, quieto.matches ? 0 : D.escena + 60);
    fichaActual = i;
    if (cuenta) cuenta.textContent = (i + 1) + ' de ' + fichas.length;
  }
  const cintas = $$('.cinta'), mapas = $$('.mapa');
  /* WhatsApp flotante: se esconde donde ya hay un botón grande de reservar */
  const waf = $('#wa-flota'), zonasWa = waf ? $$('.portada, .banda-cta, .pie') : [];

  /* Reseña que se entinta palabra por palabra mientras pasa por la pantalla */
  const citas = $$('[data-palabras]').map((el) => {
    const texto = (el.textContent || '').trim();
    el.setAttribute('aria-label', texto);
    while (el.firstChild) el.removeChild(el.firstChild);
    texto.split(/\s+/).forEach((p, i) => { const s = document.createElement('span'); s.className = quieto.matches ? 'pal tinta' : 'pal'; s.setAttribute('aria-hidden', 'true'); s.textContent = p; if (i) el.appendChild(document.createTextNode(' ')); el.appendChild(s); });
    const pals = $$('.pal', el);
    return { el, pals, hechas: quieto.matches ? pals.length : 0 };
  });

  /* La revisión: una pasada mide dónde está cada pieza y otra aplica lo que cambió (primero se lee todo y después se
     escribe todo, para que el navegador acomode la página una sola vez). Corre con el scroll, con el reloj y al cargar. */
  let ultima = 0, cola = 0;
  function revisar(forzar = false) {
    const ahora = performance.now();
    if (!forzar && ahora - ultima < 70) {   // con una pasada cada 70 ms sobra; la última nunca se pierde
      if (!cola) cola = window.setTimeout(seguro(() => { cola = 0; revisar(true); }), 80);
      return;
    }
    ultima = ahora; latido();
    const h = innerHeight, w = innerWidth, linea = h * 0.91;
    const dentro = (r: DOMRect) => (r.width > 0 || r.height > 0) && r.bottom > 0 && r.top < h;

    // 1) Leer
    const entran: [HTMLElement, number][] = [];
    if (pendientes.length) {
      let orden = 0; const siguen: HTMLElement[] = [];
      for (const el of pendientes) {
        const r = el.getBoundingClientRect();
        // Entra cuando su borde de arriba cruza la línea del 91 % de la pantalla. Lo que ya quedó arriba también se
        // marca: nada de lo que ya pasaste debe seguir escondido si regresas.
        if ((r.width > 0 || r.height > 0) && r.top < linea && r.left < w && r.right > 0) entran.push([el, r.bottom > 0 ? orden++ : 0]);
        else siguen.push(el);
      }
      pendientes = siguen;
    }
    let ficha = -1;
    if (fichas.length && fichas[0].offsetParent) { let cerca = Infinity; fichas.forEach((f, i) => { const r = f.getBoundingClientRect(), d = Math.abs((r.top + r.bottom) / 2 - h * 0.5); if (d < cerca) { cerca = d; ficha = i; } }); }
    const cintasFuera = cintas.map((c) => !dentro(c.getBoundingClientRect()));
    const mapasVivos = mapas.map((m) => dentro(m.getBoundingClientRect()));
    const waLejos = zonasWa.some((z) => dentro(z.getBoundingClientRect()));
    const tinta = citas.map((c) => {
      const r = c.el.getBoundingClientRect();
      if (r.bottom < -h || r.top > h * 2) return -1;
      // empieza cuando el párrafo asoma al 82 % de la pantalla y termina cuando ya se ve entero (su final al 72 %)
      return Math.round(Math.min(1, Math.max(0, (h * 0.82 - r.top) / (r.height + h * 0.1))) * c.pals.length);
    });

    // 2) Escribir (solo lo que cambió)
    for (const [el, orden] of entran) {
      if (el.hasAttribute('data-aparece') && orden) el.style.setProperty('--orden', String(Math.min(orden, 8)));
      el.classList.add('visto');
      if (el.hasAttribute('data-contar')) contar(el);
    }
    if (ficha >= 0) mostrarFicha(ficha);
    // Lo que corre solo se detiene cuando no se ve (si esta revisión dejara de correr, se queda andando: nunca al revés)
    cintas.forEach((c, i) => { if (c.classList.contains('fuera') !== cintasFuera[i]) c.classList.toggle('fuera', cintasFuera[i]); });
    mapas.forEach((m, i) => { if (m.classList.contains('vivo') !== mapasVivos[i]) m.classList.toggle('vivo', mapasVivos[i]); });
    if (waf && waf.classList.contains('lejos') !== waLejos) waf.classList.toggle('lejos', waLejos);
    citas.forEach((c, k) => {
      const n = tinta[k]; if (n < 0 || n === c.hechas) return;
      for (let i = Math.min(n, c.hechas); i < Math.max(n, c.hechas); i++) c.pals[i].classList.toggle('tinta', i < n);
      c.hechas = n;
    });
  }
  (window as any).__refrescarScroll = seguro(() => revisar(true));

  /* ── Índice del blog: la vista previa acompaña a la fila sobre la que está el ratón ── */
  const ind = $('[data-indice]'), vp = ind && $('[data-vista-previa]', ind);
  if (ind && vp) {
    const capasI = $$('.capa', vp), filas = $$('.fila-plan', ind);
    const activar = (i: number) => capasI.forEach((c, k) => c.classList.toggle('activa', k === i));
    activar(0);
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      const posY = (f: HTMLElement) => Math.max(0, Math.min(f.offsetTop + f.offsetHeight / 2 - vp.offsetHeight / 2, ind.offsetHeight - vp.offsetHeight));
      filas.forEach((f) => f.addEventListener('pointerenter', () => { activar(+(f.dataset.prev || 0)); vp.style.setProperty('--y', posY(f) + 'px'); }));
      ind.addEventListener('pointerleave', () => { activar(0); vp.style.setProperty('--y', '0px'); });
    }
  }

  /* ── Arranque y disparadores ── */
  const todo = seguro(() => { primera = true; ajustarPalabra(); medirGalerias(); revisar(true); });
  const paso = seguro(() => { if (!primera) return; revisar(); });
  // La primera pasada deja que el navegador pinte antes la portada (que no depende de este código): medir obliga a
  // acomodar la página entera y eso retrasaría la primera imagen. Se pide un cuadro como cortesía, pero no se depende
  // de él: con aviso o sin aviso, a los 120 ms corre.
  const iniciar = () => { if (!primera) todo(); };
  try { requestAnimationFrame(() => setTimeout(iniciar, 0)); } catch (e) { /* sin aviso de cuadro: corre con el reloj */ }
  setTimeout(iniciar, 120);
  // 1) El scroll: el de la página y el de cualquier fila que se deslice (por eso se escucha en la captura).
  //    Se revisa cada 70 ms como mucho.
  document.addEventListener('scroll', paso, { passive: true, capture: true });
  // 2) El reloj: aunque no llegue ningún aviso, lo que esté en pantalla aparece en un cuarto de segundo.
  //    Si desde la última vuelta nada se movió ni cambió de tamaño, no hay nada que medir: la página en reposo no
  //    trabaja. Cada 2 segundos se revisa de todos modos, por si algo cambió sin moverse.
  let huella = '', vueltas = 0;
  setInterval(seguro(() => {
    latido();
    if (!primera) return;
    // (solo datos que el navegador ya tiene a la mano: preguntar el alto de la página lo obligaría a acomodarla)
    const ahora = scrollX + ',' + scrollY + ',' + innerWidth + ',' + innerHeight;
    if (ahora === huella && ++vueltas % 8) return;
    huella = ahora; revisar();
  }), 250);
  // 3) La carga y los cambios de tamaño: las posiciones cambian cuando llegan las letras, las fotos o gira la pantalla
  //    (si todavía no corre la primera pasada, ella misma lo cubre)
  const otraVez = () => { if (primera) todo(); };
  if ((document as any).fonts && document.fonts.ready) document.fonts.ready.then(otraVez);
  addEventListener('load', otraVez);
  addEventListener('pageshow', otraVez);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) otraVez(); });
  // Al imprimir, todo lo que esperaba su turno se da por visto (el CSS, además, no esconde nada en papel)
  addEventListener('beforeprint', seguro(() => { pendientes.forEach((el) => el.classList.add('visto')); pendientes = []; }));
  let tRes = 0;
  addEventListener('resize', () => { clearTimeout(tRes); tRes = window.setTimeout(otraVez, 160); }, { passive: true });
}

latido();
// Si algo de aquí falla, la página no se queda con contenido escondido: se muestra todo, sin animación.
try { arrancar(); } catch (e) { apagar(); }
