// Escribe el estándar visual de cada hotel en docs/, a partir de las mismas fuentes que usa el sitio:
// la paleta (src/data/paleta.json), las medidas (src/styles/sistema.css) y las reglas (src/data/estandar.json).
// Uso: node scripts/estandar.mjs   (correr después de cambiar la paleta o el sistema)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const lee = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const paleta = JSON.parse(lee('src/data/paleta.json')), E = JSON.parse(lee('src/data/estandar.json'));
const css = lee('src/styles/sistema.css');
const V = Object.fromEntries([...css.matchAll(/(--[\w-]+):([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
const val = (t) => (V[t] || '').replace(/var\((--[\w-]+)\)/g, (m, n) => V[n] || m);
const tabla = (cab, filas) => `| ${cab.join(' | ')} |\n| ${cab.map(() => '---').join(' | ')} |\n` + filas.map((f) => `| ${f.join(' | ')} |`).join('\n') + '\n';
const PASOS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const NOMBRE = { qa: 'QUINTA-AZUL', la: 'LOS-ARCOS' };
mkdirSync(new URL('../docs/', import.meta.url), { recursive: true });

for (const id of ['qa', 'la']) {
  const p = paleta[id], I = E.identidad[id];
  let d = `# Estándar visual · ${p.nombre}\n\n`;
  d += `Este documento es el estándar de **${p.nombre}**. El otro hotel tiene el suyo: comparten las medidas y los controles, pero cada uno tiene su color y su carácter, y pueden cambiar por separado.\n\n`;
  d += `- **Se ve en vivo:** página \`/estandar\` del sitio (no aparece en buscadores).\n- **Se genera solo:** \`node scripts/estandar.mjs\`. No se edita a mano.\n- **Dónde vive cada cosa:**\n`;
  d += `  - Color de este hotel: \`src/styles/marca-${id}.css\`, generado por \`scripts/paleta.mjs\`.\n  - Medidas, letra y movimiento: \`src/styles/sistema.css\` y \`src/scripts/ritmo.ts\`.\n  - Controles: \`src/styles/controles.css\`, \`src/scripts/controles.ts\` y \`src/components/controles/\`.\n\n`;
  d += `## 0. Identidad\n\n- **Carácter:** ${I.caracter}\n- **Voz:** ${I.voz}\n- **Motivos que se repiten:**\n${I.motivos.map((m) => `  - ${m}`).join('\n')}\n- **Letra:** Poppins para títulos y texto; DM Serif Display para la frase del óvalo, cifras y nombres.\n\n`;

  d += `## 1. Controles\n\nRegla: nada usa el menú, el calendario ni los avisos del navegador. Todos los controles son propios y se ven igual en cualquier navegador. En celular, lo que flota sube como una hoja desde abajo.\n\n`;
  d += tabla(['Pieza', 'Componente', 'Cómo se comporta'], E.controles) + '\n';
  d += `**Estados de un campo**\n\n` + tabla(['Estado', 'Cómo se ve'], E.estados) + '\n';
  d += `**Medidas**\n\n` + tabla(['Variable', 'Valor', 'Uso'], E.alturas.map(([t, u]) => ['`' + t + '`', val(t), u])) + '\n';
  d += `**Accesibilidad**\n\n- Todo se puede usar con teclado: Tab, flechas, Enter, Esc.\n- El foco siempre se ve y vuelve al botón que abrió la ventana.\n- Cada campo tiene su etiqueta visible; el error se anuncia al lector de pantalla.\n- Debajo del desplegable hay un \`<select>\` real: si el JavaScript no carga, el formulario sigue funcionando.\n\n`;

  d += `## 2. Color\n\nLa paleta tiene dos capas. Los componentes solo usan la segunda.\n\n1. **Colores:** ${Object.keys(p.familias).length} familias de 11 tonos (del 50, el más claro, al 950, el más oscuro). Están hechas en OKLCH: un mismo número pesa igual en todas las familias.\n2. **Papeles:** nombres por función (\`--c-fondo\`, \`--c-texto\`, \`--c-accion\`…). Si mañana cambia el color de marca, se cambia el papel y todo el sitio lo sigue.\n\n`;
  d += `### 2.1 Familias\n\n`;
  for (const [fam, f] of Object.entries(p.familias)) d += `**${fam}** · ${f.papel}. ${f.nota}\n\n` + tabla(PASOS.map(String), [PASOS.map((s) => '`' + f.pasos[s] + '`')]) + '\n';
  d += `### 2.2 Papeles\n\n` + tabla(['Papel', 'Viene de', 'Color'], Object.entries(p.roles).map(([k, r]) => ['`--c-' + k + '`', r.de, '`' + r.hex + '`'])) + '\n';
  d += `### 2.3 Parejas comprobadas\n\nContraste según WCAG. Texto normal pide 4.5; piezas grandes y bordes de control, 3.\n\n` + tabla(['Texto', 'Fondo', 'Contraste', 'Mínimo', '¿Pasa?'], p.parejas.map((x) => [x.texto, x.fondo, x.razon + ' : 1', x.minimo, x.pasa ? 'Sí' : 'No'])) + '\n';
  d += `### 2.4 Cómo se reparte\n\n- **60 % neutros:** fondos \`${p.neutro}\` claros y texto \`${p.neutro}\` oscuro.\n- **30 % marca:** \`${p.primario}\` en secciones de marca, botones y enlaces.\n- **10 % acento:** \`${p.acento}\` solo en estrellas y realces chicos; \`${p.secundario}\` para detalles.\n- Rojo, ámbar y verde se reservan para estados (error, aviso, correcto).\n- Sobre foto, el texto va en blanco con una sombra del color \`--c-noche\`.\n\n`;

  d += `## 3. Movimiento\n\n${E.movimiento.map((m) => `- ${m}`).join('\n')}\n\n`;
  d += `**Tiempos**\n\n` + tabla(['Variable', 'Valor', 'Uso'], E.tiempos.map(([t, u]) => ['`' + t + '`', val(t), u])) + '\n';
  d += `**Curvas**\n\n` + tabla(['Variable', 'Valor', 'Uso'], E.curvas.map(([t, u]) => ['`' + t + '`', '`' + val(t) + '`', u])) + '\n';
  d += `**Distancias y ritmo**\n\n` + tabla(['Variable', 'Valor', 'Uso'], [['`--mov-s`', val('--mov-s'), 'Ventanas flotantes'], ['`--mov-m`', val('--mov-m'), 'Carga de la portada'], ['`--mov-l`', val('--mov-l'), 'Contenido que aparece al bajar'], ['`--paso`', val('--paso'), 'Retraso entre piezas hermanas']]) + '\n';
  d += `Las animaciones viven en \`src/styles/movimiento.css\`. El poco código que necesita esperar a que terminen toma los mismos tiempos de \`src/scripts/ritmo.ts\` (\`D\` duraciones, \`MOV\` distancias, \`PASO\`).\n\n`;

  d += `## 4. Espacios, tamaños y letra\n\n### 4.1 Escala de espacios\n\nBase de 4 px. El número de la variable es «cuántos cuartos de 16»: \`--e-4\` son 16 px.\n\n` + tabla(['Variable', 'Valor', 'Uso típico'], E.espacios.map(([t, u]) => ['`' + t + '`', val(t), u])) + '\n';
  d += `### 4.2 Espacios de página\n\nCrecen con la pantalla.\n\n` + tabla(['Variable', 'Valor', 'Uso'], E.pagina.map(([t, u]) => ['`' + t + '`', '`' + val(t) + '`', u])) + '\n';
  d += `Rejilla de 12 columnas, ancho máximo de ${val('--ancho')} y párrafos de ${val('--medida')} como máximo.\n\n`;
  d += `### 4.3 Letra\n\n` + tabla(['Variable', 'Tamaño', 'Uso'], E.letra.map(([t, u]) => ['`' + t + '`', '`' + val(t) + '`', u])) + '\n';
  d += `- Pesos: ${val('--p-normal')} normal, ${val('--p-medio')} medio, ${val('--p-fuerte')} fuerte.\n- Interlineado: ${val('--i-apretado')} títulos grandes, ${val('--i-titulo')} títulos, ${val('--i-ui')} controles, ${val('--i-cuerpo')} párrafos.\n\n`;
  d += `### 4.4 Formas, sombras y capas\n\n` + tabla(['Variable', 'Valor', 'Uso'], [...E.radios, ...E.sombras].map(([t, u]) => ['`' + t + '`', '`' + val(t) + '`', u])) + '\n';
  d += `### 4.5 Tamaños de pantalla\n\n` + tabla(['Ancho', 'Qué cambia'], E.cortes) + '\n';

  const M = E.medios, sinCodigo = (t) => t;
  d += `## 5. Fotos y video\n\nRegla: como los controles, las fotos y los videos se ven y se usan con piezas propias. El material original no vive en el proyecto; \`scripts/material.mjs\` lo prepara y deja escrito qué archivo salió de cuál.\n\n### 5.1 Fotos\n\n` + tabla(['Tema', 'Regla'], M.fotos.map(([a, b]) => [a, sinCodigo(b)])) + '\n';
  d += `### 5.2 Video\n\n` + tabla(['Tema', 'Regla'], M.video.map(([a, b]) => [a, sinCodigo(b)])) + '\n';
  d += `### 5.3 Piezas\n\n` + tabla(['Pieza', 'Archivo', 'Qué hace'], M.piezas.map(([a, b, c]) => [a, '`' + b + '`', c])) + '\n';

  const P = E.rendimiento;
  d += `## 6. Pantallas de prueba\n\nTodo cambio de diseño o de rendimiento se prueba en estas ocho. La lista vive en \`scripts/pantallas.mjs\` y la usan todas las herramientas.\n\n` + tabla(['Pantalla', 'Tamaño', 'Qué cambia'], E.pantallas) + '\n';
  d += `## 7. Rendimiento\n\nEl sitio debe sentirse inmediato, no solo cargar rápido. Estas son las metas y cómo se miden.\n\n### 7.1 Metas\n\n` + tabla(['Qué se mide', 'Meta', 'Para qué'], P.metas) + '\n';
  d += `### 7.2 Herramientas\n\n` + tabla(['Comando', 'Qué hace'], P.herramientas.map(([c, q]) => ['`' + c + '`', q])) + '\n';
  d += `### 7.3 Trampas ya resueltas\n\n${P.trampas.map((t) => `- ${t}`).join('\n')}\n\n`;

  d += `## 8. Reglas que no se rompen\n\n${E.reglas.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\n`;
  d += `## Cómo cambiar algo\n\n- **Un color de este hotel:** edita su bloque en \`scripts/paleta.mjs\` y corre \`npm run paleta\`. Si una pareja queda por debajo del contraste mínimo, el comando falla y dice cuál.\n- **Un espacio, tamaño o tiempo:** cambia la variable en \`src/styles/sistema.css\` (y su espejo en \`src/scripts/ritmo.ts\` si es de movimiento).\n- **Una foto o un video:** cambia su renglón en \`scripts/material.mjs\` y corre \`node scripts/material.mjs\`. El estilo está en \`src/styles/medios.css\` y el comportamiento en \`src/scripts/medios.ts\`.\n- **Después de cualquier cambio:** \`node scripts/estandar.mjs\` vuelve a escribir este documento.\n`;
  writeFileSync(new URL(`../docs/ESTANDAR-${NOMBRE[id]}.md`, import.meta.url), d);
  console.log(`docs/ESTANDAR-${NOMBRE[id]}.md`, Math.round(d.length / 1024) + ' KB');
}
