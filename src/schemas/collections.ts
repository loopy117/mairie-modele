import { z } from 'astro/zod';
import { image, metier } from './communs';

const seo = z
  .object({
    titre: z.string().max(60).optional(),
    description: z.string().min(120).max(160).optional(),
    noindex: z.boolean().default(false),
  })
  .strict()
  .default({ noindex: false });

/** Document joint (PDF), rangé dans media/ et servi en /img/… */
const document = z.string().regex(/^\/img\/[A-Za-z0-9/_.-]+\.pdf$/i, 'chemin attendu : /img/<dossier>/<nom>.pdf').describe('Document PDF');

/** Champs communs à toutes les collections (spec §5). Thème (categorie) : data/taxonomies.json, facultatif. */
const communs = {
  titre: z.string().min(3).max(120),
  statut: z.enum(['brouillon', 'publie', 'programme']).default('publie'),
  date: z.coerce.date().optional(),
  resume: z.string().max(300).optional(),
  image: image.optional(),
  categorie: metier.optional(),
  mis_en_avant: z.boolean().default(false),
  ordre: z.number().int().default(100),
  seo,
  ancres: z
    .array(z.string().min(3).max(60))
    .max(6)
    .optional()
    .describe("Expressions qui, dans le texte des autres pages, deviennent un lien vers celle-ci (ex. « carte d'identité »). Précises, 2 à 6 mots ; jamais « ici »."),
  role: z.enum(['aimant', 'seo']).optional().describe('aimant : contenu que le visiteur a envie d\'ouvrir ; seo : page d\'entrée depuis Google.'),
  /** Sections facultatives ajoutées après le corps sur la page de détail (validées par le schéma de page). */
  sections: z.array(z.any()).optional(),
};

export const TYPES_ACTES = {
  arrete: 'Arrêté du maire',
  deliberation: 'Délibération',
  'liste-deliberations': 'Liste des délibérations',
  'proces-verbal': 'Procès-verbal du conseil municipal',
  budget: 'Budget et documents financiers',
  autre: 'Autre acte',
} as const;

export const TYPES_ANNUAIRE = {
  association: 'Association',
  commerce: 'Commerce et artisanat',
  sante: 'Santé',
  'service-public': 'Service public',
  hebergement: 'Hébergement et restauration',
} as const;

const email = z.union([z.string().email(), z.literal('')]).optional();
const telephone = z.string().max(30).optional();

export const collectionSchemas = {
  actualites: z
    .object({ ...communs, date: z.coerce.date(), categorie: metier })
    .strict()
    .describe('Une actualité de la commune (travaux, vie municipale, culture…). Page : /actualites/<id>.'),

  agenda: z
    .object({
      ...communs,
      date: z.coerce.date().describe('Date (de début) de l\'événement'),
      date_fin: z.coerce.date().optional().describe('Dernier jour, si l\'événement dure plusieurs jours'),
      horaire: z.string().max(40).optional().describe('Ex. « 14 h – 18 h »'),
      lieu: z.string().max(80),
      organisateur: z.string().max(80).optional(),
    })
    .strict()
    .describe('Un événement. Page : /agenda/<id>. L\'agenda n\'affiche que les événements à venir.'),

  actes: z
    .object({
      ...communs,
      type: z.enum(Object.keys(TYPES_ACTES) as [string, ...string[]]).describe('Nature de l\'acte'),
      numero: z.string().max(30).optional().describe('Numéro de l\'acte (ex. 2026-042)'),
      date: z.coerce.date().describe('Date de l\'acte (signature ou séance)'),
      fichier: document.describe('Acte au format PDF, tel que signé'),
    })
    .strict()
    .describe('Acte officiel (arrêté, délibération, procès-verbal). Publié par un administrateur ; date de mise en ligne et empreinte du PDF affichées automatiquement. Page : /actes/<id>.'),

  demarches: z
    .object({
      ...communs,
      categorie: metier,
      lien: z.string().url().optional().describe('Démarche en ligne (service-public.fr, ANTS…)'),
      pieces: z.array(z.string().min(3).max(160)).max(15).default([]).describe('Pièces à fournir'),
      contact: z.string().max(160).optional().describe('Où s\'adresser (accueil de la mairie, service…)'),
    })
    .strict()
    .describe('Une démarche administrative. Page : /demarches/<id>.'),

  annuaire: z
    .object({
      ...communs,
      type: z.enum(Object.keys(TYPES_ANNUAIRE) as [string, ...string[]]),
      adresse: z.string().max(160).optional(),
      telephone,
      email,
      site: z.string().url().optional(),
      horaires: z.string().max(160).optional(),
    })
    .strict()
    .describe('Une fiche de l\'annuaire (association, commerce, santé…). Page : /annuaire/<id>.'),

  documents: z
    .object({ ...communs, date: z.coerce.date(), fichier: document })
    .strict()
    .describe('Un document téléchargeable (bulletin municipal, PLU, menus de la cantine…). Page : /documents/<id>.'),
} as const;

export type NomCollection = keyof typeof collectionSchemas;
export const nomsCollections = Object.keys(collectionSchemas) as NomCollection[];
