import { z } from 'astro/zod';

/**
 * Formulaires métier du site (spec partie 5) : data/formulaires.json.
 * Chaque formulaire appartient à un module (devis, rendez-vous, contact) dont le suivi est géré
 * par l'espace client (code commun du serveur, commun/modules/<module>.json).
 * Le site affiche le formulaire à partir de ce fichier ; le serveur vérifie les envois avec la même copie
 * (publiée au build dans xmedia-ai/contexte/formulaires.json).
 */
const id = z.string().regex(/^[a-z][a-z0-9_]{1,30}$/, 'identifiant : minuscules, chiffres, _');

// Commun à toutes les précisions : regroupement visuel (fieldset) et caractère obligatoire (vérifié aussi par le serveur)
const commun = {
  id,
  label: z.string().min(3).max(80),
  aide: z.string().max(120).optional(),
  obligatoire: z.boolean().optional().describe('Champ obligatoire (vérifié par le serveur)'),
  groupe: z.string().max(40).optional().describe('Titre du groupe de champs (ex. « Manifestation ») : les précisions qui se suivent avec le même groupe sont réunies'),
};

export const precision = z.discriminatedUnion('type', [
  z.object({ ...commun, type: z.literal('choix'), options: z.array(z.string().min(1).max(60)).min(2).max(8) }).strict(),
  z.object({ ...commun, type: z.literal('cases'), options: z.array(z.string().min(1).max(60)).min(2).max(10) }).strict().describe('Plusieurs choix possibles'),
  z.object({ ...commun, type: z.literal('texte') }).strict(),
  z.object({ ...commun, type: z.literal('url') }).strict().describe('Adresse web (site actuel, page Facebook…) : vérifiée, complétée en https://'),
  z.object({ ...commun, type: z.literal('date') }).strict().describe('Date (jamais passée)'),
  z.object({ ...commun, type: z.literal('heure') }).strict().describe('Heure HH:MM'),
  z.object({ ...commun, type: z.literal('nombre'), min: z.number().int().min(0).default(0), max: z.number().int().min(1).max(100000) }).strict(),
  z.object({ ...commun, type: z.literal('photos'), max: z.number().int().min(1).max(5).default(5) }).strict(),
]);

export const formulaireMetier = z
  .object({
    module: z.enum(['devis', 'contact', 'signalement', 'proposition', 'reservation']).describe('Module de suivi dans l\'espace client (signalement, proposition, reservation : sites de mairie)'),
    prestations: z.array(z.string().min(2).max(60)).min(1).max(12).optional().describe('Choix proposés pour « Votre projet » (services du site, puis « Autre »)'),
    urgence: z.string().max(80).optional().describe('Libellé de la case « urgence » (absente si vide)'),
    precisions: z.array(precision).max(12).default([]).describe('Étape 2 facultative : champs pour préciser la demande'),
    precisions_ouvertes: z.boolean().default(false).describe('Étape 2 dépliée d\'office (formulaire court où les précisions comptent)'),
    precisions_principales: z.boolean().default(false).describe('Précisions affichées en entier après les coordonnées, par groupes, sans encadré « facultatif » (formulaire de demande complet, ex. réservation)'),
    precisions_en_tete: z.boolean().default(false).describe('Précisions affichées en premier, sans encadré (formulaire très court, ex. audit : adresse du site puis e-mail)'),
    champs: z.array(z.enum(['service', 'commune', 'nom', 'telephone', 'email', 'message'])).min(1).optional()
      .describe('Champs de l\'étape 1, dans l\'ordre (défaut : service, commune, nom, telephone, email, message). Sans message, au moins une précision.'),
    obligatoires: z.array(z.enum(['service', 'commune', 'nom', 'telephone', 'email', 'message'])).optional()
      .describe('Champs obligatoires de l\'étape 1 (défaut : service, commune, nom, message)'),
    libelles: z.record(z.string(), z.string().min(2).max(80)).optional().describe('Libellés remplacés, par champ (ex. { "message": "Vos attentes" })'),
  })
  .strict()
  .superRefine((f, ctx) => {
    const ids = f.precisions.map((p) => p.id);
    if (new Set(ids).size !== ids.length) ctx.addIssue({ code: 'custom', path: ['precisions'], message: 'identifiant en double' });
    if (f.precisions.filter((p) => p.type === 'photos').length > 1) ctx.addIssue({ code: 'custom', path: ['precisions'], message: 'un seul champ photos' });
    if (f.champs && !f.champs.includes('message') && !f.precisions.length) ctx.addIssue({ code: 'custom', path: ['champs'], message: 'sans message, prévoir au moins une précision' });
    if (f.champs && !f.champs.includes('email') && !f.champs.includes('telephone')) ctx.addIssue({ code: 'custom', path: ['champs'], message: 'il faut email ou telephone pour répondre' });
    for (const o of f.obligatoires ?? []) if (f.champs && !f.champs.includes(o)) ctx.addIssue({ code: 'custom', path: ['obligatoires'], message: `« ${o} » absent de champs` });
    const reserves = ['nom', 'email', 'telephone', 'commune', 'service', 'message', 'urgence'];
    for (const [i, p] of f.precisions.entries()) if (p.type === 'nombre' && p.max < p.min) ctx.addIssue({ code: 'custom', path: ['precisions', i, 'max'], message: 'max inférieur à min' });
    for (const [i, p] of f.precisions.entries()) if (reserves.includes(p.id)) ctx.addIssue({ code: 'custom', path: ['precisions', i, 'id'], message: `« ${p.id} » est réservé` });
  });

export const formulaires = z.record(id, formulaireMetier);
export type FormulaireMetier = z.infer<typeof formulaireMetier>;
