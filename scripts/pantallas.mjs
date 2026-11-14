// Los tamaños en los que SIEMPRE se prueba el sitio (diseño y rendimiento), de la pantalla más grande a la más chica.
// freno: cuántas veces más lento que esta PC se simula el procesador (los celulares y tablets no son una PC de escritorio).
export const PANTALLAS = [
  { id: '4k', nombre: '4K', w: 3840, h: 2160, dpr: 1, freno: 1 },
  { id: '2k', nombre: '2K', w: 2560, h: 1440, dpr: 1, freno: 1 },
  { id: '1080p', nombre: '1080p', w: 1920, h: 1080, dpr: 1, freno: 1 },
  { id: '720p', nombre: '720p', w: 1280, h: 720, dpr: 1, freno: 2 },
  { id: 'tablet-grande', nombre: 'Tablet grande', w: 1024, h: 1366, dpr: 2, freno: 2, tactil: true },
  { id: 'tablet-chica', nombre: 'Tablet chica', w: 768, h: 1024, dpr: 2, freno: 3, tactil: true },
  { id: 'celular-grande', nombre: 'Celular grande', w: 430, h: 932, dpr: 3, freno: 3, tactil: true },
  { id: 'celular-chico', nombre: 'Celular chico', w: 360, h: 640, dpr: 3, freno: 4, tactil: true }
];
// Para elegir algunas por nombre: pantallas('2k,celular-chico'). Sin argumento, todas.
export const pantallas = (lista) => (lista ? lista.split(',').map((x) => PANTALLAS.find((p) => p.id === x.trim()) || (() => { throw new Error('Pantalla desconocida: ' + x + '. Opciones: ' + PANTALLAS.map((p) => p.id).join(', ')); })()) : PANTALLAS);
