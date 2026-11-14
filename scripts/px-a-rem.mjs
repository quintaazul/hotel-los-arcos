// Pasa las medidas de las hojas de estilo de píxeles a rem (1 rem = 16 px en una pantalla normal).
// Con las medidas en rem, todo el sitio puede crecer en proporción en pantallas muy grandes cambiando un solo número
// (el tamaño de letra de <html>, en sistema.css). No toca las líneas finas (menos de 4 px) ni las condiciones de @media.
// Uso: node scripts/px-a-rem.mjs   (se puede correr más de una vez: lo que ya está en rem no cambia)
import { readFileSync, writeFileSync } from 'node:fs';
const rem = (n) => String(+(n / 16).toFixed(4)).replace(/^0\./, '.').replace(/^-0\./, '-.') + 'rem';
let total = 0;
for (const f of ['sistema', 'global', 'controles', 'medios', 'movimiento']) {
  const ruta = new URL(`../src/styles/${f}.css`, import.meta.url);
  const css = readFileSync(ruta, 'utf8');
  let n = 0;
  // Se parte en trozos: las condiciones de @media/@container y la regla de <html> que usa px a propósito se dejan igual
  const sal = css.split(/(@(?:media|container)[^{]*\{|\/\*[\s\S]*?\*\/|html\{font-size:[^}]*\})/g).map((trozo, i) => {
    if (i % 2 === 1) return trozo;
    return trozo.replace(/(?<![\w.#])(\d*\.?\d+)px\b/g, (m, v) => { const x = parseFloat(v); if (x < 4) return m; n++; return rem(x); });
  }).join('');
  writeFileSync(ruta, sal);
  total += n;
  console.log(`${f}.css: ${n} medidas pasadas a rem`);
}
console.log(total + ' en total');
