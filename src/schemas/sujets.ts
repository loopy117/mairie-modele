import { z } from 'astro/zod';
import donnees from '../../data/sujets.json' with { type: 'json' };

/**
 * Sujets (mots-clés) : liste gérée par la mairie (data/sujets.json, éditeur › Réglages › Sujets). Chaque contenu,
 * pages comprises, peut en porter plusieurs ; une page /sujets/<id> rassemble tout ce qui porte le sujet.
 * Liste fermée (pas de saisie libre) : pas de « école » / « ecole » / « écoles » côte à côte.
 */
export const sujetsFichier = z
  .object({
    sujets: z
      .array(z.object({
        id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'identifiant en minuscules, sans accent, mots séparés par des tirets (ex. conseil-municipal)'),
        libelle: z.string().min(2).max(40),
        intro: z.string().max(220).optional().describe('Phrase d\'introduction de la page du sujet'),
      }).strict())
      .max(60),
  })
  .strict()
  .superRefine((d, ctx) => {
    const vus = new Set<string>();
    d.sujets.forEach((s, i) => { if (vus.has(s.id)) ctx.addIssue({ code: 'custom', path: ['sujets', i, 'id'], message: `sujet en double : ${s.id}` }); vus.add(s.id); });
  });

export const SUJETS: Record<string, { libelle: string; intro?: string }> = Object.fromEntries((donnees.sujets ?? []).map((s: any) => [s.id, { libelle: s.libelle, intro: s.intro }]));
const ids = Object.keys(SUJETS);

/** Champ « sujets » des contenus et des pages. */
export const champSujets = z
  .array(ids.length ? z.enum(ids as [string, ...string[]]) : z.string().max(0, 'aucun sujet défini (data/sujets.json)'))
  .max(8)
  .default([])
  .describe('Sujets (mots-clés) : la fiche apparaît sur la page de chaque sujet. Liste gérée dans Réglages › Sujets.');

/** Diffusion après publication : réseaux où proposer un message (espace client › Diffuser), lettre d'information. */
export const RESEAUX = ['facebook', 'instagram', 'linkedin'] as const;
export const champDiffuser = z
  .array(z.enum(RESEAUX))
  .max(3)
  .default([])
  .describe('Après la mise en ligne, l\'espace client prépare un message pour ces réseaux (à relire et publier vous-même)');
export const champLettre = z
  .boolean()
  .default(false)
  .describe('Proposer cette publication dans la prochaine lettre d\'information (espace client › Lettre d\'information)');
