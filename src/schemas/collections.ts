import { z } from 'astro/zod';
import { image, metier } from './communs';
import parcours from '../../data/parcours.json' with { type: 'json' };

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
  publics: z
    .array(z.enum(Object.keys(parcours) as [string, ...string[]]))
    .max(6)
    .default([])
    .describe('Parcours où cette fiche apparaît (je viens d\'arriver, je suis parent… : data/parcours.json)'),
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

/** Acteurs locaux : une seule collection, un annuaire par type (pages /annuaire/categorie/<type>). */
export const TYPES_ANNUAIRE = {
  association: 'Associations',
  commerce: 'Commerces',
  artisan: 'Artisans',
  sante: 'Santé',
  'service-public': 'Services publics',
  producteur: 'Producteurs',
  hebergement: 'Hébergement et restauration',
} as const;

export const AVANCEMENTS = {
  etude: 'À l\'étude',
  consultation: 'Concertation',
  vote: 'Voté',
  travaux: 'En travaux',
  termine: 'Terminé',
} as const;

export const TYPES_LIEUX = {
  mairie: 'Mairie et services',
  ecole: 'Écoles et enfance',
  salle: 'Salles',
  sport: 'Sport',
  culture: 'Culture et patrimoine',
  parking: 'Parkings',
  defibrillateur: 'Défibrillateurs',
  dechets: 'Déchets et recyclage',
  nature: 'Parcs et nature',
} as const;

export const THEMES_INFOS = {
  dechets: 'Déchets',
  eau: 'Eau et assainissement',
  transports: 'Transports',
  ecole: 'École et enfance',
  sante: 'Santé',
  cimetiere: 'Cimetière',
  urbanisme: 'Urbanisme',
  urgences: 'Urgences',
  vie: 'Vie quotidienne',
} as const;

const cles = <T extends Record<string, string>>(o: T) => Object.keys(o) as [string, ...string[]];
const gps = { latitude: z.number().min(-90).max(90).optional(), longitude: z.number().min(-180).max(180).optional() };

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
      type: z.enum(cles(TYPES_ANNUAIRE)).describe('Type d\'acteur local'),
      adresse: z.string().max(160).optional(),
      telephone,
      email,
      site: z.string().url().optional(),
      horaires: z.string().max(160).optional(),
    })
    .strict()
    .describe('Un acteur local (association, commerce, artisan, santé, producteur…). Page : /annuaire/<id> ; un annuaire par type.'),

  projets: z
    .object({
      ...communs,
      avancement: z.enum(cles(AVANCEMENTS)).describe('Où en est le projet'),
      date: z.coerce.date().optional().describe('Début (ou date de la décision)'),
      date_fin: z.coerce.date().optional().describe('Fin prévue ou réelle'),
      budget: z.string().max(80).optional().describe('Ex. « 450 000 € TTC, dont 40 % de subventions »'),
      lieu: z.string().max(120).optional(),
      ...gps,
      galerie: z.array(image).max(24).default([]),
      documents: z.array(z.object({ titre: z.string().min(3).max(120), fichier: document }).strict()).max(12).default([]),
    })
    .strict()
    .describe('Un projet municipal suivi dans le temps (étude, concertation, vote, travaux). Page : /projets/<id>.'),

  lieux: z
    .object({
      ...communs,
      type: z.enum(cles(TYPES_LIEUX)),
      adresse: z.string().max(160).optional(),
      ...gps,
      horaires: z.string().max(200).optional(),
      telephone,
      email,
      pmr: z.enum(['oui', 'partiel', 'non']).optional().describe('Accessible aux personnes à mobilité réduite'),
      pmr_detail: z.string().max(200).optional().describe('Précision (entrée accessible, place réservée…)'),
    })
    .strict()
    .describe('Un lieu ou équipement (salle, école, parking, défibrillateur…), placé sur la carte de la commune. Page : /lieux/<id>.'),

  infos: z
    .object({
      ...communs,
      theme: z.enum(cles(THEMES_INFOS)),
      lien: z.string().url().optional().describe('Pour aller plus loin (site du syndicat des eaux, des transports…)'),
      contact: z.string().max(160).optional(),
    })
    .strict()
    .describe('Une information pratique : comment fonctionne la commune au quotidien (déchets, eau, transports…). Page : /infos-pratiques/<id>.'),

  albums: z
    .object({
      ...communs,
      date: z.coerce.date().describe('Date de l\'événement photographié'),
      photos: z
        .array(image.extend({ legende: z.string().max(200).optional().describe('Légende affichée sous la photo agrandie') }))
        .min(1)
        .max(80)
        .describe('Photos de l\'album (80 au plus : au-delà, faire deux albums). Texte alternatif vide : « titre de l\'album, photo n ».'),
      credit: z.string().max(80).default('© Mairie').describe('Crédit photo affiché sous l\'album'),
      autorisations: z.boolean().default(false).describe('Droit à l\'image vérifié : les personnes reconnaissables (et les parents des enfants) ont donné leur accord. Obligatoire pour publier.'),
    })
    .strict()
    .describe('Un album photo (fête, cérémonie, travaux…). Page : /albums/<id>, photos agrandies au clic. Couverture : image, sinon la première photo.'),

  documents: z
    .object({ ...communs, date: z.coerce.date(), fichier: document })
    .strict()
    .describe('Un document téléchargeable (bulletin municipal, PLU, menus de la cantine…). Page : /documents/<id>.'),
} as const;

export type NomCollection = keyof typeof collectionSchemas;
export const nomsCollections = Object.keys(collectionSchemas) as NomCollection[];
