// El óvalo dibujado a mano que rodea una frase de un título.
//
// El trazo es una elipse algo irregular, como hecha con pluma: arranca abajo a la izquierda, da la vuelta y cierra con
// una cola que pasa por FUERA del arranque (la doble línea de arriba a la izquierda).
//
// Dónde va: la frase queda alineada con su párrafo (antes se corría a la derecha para hacerle sitio al óvalo) y el
// óvalo se centra en la frase, sobresaliendo a los dos lados. El guion de Base.astro lo dibuja con las medidas
// reales de cada frase en cuanto carga la página: lo ensancha lo justo para que ninguna letra toque el trazo y, si
// no hay sitio a los lados (celular, frase larga), le llena un poco los hombros. Lo de aquí es solo el dibujo que
// queda puesto al compilar, con medidas aproximadas, por si el guion tardara.

/** Puntos del trazo sobre una elipse de radio 1 centrada en 0: arranque, cuatro tramos de curva y la cola. */
export const TRAZO: [number, number][] = [[-0.936, 0.256], [-1.004, -0.395], [-0.468, -1], [0.085, -1], [0.681, -0.977], [1.032, -0.465], [0.989, 0.116], [0.936, 0.767], [0.426, 1.023], [-0.064, 0.988], [-0.596, 0.953], [-1.032, 0.674], [-0.979, -0.023], [-0.936, -0.488], [-0.638, -0.79], [-0.298, -0.895]];

/** Ancho aproximado de una frase en la serif de títulos, en em. */
export const anchoFrase = (t: string) => [...t].reduce((s, ch) => s + (ch === ' ' ? 0.24 : 'iíjlt.,;:!¡\'I'.includes(ch) ? 0.3 : 'mwMW'.includes(ch) ? 0.8 : /[A-ZÁÉÍÓÚÑ]/.test(ch) ? 0.66 : 0.5), 0);

/** Trazo aproximado para una frase, en el cuadro de 1 × 1 de la propia frase (se sale de él a propósito). */
export function trazoOvalo(frase: string): string {
  const W = Math.max(1, anchoFrase(frase)), a = 0.5 + 0.06 + 0.3 / W;   // medio ancho del óvalo, en anchos de frase
  const cy = 0.453, b = 0.603;                                           // centro y medio alto, en altos de la caja (1.16em)
  const p = ([x, y]: [number, number]) => `${+(0.5 + a * x).toFixed(3)} ${+(cy + b * y).toFixed(3)}`;
  let d = 'M ' + p(TRAZO[0]);
  for (let i = 1; i < TRAZO.length; i += 3) d += ` C ${p(TRAZO[i])} ${p(TRAZO[i + 1])} ${p(TRAZO[i + 2])}`;
  return d;
}
