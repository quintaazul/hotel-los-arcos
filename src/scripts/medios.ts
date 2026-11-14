// Fotos y video: el visor a pantalla completa y el reproductor propio.
// Las fotos se abren con [data-visor="grupo"]; los videos son <figure data-video>.
import { D } from './ritmo';

const $ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T | null;
const $$ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll(s)] as T[];
const lenis = () => (window as any).__lenis as { stop(): void; start(): void } | undefined;
const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ahorro = !!(navigator as any).connection?.saveData;

/* ───────── Visor de fotos ───────── */
type Pieza = { src: string; set: string; pie: string; w: number; h: number };
const visor = $<HTMLDialogElement>('#visor');
if (visor) {
  const img = $<HTMLImageElement>('[data-visor-img]', visor)!;
  const pie = $('[data-visor-pie]', visor)!;
  const cuenta = $('[data-visor-cuenta]', visor)!;
  const flechas = $$<HTMLButtonElement>('[data-visor-ir]', visor);
  let lista: Pieza[] = [];
  let i = 0;
  let origen: HTMLElement | null = null;

  const pintar = () => {
    const p = lista[i];
    img.classList.remove('lista');
    img.width = p.w; img.height = p.h;
    img.sizes = '100vw'; img.srcset = p.set; img.src = p.src; img.alt = p.pie;
    pie.textContent = p.pie;
    cuenta.textContent = (i + 1) + ' de ' + lista.length;
    // La siguiente y la anterior se piden de una vez, para que el cambio sea inmediato
    [lista[i + 1], lista[i - 1]].forEach((v) => { if (v) { const pre = new Image(); pre.sizes = '100vw'; pre.srcset = v.set; pre.src = v.src; } });
  };
  img.addEventListener('load', () => img.classList.add('lista'));
  const ir = (paso: number) => { if (lista.length < 2) return; i = (i + paso + lista.length) % lista.length; pintar(); };

  const abrir = (grupo: string, desde: HTMLElement, url?: string) => {
    const vistos = new Set<string>();
    lista = $$('[data-visor="' + grupo + '"]').filter((b) => !vistos.has(b.dataset.grande!) && !!vistos.add(b.dataset.grande!))
      .map((b) => ({ src: b.dataset.grande!, set: b.dataset.grandeSet!, pie: b.dataset.pie ?? '', w: +b.dataset.w!, h: +b.dataset.h! }));
    if (!lista.length) return;
    i = url ? Math.max(0, lista.findIndex((p) => p.src === url)) : 0;
    // Navegador sin ventanas de diálogo (anterior a 2022): la foto grande se abre sola, como una imagen cualquiera
    if (typeof visor.show !== 'function') { location.href = lista[i].src; return; }
    origen = desde;
    flechas.forEach((f) => { f.hidden = lista.length < 2; });
    pintar();
    // Se abre sin «modal»: el modo modal obliga al navegador a recalcular toda la página (más de 100 ms en un celular).
    // El foco, la tecla Esc y el bloqueo del scroll de atrás se resuelven aquí.
    visor.show();
    void visor.offsetWidth;   // el navegador toma nota del estado cerrado y la transición corre sin esperar avisos
    visor.classList.add('abierto');
    $<HTMLElement>('[data-visor-cerrar]', visor)?.focus({ preventScroll: true });
  };
  const cerrar = () => {
    if (!visor.open) return;
    visor.classList.remove('abierto');
    setTimeout(() => { visor.close(); img.removeAttribute('srcset'); img.removeAttribute('src'); origen?.focus({ preventScroll: true }); }, reducido ? 0 : D.ui * 1000);
  };

  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const foto = t.closest<HTMLElement>('[data-visor]');
    if (foto) { abrir(foto.dataset.visor!, foto, foto.dataset.grande); return; }
    const boton = t.closest<HTMLElement>('[data-visor-abre]');
    if (boton) { abrir(boton.dataset.visorAbre!, boton); return; }
    if (!visor.open) return;
    const paso = t.closest<HTMLElement>('[data-visor-ir]');
    if (paso) { ir(+paso.dataset.visorIr!); return; }
    // Clic en el fondo oscuro (fuera de la foto y de los botones): cierra
    if (t.closest('[data-visor-cerrar]') || t === visor || t.classList.contains('visor-fig')) cerrar();
  });
  visor.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cerrar(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); ir(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); ir(-1); }
    else if (e.key === 'Tab') {
      // El foco da la vuelta dentro del visor
      const focos = $<HTMLElement>('button:not([hidden])', visor), pri = focos[0], ult = focos[focos.length - 1];
      if (e.shiftKey && document.activeElement === pri) { e.preventDefault(); ult.focus(); }
      else if (!e.shiftKey && document.activeElement === ult) { e.preventDefault(); pri.focus(); }
    } else if ([' ', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key) && (e.target as HTMLElement).tagName !== 'BUTTON') e.preventDefault();
  });
  // La página de atrás no se mueve mientras el visor está abierto
  visor.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });
  visor.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  // Deslizar con el dedo
  let x0: number | null = null;
  const fig = $('.visor-fig', visor)!;
  fig.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') x0 = e.clientX; });
  fig.addEventListener('pointerup', (e) => { if (x0 === null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 48) ir(dx < 0 ? 1 : -1); });
  fig.addEventListener('pointercancel', () => { x0 = null; });
}

/* ───────── Reproductor de video ─────────
   Propio y liviano, sin librerías. El archivo no se pide hasta que la persona toca Reproducir; mientras llega se queda
   el cartel con un aro que gira. Controles: avance (se arrastra), pausa, tiempo, volumen y pantalla completa. El
   volumen es un deslizador que sale al acercar el ratón al botón de sonido; en celular manda el botón del teléfono,
   así que ahí solo queda silenciar. Con el teclado: espacio o K pausa, ← → mueven 5 s, ↑ ↓ el volumen, M silencia y
   F amplía. El volumen elegido vale para los demás videos de la visita. */
const reloj = (s: number) => { const t = Math.max(0, Math.round(s)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };
const cajas = $$('[data-video]');
const pausarOtros = (este: HTMLVideoElement) => cajas.forEach((c) => { const v = $<HTMLVideoElement>('video', c)!; if (v !== este && !c.hasAttribute('data-ambiente') && !v.paused) v.pause(); });
const sonidoGuardado = () => { try { return JSON.parse(sessionStorage.getItem('video-sonido') || 'null') as { v: number; m: boolean } | null; } catch { return null; } };
const tactil = matchMedia('(hover: none), (pointer: coarse)').matches;

cajas.forEach((caja) => {
  const v = $<HTMLVideoElement>('video', caja)!;
  const marco = $('.video-caja', caja)!;
  const ambiente = caja.hasAttribute('data-ambiente');
  const bPausa = $<HTMLButtonElement>('[data-v="pausa"]', caja);
  const barra = $('[data-v="barra"]', caja);
  const tiempo = $('[data-v-tiempo]', caja);
  const bSonido = $<HTMLButtonElement>('[data-v="sonido"]', caja);
  const vol = $('[data-v="volumen"]', caja);
  const pulso = $('.video-pulso', caja);
  v.controls = false;   // a partir de aquí mandan nuestros botones

  // El sonido: nivel y silencio, lo que se ve en el botón y en el deslizador, y lo que se recuerda
  const ponerSonido = (nivel: number, mudo: boolean, guardar = true) => {
    v.volume = Math.min(1, Math.max(0, nivel)); v.muted = mudo || v.volume === 0;
    const visto = v.muted ? 0 : v.volume;
    caja.classList.toggle('sin-sonido', v.muted);
    bSonido?.setAttribute('aria-label', v.muted ? 'Poner el sonido' : 'Quitar el sonido');
    if (vol) { vol.style.setProperty('--vol', visto.toFixed(3)); vol.setAttribute('aria-valuenow', String(Math.round(visto * 100))); vol.setAttribute('aria-valuetext', Math.round(visto * 100) + ' %'); }
    if (guardar) try { sessionStorage.setItem('video-sonido', JSON.stringify({ v: v.volume, m: v.muted })); } catch { /* sin almacenamiento: vale para este video */ }
  };
  const silenciar = () => (v.muted ? ponerSonido(v.volume || 0.6, false) : ponerSonido(v.volume, true));

  // El aviso del centro al pausar o seguir (dos animaciones iguales que se alternan: así vuelve a correr sin medir nada)
  const avisar = () => { if (!pulso) return; const b = pulso.classList.contains('a'); pulso.classList.remove('a', 'b'); pulso.classList.add(b ? 'b' : 'a'); };
  const alternar = (conAviso = false) => { if (v.paused) { pausarOtros(v); v.play().catch(() => {}); } else v.pause(); if (conAviso) avisar(); };
  v.addEventListener('play', () => {
    if (!ambiente) { const g = sonidoGuardado(); if (g) ponerSonido(g.v, g.m, false); }
    caja.classList.add('activo'); caja.classList.remove('pausado', 'otra-vez'); if (v.readyState < 3) caja.classList.add('cargando');
    bPausa?.setAttribute('aria-label', 'Pausar'); despertar();
  });
  v.addEventListener('playing', () => { caja.classList.add('listo'); caja.classList.remove('cargando'); });
  v.addEventListener('waiting', () => caja.classList.add('cargando'));
  v.addEventListener('pause', () => { caja.classList.add('pausado'); caja.classList.remove('quieto', 'cargando'); bPausa?.setAttribute('aria-label', 'Reproducir'); });
  v.addEventListener('error', () => caja.classList.remove('activo', 'pausado', 'quieto', 'cargando', 'listo'));
  bPausa?.addEventListener('click', () => alternar());

  // Los controles se esconden a los tres segundos de quietud mientras el video corre
  let dormir = 0, estabaQuieto = false;
  const despertar = () => { caja.classList.remove('quieto'); clearTimeout(dormir); if (!ambiente && !v.paused) dormir = window.setTimeout(() => { if (!v.paused && !caja.matches(':focus-within') && !caja.querySelector('.arrastra')) caja.classList.add('quieto'); }, 3000); };
  marco.addEventListener('pointerdown', () => { estabaQuieto = caja.classList.contains('quieto'); }, { capture: true, passive: true });
  ['pointermove', 'pointerdown', 'keydown', 'focusin'].forEach((ev) => marco.addEventListener(ev, despertar, { passive: true }));

  if (ambiente) {
    // Corre sola cuando se ve en pantalla, salvo que la persona pida menos movimiento o esté ahorrando datos
    let pausadaAMano = false;
    bPausa?.addEventListener('click', () => { pausadaAMano = v.paused; });
    if (reducido || ahorro || !('IntersectionObserver' in window)) { caja.classList.add('pausado'); return; }
    new IntersectionObserver(([e]) => { if (e.isIntersecting) { if (!pausadaAMano) v.play().catch(() => {}); } else v.pause(); }, { threshold: 0.5 }).observe(marco);
    return;
  }

  { const g = sonidoGuardado(); ponerSonido(g ? g.v : 1, g ? g.m : false, false); }
  $('[data-v="iniciar"]', caja)?.addEventListener('click', () => { pausarOtros(v); v.play().catch(() => {}); bPausa?.focus({ preventScroll: true }); });
  // Con el dedo, el primer toque sobre un video que corre solo enseña los controles; el siguiente ya pausa
  v.addEventListener('click', () => { if (tactil && estabaQuieto) return; alternar(true); });
  v.addEventListener('ended', () => { caja.classList.remove('activo', 'pausado', 'quieto', 'listo'); caja.classList.add('otra-vez'); v.currentTime = 0; });

  const pintar = () => {
    const d = v.duration || 0, f = d ? v.currentTime / d : 0;
    if (barra && !barra.classList.contains('arrastra')) barra.style.setProperty('--avance', f.toFixed(4));
    barra?.setAttribute('aria-valuenow', String(Math.round(f * 100)));
    barra?.setAttribute('aria-valuetext', reloj(v.currentTime) + ' de ' + reloj(d));
    if (tiempo && d) tiempo.textContent = reloj(v.currentTime) + ' / ' + reloj(d);
  };
  v.addEventListener('timeupdate', pintar);
  v.addEventListener('loadedmetadata', pintar);
  v.addEventListener('progress', () => { const d = v.duration; if (barra && d && v.buffered.length) barra.style.setProperty('--cargado', Math.min(1, v.buffered.end(v.buffered.length - 1) / d).toFixed(3)); });
  const saltar = (seg: number) => { if (!v.duration) return; v.currentTime = Math.min(v.duration, Math.max(0, v.currentTime + seg)); pintar(); };

  if (barra) {
    // Al arrastrar, la raya sigue al dedo al instante y el video salta como mucho ocho veces por segundo (y al soltar)
    let ultimo = 0;
    const buscar = (e: PointerEvent, ya = false) => {
      const d = v.duration; if (!d) return;
      const r = barra.getBoundingClientRect(), f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      barra.style.setProperty('--avance', f.toFixed(4));
      if (ya || e.timeStamp - ultimo > 120) { ultimo = e.timeStamp; v.currentTime = f * d; }
    };
    barra.addEventListener('pointerdown', (e) => { barra.setPointerCapture(e.pointerId); barra.classList.add('arrastra'); buscar(e, true); });
    barra.addEventListener('pointermove', (e) => { if (barra.hasPointerCapture(e.pointerId)) buscar(e); });
    barra.addEventListener('pointerup', (e) => { if (barra.classList.contains('arrastra')) { buscar(e, true); barra.classList.remove('arrastra'); } });
    barra.addEventListener('pointercancel', () => barra.classList.remove('arrastra'));
  }
  bSonido?.addEventListener('click', silenciar);
  if (vol) {
    const cajaVol = vol.parentElement!;
    // el recorrido útil deja un margen arriba y abajo (el 35 % del ancho del deslizador, igual que en los estilos)
    const nivel = (e: PointerEvent) => { const r = vol.getBoundingClientRect(), m = r.width * 0.35; return Math.min(1, Math.max(0, (r.bottom - m - e.clientY) / (r.height - 2 * m))); };
    vol.addEventListener('pointerdown', (e) => { vol.setPointerCapture(e.pointerId); cajaVol.classList.add('arrastra'); ponerSonido(nivel(e), false, false); });
    vol.addEventListener('pointermove', (e) => { if (vol.hasPointerCapture(e.pointerId)) ponerSonido(nivel(e), false, false); });
    const soltar = () => { if (!cajaVol.classList.contains('arrastra')) return; cajaVol.classList.remove('arrastra'); ponerSonido(v.volume, v.muted); };
    vol.addEventListener('pointerup', soltar); vol.addEventListener('pointercancel', soltar);
  }
  const ampliar = () => {
    if (document.fullscreenElement) { document.exitFullscreen(); return; }
    // En iPhone solo el propio video puede ir a pantalla completa
    if (marco.requestFullscreen) marco.requestFullscreen().catch(() => {}); else (v as any).webkitEnterFullscreen?.();
  };
  $('[data-v="ampliar"]', caja)?.addEventListener('click', ampliar);
  marco.addEventListener('keydown', (e) => {
    const k = e.key, enBoton = (e.target as HTMLElement).tagName === 'BUTTON';
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (k === 'k' || k === 'K' || (k === ' ' && !enBoton)) { e.preventDefault(); alternar(true); }
    else if (k === 'ArrowRight' || k === 'ArrowLeft') { e.preventDefault(); saltar(k === 'ArrowRight' ? 5 : -5); }
    else if (k === 'ArrowUp' || k === 'ArrowDown') { e.preventDefault(); ponerSonido((v.muted ? 0 : v.volume) + (k === 'ArrowUp' ? 0.1 : -0.1), false); }
    else if (k === 'm' || k === 'M') silenciar();
    else if (k === 'f' || k === 'F') ampliar();
  });
  // Un video que sale de la pantalla se detiene solo
  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { if (!e.isIntersecting && !v.paused && !document.fullscreenElement) v.pause(); }, { threshold: 0.15 }).observe(marco);
});
