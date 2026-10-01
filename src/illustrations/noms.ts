/**
 * Illustrations codées (HTML + CSS, sans image) propres au site : aperçus de l'espace client,
 * bilan mensuel, scores… Utilisables dans hero (split), texte-image et features.
 * Les noms sont ici (lus par les schémas) ; les composants dans index.ts.
 */
import { z } from 'astro/zod';

export const nomsIllustrations = ['pagespeed'] as const;

export const illustration = z
  .object({
    nom: z.enum(nomsIllustrations).describe('pagespeed : scores de vitesse'),
    score_mobile: z.number().int().min(0).max(100).optional().describe('Score PageSpeed mobile réellement mesuré (sinon rien n\'est affiché)'),
    score_ordinateur: z.number().int().min(0).max(100).optional(),
    date: z.string().max(20).optional().describe('Date du relevé (ex. 30/09/2026)'),
    legende: z.string().max(90).optional().describe('Ex. « Site réalisé pour MYR Énergie, mesuré avec Google PageSpeed »'),
  })
  .strict()
  .describe('Illustration codée du site : { nom, … }');
export type Illustration = z.infer<typeof illustration>;
