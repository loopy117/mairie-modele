import { z } from 'astro/zod';

/**
 * Alerte de la commune (data/alerte.json) : bandeau en tête de toutes les pages (coupure d'eau, vigilance météo,
 * route fermée…). Publiée par un administrateur, sans validation. Elle disparaît d'elle-même après la date de fin,
 * même sans nouvelle publication (vérification dans le navigateur et à la reconstruction quotidienne du site).
 */
export const alerte = z
  .object({
    actif: z.boolean().default(false),
    niveau: z.enum(['info', 'important', 'urgent']).default('info').describe('info : bleu ; important : orange ; urgent : rouge'),
    message: z.string().max(220).default(''),
    lien: z.object({ label: z.string().min(2).max(40), href: z.string().regex(/^(\/|https:\/\/|tel:)/) }).strict().optional(),
    jusqu_au: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date au format AAAA-MM-JJ').optional().describe('Dernier jour d\'affichage'),
  })
  .strict()
  .superRefine((a, ctx) => { if (a.actif && !a.message.trim()) ctx.addIssue({ code: 'custom', path: ['message'], message: 'message obligatoire quand l\'alerte est active' }); });
export type Alerte = z.infer<typeof alerte>;
