import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    // z.coerce.date() transforma texto "2023-01-01" en Objeto Fecha automáticamente
    date: z.coerce.date(),
    description: z.string().optional(),
    image: z.string().optional(),
    categories: z.array(z.string()).optional(),
  }),
});

export const collections = { blog };
