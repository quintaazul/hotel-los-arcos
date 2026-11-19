// El blog de cada hotel: su título, sus temas, su autor y las cajas que llevan a las páginas que venden.
// Regla del plan SEO (documento del 10 de noviembre de 2026): cada búsqueda tiene un solo dueño. Quinta Azul escribe
// de qué hacer en García, de fiestas en su palapa y de escapadas; Los Arcos, de las Grutas y sus alrededores, de
// reuniones en familia y de estancias largas. Un artículo nunca persigue una búsqueda del otro hotel.
import { getCollection, type CollectionEntry } from 'astro:content';
import { H, waLink } from './hoteles';
import { TIPOS, DESDE_IVA } from './textos';

export type Art = CollectionEntry<'blog'>;
// meta: la descripción para buscadores de la página del tema (propia, de 120 a 155 caracteres)
export type Tema = { id: string; nombre: string; texto: string; meta: string };
type Caja = { titulo: string; texto: string; enlace: string; corto?: string; href: string; wa: string };

const QA = {
  // «Qué hacer en García» es la búsqueda de un artículo (/blog/que-hacer-en-garcia): ni el título del blog ni el
  // nombre de un tema la usan, para no competir con él.
  titulo: 'Guías para tu visita a García, N.L.',
  seo: 'Guías de García, N.L. | Hotel Quinta Azul',
  descripcion: 'Guías del equipo del Hotel Quinta Azul: qué hacer en García, cómo organizar tu fiesta en la palapa y escapadas de fin de semana cerca de Monterrey.',
  entrada: 'Planes en García, ideas para tu fiesta en la palapa y escapadas de fin de semana, contadas por quienes te reciben en el hotel.',
  temas: [
    { id: 'planes-en-garcia', nombre: 'Planes en García', texto: 'Planes a pocos minutos del hotel, para armar el día sin manejar de más.', meta: 'Planes a pocos minutos del Hotel Quinta Azul, en García, N.L.: qué visitar, cuánto se hace en auto y cómo armar el día sin manejar de más.' },
    { id: 'fiestas-en-la-palapa', nombre: 'Fiestas en la palapa', texto: 'Cómo organizar tu fiesta junto a la alberca: qué hay, qué llevar y cómo apartar.', meta: 'Cómo organizar una fiesta en la palapa del Hotel Quinta Azul, en García, N.L.: qué hay, qué llevar, cómo apartar y dónde se quedan tus invitados.' },
    { id: 'escapadas', nombre: 'Escapadas desde Monterrey', texto: 'Fines de semana con alberca a media hora de Monterrey.', meta: 'Ideas para un fin de semana con alberca en García, N.L., cerca de Monterrey: qué hacer, qué llevar y dónde quedarte, por el Hotel Quinta Azul.' },
  ] as Tema[],
  cierre: { titulo: 'Reserva directo o cotiza la palapa', texto: 'Te respondemos por WhatsApp de 7 AM a 11 PM.', enlace: 'Palapa con alberca en García', corto: 'Palapa con alberca', href: '/celebraciones' },
};
const LA = {
  titulo: 'Guías para visitar las Grutas de García y sus alrededores',
  seo: 'Guía de las Grutas de García | Hotel Los Arcos Inn',
  descripcion: 'Guías del equipo del Hotel Los Arcos Inn para visitar las Grutas de García, Xenpal y sus alrededores, y para hospedar a la familia por días o semanas.',
  entrada: 'Las Grutas y lo que hay alrededor, dónde se queda la familia y estancias de semanas, explicado por el equipo que te recibe en el hotel.',
  temas: [
    { id: 'grutas-y-alrededores', nombre: 'Grutas y alrededores', texto: 'Las Grutas de García y los paseos que quedan sobre el mismo camino.', meta: 'Guías de Hotel Los Arcos Inn para las Grutas de García y lo que hay sobre el mismo camino: horarios, precios, paseos con niños y cómo llegar.' },
    { id: 'reuniones-en-familia', nombre: 'Reuniones en familia', texto: 'Dónde se queda la familia cuando viene a una fiesta o de visita a García.', meta: 'Dónde hospedar a la familia que viene a una fiesta o de visita a García, N.L.: habitaciones y departamentos del Hotel Los Arcos Inn, en el centro.' },
    { id: 'estancias-largas', nombre: 'Estancias largas', texto: 'Departamentos con cocina para quedarse semanas o meses en García.', meta: 'Cuándo conviene un departamento con cocina en García, N.L., para quedarse varios días o semanas, explicado por el equipo del Hotel Los Arcos Inn.' },
  ] as Tema[],
  cierre: { titulo: 'Aparta tu estancia', texto: 'Te respondemos por WhatsApp de 7 AM a 11 PM.', enlace: 'Departamentos para una semana o más', corto: 'Departamentos', href: '/departamentos' },
};
export const BLOG = H.id === 'qa' ? QA : LA;
// Quien firma. Mientras no haya nombre, foto y puesto de una persona del hotel, firma el equipo (no se inventa a nadie).
export const AUTOR = { nombre: 'Equipo del ' + H.nombre, puesto: 'Recepción y atención a huéspedes, en García, N.L.', foto: H.id === 'qa' ? 'simbolo-blanco.png' : 'arcos-blanco.png' };

// La caja «Hospédate cerca» de cada artículo: lleva a la página que vende lo que el artículo cuenta.
export const CAJAS: Record<Art['data']['vende'], Caja> = {
  habitaciones: { titulo: 'Hospédate cerca', texto: H.id === 'qa' ? 'Habitaciones para 1 a 4 personas desde ' + DESDE_IVA + ' la noche, con alberca hasta las 10 PM y estacionamiento, en el centro de García.' : 'Habitaciones desde ' + DESDE_IVA + ' la noche, con alberca, jardín y estacionamiento, en el centro de García.',
    enlace: H.id === 'qa' ? 'Ver habitaciones desde ' + DESDE_IVA : 'Habitaciones ' + TIPOS, corto: H.id === 'qa' ? 'Ver habitaciones' : 'Ver habitaciones', href: '/' + H.rutaHabs, wa: 'quiero reservar una habitación' },
  palapa: { titulo: H.id === 'qa' ? 'Haz tu reunión aquí' : 'La palapa, para los huéspedes', texto: H.id === 'qa' ? 'Palapa con asador para hasta 30 personas, junto a la alberca. Tus invitados pueden quedarse a dormir en el mismo hotel.' : 'Palapa techada con asador, parrilla de gas y televisión, en el jardín. Es solo para quienes se hospedan en el hotel.',
    enlace: H.id === 'qa' ? 'Palapa con alberca en García' : 'Palapa techada para huéspedes', corto: H.id === 'qa' ? 'Palapa con alberca' : 'La palapa techada', href: '/' + H.rutaPalapa, wa: H.id === 'qa' ? 'quiero cotizar la palapa' : 'quiero reservar' },
  departamentos: { titulo: 'Quédate el tiempo que haga falta', texto: 'Departamentos con cocina, sala y dos recámaras dentro del hotel, para una noche o para varias semanas.',
    enlace: 'Departamentos para una semana o más', corto: 'Departamentos', href: '/departamentos', wa: 'quiero cotizar un departamento' },
  empresas: { titulo: 'Hospeda a tu equipo', texto: 'Habitaciones por noche y departamentos para estancias largas, con estacionamiento privado, WiFi y factura.',
    enlace: 'Hospedaje para empresas con factura', corto: 'Hospedaje para empresas', href: '/empresas', wa: 'quiero cotizar hospedaje para mi empresa' },
  ubicacion: { titulo: 'Hospédate cerca', texto: H.id === 'qa' ? 'Estamos en el centro de García, a media hora de Monterrey: llegas, estacionas adentro y la alberca te espera.' : 'Estamos en el centro de García, a 15 minutos de las Grutas, con jardín, alberca y estacionamiento privado.',
    enlace: H.id === 'qa' ? 'Cómo llegar desde Monterrey' : 'Cómo llegar al hotel', corto: 'Cómo llegar', href: '/ubicacion', wa: 'quiero reservar' },
};

export const POR_PAGINA = 9;
export const tema = (id: string): Tema => BLOG.temas.find((t) => t.id === id) ?? { id, nombre: id, texto: '', meta: '' };
// Un tema con menos de tres artículos es una página delgada: se queda fuera de los buscadores (noindex, follow) y
// del mapa del sitio hasta que los tenga (astro.config.mjs aplica la misma regla al mapa).
export const TEMA_MINIMO = 3;
export const urlArt = (a: Art) => '/blog/' + a.data.slug;
export const urlTema = (id: string) => '/blog/tema/' + id;
export const waArt = (a: Art) => waLink('Hola, vengo del artículo «' + a.data.titulo + '» y ' + CAJAS[a.data.vende].wa + ' en el ' + H.nombre);
export const fecha = (x: Date) => x.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
export const fechaCorta = (x: Date) => x.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).replace(/\./g, '');
export const iso = (x: Date) => x.toISOString().slice(0, 10);

// Todos los artículos del hotel, del más nuevo al más viejo (a igual fecha, primero el destacado y luego las guías fijas).
export async function articulos(): Promise<Art[]> {
  const peso = (a: Art) => (a.data.destacado ? 2 : 0) + (a.data.esencial ? 1 : 0);
  return (await getCollection('blog', (e) => e.data.hotel === H.id)).sort((a, b) => +b.data.publicado - +a.data.publicado || peso(b) - peso(a) || a.data.slug.localeCompare(b.data.slug));
}
// Los más cercanos a un artículo: primero los de su tema, luego los demás por fecha.
export const relacionados = (todos: Art[], a: Art, n = 3) => [...todos.filter((x) => x.id !== a.id && x.data.tema === a.data.tema), ...todos.filter((x) => x.id !== a.id && x.data.tema !== a.data.tema)].slice(0, n);
