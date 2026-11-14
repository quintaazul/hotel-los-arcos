// Genera la paleta completa de cada hotel (rampas en OKLCH, parejas con contraste comprobado).
// Uso: node scripts/paleta.mjs   → escribe src/styles/marca-qa.css, src/styles/marca-la.css y src/data/paleta.json
// La paleta de cada hotel es independiente: se cambia en MARCAS y se vuelve a generar.
import { writeFileSync } from 'node:fs';
import { oklch, formatHex, clampChroma, wcagContrast } from 'culori';

const PASOS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
// Claridad percibida de cada paso (igual para todas las familias: un 600 siempre «pesa» lo mismo)
const L = { 50: 0.975, 100: 0.945, 200: 0.895, 300: 0.82, 400: 0.73, 500: 0.635, 600: 0.54, 700: 0.455, 800: 0.375, 900: 0.3, 950: 0.225 };
// Cuánta viveza lleva cada paso respecto al punto más vivo de la familia
const VIVEZA = { 50: 0.14, 100: 0.26, 200: 0.46, 300: 0.7, 400: 0.9, 500: 1, 600: 1, 700: 0.94, 800: 0.82, 900: 0.66, 950: 0.5 };

const hex = (l, c, h) => formatHex(clampChroma({ mode: 'oklch', l, c, h }, 'oklch'));
const rampa = (h, cMax, fijos = {}) => Object.fromEntries(PASOS.map((p) => [p, (fijos[p] || hex(L[p], cMax * VIVEZA[p], h)).toUpperCase()]));
const neutros = (ls, cs, hs) => Object.fromEntries(PASOS.map((p, i) => [p, hex(ls[i], cs[i], hs[i]).toUpperCase()]));
const deMarca = (color) => { const o = oklch(color); return { h: o.h, c: o.c, l: o.l }; };

const azul = deMarca('#3B4E9C'), naranja = deMarca('#EA6C00');   // el naranja de marca de Los Arcos (antes se usaba #E3791C, tomado del sitio viejo)

const MARCAS = {
  qa: {
    nombre: 'Hotel Quinta Azul',
    familias: {
      azul: { papel: 'Primario', nota: 'El azul de la fachada y del logo. Acciones, enlaces y secciones de marca.', pasos: rampa(azul.h, azul.c / VIVEZA[700], { 700: '#3B4E9C' }) },
      agua: { papel: 'Secundario', nota: 'El turquesa de la alberca. Detalles frescos e ilustraciones.', pasos: rampa(218, 0.115) },
      sol: { papel: 'Acento', nota: 'Dorado de atardecer. Estrellas y realces pequeños, nunca fondos grandes.', pasos: rampa(78, 0.155) },
      arena: { papel: 'Neutros', nota: 'De arena cálida (fondos) a tinta azul noche (textos).', pasos: neutros(
        [0.972, 0.94, 0.895, 0.83, 0.72, 0.6, 0.5, 0.405, 0.325, 0.255, 0.205],
        [0.008, 0.013, 0.016, 0.016, 0.012, 0.01, 0.014, 0.024, 0.03, 0.034, 0.036],
        [85, 85, 85, 82, 60, 20, 330, 296, 288, 284, 282]) },
      exito: { papel: 'Estado: correcto', nota: 'Confirmaciones.', pasos: rampa(152, 0.14) },
      aviso: { papel: 'Estado: atención', nota: 'Avisos que no bloquean.', pasos: rampa(72, 0.15) },
      error: { papel: 'Estado: error', nota: 'Campos mal llenados y fallas.', pasos: rampa(27, 0.19) },
      info: { papel: 'Estado: información', nota: 'Notas neutras.', pasos: rampa(245, 0.12) }
    },
    primario: 'azul', secundario: 'agua', acento: 'sol', neutro: 'arena',
    noche: '12 11 24',
    roles: {
      marca: ['azul', 700], accion: ['azul', 700], 'accion-hover': ['azul', 800], 'accion-activa': ['azul', 900],
      'texto-marca': ['azul', 700], 'marca-hondo': ['azul', 900], 'marca-suave': ['azul', 100], 'marca-suave-2': ['azul', 200], foco: ['azul', 600]
    },
    serie: { fondo: ['arena', 50], tinta: ['arena', 950], linea: 'transparent', tapa: ['arena', 200], pill: ['azul', 700], 'pill-tinta': '#FFFFFF' }
  },
  la: {
    nombre: 'Hotel Los Arcos Inn',
    familias: {
      terracota: { papel: 'Primario', nota: 'El naranja de la marca. El 500 es el color exacto (#EA6C00): es el de los botones, con texto blanco encima (decisión del dueño: da 3.2 a 1, por debajo de lo que pedimos al resto del texto). El texto de color usa el 700.', pasos: rampa(naranja.h, naranja.c / VIVEZA[500] * 0.98, { 500: '#EA6C00' }) },
      jardin: { papel: 'Secundario', nota: 'El verde de las palmas y el jardín. Detalles naturales.', pasos: rampa(148, 0.11) },
      miel: { papel: 'Acento', nota: 'Dorado cálido. Estrellas y realces pequeños.', pasos: rampa(82, 0.15) },
      adobe: { papel: 'Neutros', nota: 'De crema (fondos) a café tostado (textos).', pasos: neutros(
        [0.972, 0.94, 0.895, 0.83, 0.72, 0.6, 0.5, 0.41, 0.33, 0.26, 0.21],
        [0.008, 0.016, 0.02, 0.022, 0.022, 0.022, 0.024, 0.026, 0.026, 0.024, 0.02],
        [78, 76, 74, 72, 68, 64, 60, 58, 56, 55, 55]) },
      exito: { papel: 'Estado: correcto', nota: 'Confirmaciones.', pasos: rampa(150, 0.13) },
      aviso: { papel: 'Estado: atención', nota: 'Avisos que no bloquean.', pasos: rampa(88, 0.14) },
      error: { papel: 'Estado: error', nota: 'Campos mal llenados y fallas.', pasos: rampa(25, 0.19) },
      info: { papel: 'Estado: información', nota: 'Notas neutras.', pasos: rampa(240, 0.11) }
    },
    primario: 'terracota', secundario: 'jardin', acento: 'miel', neutro: 'adobe',
    // Blanco sobre el naranja de marca: lo pidió el dueño el 10 de noviembre de 2026 (con café oscuro «se ve feo»).
    minimos: { 'sobre-accion|accion': 3 },
    noche: '24 16 10',
    roles: {
      marca: ['terracota', 500], accion: ['terracota', 500], 'accion-hover': ['terracota', 600], 'accion-activa': ['terracota', 700],
      'texto-marca': ['terracota', 700], 'marca-hondo': ['terracota', 900], 'marca-suave': ['terracota', 100], 'marca-suave-2': ['terracota', 200], foco: ['terracota', 600]
    },
    serie: { fondo: ['adobe', 50], tinta: ['adobe', 950], linea: 'transparent', tapa: ['adobe', 200], pill: ['terracota', 600], 'pill-tinta': '#FFFFFF' }
  }
};

// Papeles que comparten los dos hoteles: mismo nombre, distinto color.
const comunes = (m) => ({
  fondo: [m.neutro, 50], 'fondo-2': [m.neutro, 100], 'fondo-3': [m.neutro, 200], superficie: '#FFFFFF',
  'fondo-oscuro': [m.neutro, 950], 'fondo-oscuro-2': [m.neutro, 900],
  texto: [m.neutro, 950], 'texto-2': [m.neutro, 700], 'texto-3': [m.neutro, 600], 'texto-apagado': [m.neutro, 500],
  borde: [m.neutro, 200], 'borde-fuerte': [m.neutro, 300], 'borde-control': [m.neutro, 500],
  blanco: '#FFFFFF', 'sobre-accion': '#FFFFFF', 'sobre-oscuro': [m.neutro, 50], 'sobre-oscuro-2': [m.neutro, 300],
  ...m.roles,
  secundario: [m.secundario, 600], 'secundario-suave': [m.secundario, 100],
  acento: [m.acento, 500], estrella: [m.acento, 400],
  ...Object.fromEntries(['exito', 'aviso', 'error', 'info'].flatMap((e) => [[e, [e, 600]], [e + '-texto', [e, 700]], [e + '-fondo', [e, 50]], [e + '-borde', [e, 300]]]))
});

const valor = (m, v) => (Array.isArray(v) ? m.familias[v[0]].pasos[v[1]] : v);
const ref = (v) => (Array.isArray(v) ? `var(--${v[0]}-${v[1]})` : v);
// Parejas texto/fondo que se usan de verdad: todas deben pasar su mínimo (4.5 texto, 3 piezas grandes o no textuales)
const PAREJAS = [
  ['texto', 'fondo', 4.5], ['texto', 'fondo-2', 4.5], ['texto', 'superficie', 4.5], ['texto-2', 'fondo', 4.5], ['texto-2', 'fondo-2', 4.5], ['texto-2', 'superficie', 4.5],
  ['texto-3', 'superficie', 4.5], ['texto-3', 'fondo', 4.5], ['texto-marca', 'fondo', 4.5], ['texto-marca', 'superficie', 4.5], ['texto-marca', 'marca-suave', 4.5],
  ['sobre-accion', 'accion', 4.5], ['sobre-accion', 'accion-hover', 4.5], ['blanco', 'marca-hondo', 4.5], ['blanco', 'fondo-oscuro', 4.5],
  ['borde-control', 'superficie', 3], ['foco', 'fondo', 3], ['foco', 'superficie', 3],
  ['exito-texto', 'exito-fondo', 4.5], ['aviso-texto', 'aviso-fondo', 4.5], ['error-texto', 'error-fondo', 4.5], ['info-texto', 'info-fondo', 4.5], ['error-texto', 'superficie', 4.5]
];

const salida = {}; let fallas = 0;
for (const [id, m] of Object.entries(MARCAS)) {
  const roles = comunes(m);
  let css = `/* Paleta de ${m.nombre}. Generada por scripts/paleta.mjs: no se edita a mano.\n   Capa 1 = colores (rampas 50–950). Capa 2 = papeles (--c-*), que es lo único que usan los componentes. */\n:root[data-hotel="${id}"]{\n`;
  for (const [fam, f] of Object.entries(m.familias)) css += `  /* ${fam}: ${f.papel} */\n  ` + PASOS.map((p) => `--${fam}-${p}:${f.pasos[p]};`).join(' ') + '\n';
  css += `  /* Papeles */\n  --c-noche:${m.noche};\n` + Object.entries(roles).map(([k, v]) => `  --c-${k}:${ref(v)};`).join('\n') + '\n';
  css += `  --c-velo:rgb(var(--c-noche) / .46); --c-seleccion:var(--c-marca-suave-2);\n`;
  css += `  /* Piezas con color propio */\n` + Object.entries(m.serie).map(([k, v]) => `  --serie-${k}:${ref(v)};`).join('\n') + '\n}\n';
  writeFileSync(new URL(`../src/styles/marca-${id}.css`, import.meta.url), css);
  const parejas = PAREJAS.map(([a, b, m0]) => { const min = m.minimos?.[a + '|' + b] ?? m0; const r = wcagContrast(valor(m, roles[a]), valor(m, roles[b])); if (r < min) { fallas++; console.log(`  ✗ ${id}: ${a} sobre ${b} = ${r.toFixed(2)} (mínimo ${min})`); } return { texto: a, fondo: b, razon: +r.toFixed(2), minimo: min, pasa: r >= min }; });
  salida[id] = {
    nombre: m.nombre, primario: m.primario, secundario: m.secundario, acento: m.acento, neutro: m.neutro,
    familias: Object.fromEntries(Object.entries(m.familias).map(([k, f]) => [k, { papel: f.papel, nota: f.nota, pasos: f.pasos }])),
    roles: Object.fromEntries(Object.entries(roles).map(([k, v]) => [k, { de: Array.isArray(v) ? v.join('-') : v, hex: valor(m, v) }])),
    parejas
  };
  console.log(`${m.nombre}: ${Object.keys(m.familias).length} familias × ${PASOS.length} pasos, ${Object.keys(roles).length} papeles, ${parejas.filter((p) => p.pasa).length}/${parejas.length} parejas pasan`);
}
writeFileSync(new URL('../src/data/paleta.json', import.meta.url), JSON.stringify(salida, null, 1));
if (fallas) { console.log(`Hay ${fallas} parejas por debajo del mínimo.`); process.exit(1); }
