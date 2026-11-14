// La carpeta del proyecto, con diagonales normales y una al final (por ejemplo «C:/proyectos/hoteles/»).
// Los guiones la usan en vez de escribir la ruta de un equipo en particular.
import { fileURLToPath } from 'node:url';
export const RAIZ = fileURLToPath(new URL('..', import.meta.url)).replace(/\\/g, '/').replace(/\/?$/, '/');
