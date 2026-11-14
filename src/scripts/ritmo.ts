// Estándar de movimiento para JavaScript. Es el espejo de las variables --d-* de sistema.css.
// Regla: ningún código escribe un tiempo o una distancia sueltos; los toma de aquí.
// Las animaciones viven en CSS (movimiento.css); esto solo lo usa el poco código que necesita esperar a que terminen.

/** Duraciones en segundos */
export const D = {
  instante: 0.1,   // respuesta al presionar
  rapido: 0.16,    // hover, cambios de color
  ui: 0.24,        // menús y ventanas flotantes
  medio: 0.36,     // fundidos
  lento: 0.52,     // hojas y cajones
  entrada: 0.6,    // contenido que aparece
  escena: 0.8,     // títulos, óvalos y cortinas entre fotos
  revela: 1.0,     // fotos que se descubren
  ambiente: 1.3    // foto que se asienta, cifras que cuentan
} as const;

/** Distancias en px y retraso entre piezas hermanas en segundos */
export const MOV = { s: 8, m: 18, l: 28 } as const;
export const PASO = 0.06;
