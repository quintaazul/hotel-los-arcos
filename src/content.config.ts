import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Artículos del blog de cada hotel (/blog). Cada archivo dice de qué hotel es: los dos sitios comparten el código,
// pero nunca un artículo ni el tema de un artículo (ver src/data/blog.ts: cada búsqueda tiene un solo dueño).
// (Hasta el 11 de noviembre de 2026 esto era la serie «Planes cerca», en /planes.)
const blog = defineCollection({
  // el id sale de la ruta (qa/… o la/…): los dos hoteles pueden tener un artículo con el mismo slug
  loader: glob({ pattern: '**/*.md', base: './src/content/blog', generateId: ({ entry }) => entry.replace(/\.md$/, '') }),
  schema: z.object({
    hotel: z.enum(['qa', 'la']),
    slug: z.string(),
    corto: z.string().max(30),                // nombre corto para las portadas chicas (inicio, pie de foto)
    titulo: z.string(),                       // el H1 del artículo: la pregunta o frase que la gente busca
    tituloSeo: z.string().max(60).optional(), // título para Google si el del artículo pasa de 60 caracteres con el nombre del hotel
    descripcion: z.string().min(120).max(155),
    tema: z.string(),                         // id de uno de los temas del hotel (src/data/blog.ts)
    busqueda: z.string(),                     // la búsqueda principal que persigue; una sola y de la lista de su hotel
    resumen: z.string(),                      // «En resumen»: la respuesta en 2 o 3 líneas
    foto: z.string(),
    fotoAlt: z.string(),
    publicado: z.coerce.date(),
    actualizado: z.coerce.date(),
    lectura: z.number(),                      // minutos
    datos: z.array(z.tuple([z.string(), z.string()])).default([]),       // datos rápidos de la portada
    preguntas: z.array(z.tuple([z.string(), z.string()])).default([]),
    vende: z.enum(['habitaciones', 'palapa', 'departamentos', 'empresas', 'ubicacion']),   // la página que vende: sale en la caja «Hospédate cerca»
    destacado: z.boolean().default(false),    // el que abre la página del blog
    esencial: z.boolean().default(false),     // guía fija que se mantiene al día
    verificado: z.coerce.date().optional(),   // fecha en que se comprobaron los precios y horarios que cita
    fuentes: z.array(z.tuple([z.string(), z.string()])).default([]),     // de dónde salen esos datos: nombre y enlace
    // Opcionales: un video del hotel (por su id) y fotos que se abren en el visor
    video: z.string().optional(),
    galeria: z.array(z.tuple([z.string(), z.string()])).default([])
  })
});

export const collections = { blog };
