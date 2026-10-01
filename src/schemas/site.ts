import { z } from 'astro/zod';
import { cta } from './communs';

/**
 * Types schema.org proposés pour l'entreprise : sous-types de LocalBusiness (liste fermée, vérifiée).
 * Le plus précis possible ; plusieurs si l'activité est mixte (ex. électricien + climatisation).
 */
export const TYPES_ENTREPRISE = [
  'LocalBusiness',
  // Collectivités (mairie, intercommunalité)
  'GovernmentOffice',
  // Bâtiment et services à domicile
  'HomeAndConstructionBusiness', 'Electrician', 'HVACBusiness', 'Plumber', 'RoofingContractor', 'GeneralContractor',
  'HousePainter', 'Locksmith', 'MovingCompany',
  // Automobile
  'AutomotiveBusiness', 'AutoRepair', 'AutoBodyShop', 'AutoDealer',
  // Beauté, bien-être, sport
  'HealthAndBeautyBusiness', 'BeautySalon', 'HairSalon', 'NailSalon', 'DaySpa', 'TattooParlor', 'HealthClub',
  'SportsActivityLocation', 'ExerciseGym',
  // Santé
  'MedicalBusiness', 'Dentist', 'Physician', 'Optician', 'Pharmacy',
  // Services professionnels
  'ProfessionalService', 'LegalService', 'Attorney', 'Notary', 'FinancialService', 'AccountingService',
  'InsuranceAgency', 'RealEstateAgent', 'EmploymentAgency', 'TravelAgency', 'ChildCare',
  // Restauration, hébergement
  'FoodEstablishment', 'Restaurant', 'Bakery', 'CafeOrCoffeeShop', 'BarOrPub', 'LodgingBusiness', 'Hotel', 'BedAndBreakfast',
  // Commerce
  'Store', 'Florist', 'HardwareStore', 'ClothingStore', 'FurnitureStore', 'GardenStore',
] as const;

export const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'] as const;
const heure = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'heure attendue au format HH:MM (ex. 08:30)');

export const site = z
  .object({
    nom: z.string().min(2).max(80),
    baseline: z.string().max(80),
    description: z.string().max(300),
    url: z.string().url(),
    types_schema: z
      .array(z.enum(TYPES_ENTREPRISE))
      .min(1)
      .max(3)
      .default(['LocalBusiness'])
      .describe("Type d'entreprise pour Google (schema.org) : le plus précis, plusieurs si l'activité est mixte"),
    telephone: z.string().max(30),
    email: z.union([z.string().email(), z.literal('')]).describe('Vide si l\'entreprise n\'affiche pas d\'e-mail'),
    horaires: z.string().max(160).describe('Horaires affichés (texte libre)'),
    horaires_detail: z
      .array(z.object({ jours: z.array(z.enum(JOURS)).min(1), ouverture: heure, fermeture: heure }).strict())
      .max(14)
      .optional()
      .describe('Horaires lisibles par Google, déduits des horaires affichés'),
    adresse: z
      .object({ rue: z.string().max(120).optional(), ville: z.string().max(80), code_postal: z.string().max(10), pays: z.string().length(2).default('FR') })
      .strict(),
    afficher_adresse: z.boolean().default(false).describe('Rue affichée et déclarée à Google (sinon la ville seulement)'),
    siret: z.string().max(20).optional(),
    legal: z
      .object({
        raison_sociale: z.string().max(120).describe("Nom de l'entreprise, ou nom et prénom pour une entreprise individuelle"),
        forme: z.string().max(80).describe('Forme juridique : entreprise individuelle, micro-entreprise, EURL, SARL, SAS, SASU, association…'),
        capital: z.string().max(40).optional().describe('Capital social (sociétés), ex. « 1 000 € »'),
        immatriculation: z.string().max(80).optional().describe('RCS, RNE ou répertoire des métiers, ex. « RCS Aix-en-Provence 123 456 789 »'),
        tva_intra: z.string().max(20).optional(),
        adresse: z.string().max(160).optional().describe('Adresse du siège, si différente de l\'adresse du site ou non affichée'),
        directeur_publication: z.string().max(80),
        profession: z.string().max(400).optional().describe('Profession réglementée : titre, ordre ou organisme, règles applicables'),
        assurance: z.string().max(200).optional().describe('Assureur et couverture (ex. garantie décennale), zone couverte'),
        mediateur: z.object({ nom: z.string().max(120), url: z.string().url() }).strict().optional().describe('Médiateur de la consommation (clientèle de particuliers)'),
        credits_photos: z.string().max(300).optional(),
        accessibilite: z
          .object({
            taux: z.number().min(0).max(100).optional().describe("Taux de conformité RGAA de l'audit (%)"),
            date_audit: z.string().max(30).optional(),
            auditeur: z.string().max(120).optional(),
            date_declaration: z.string().max(30).optional(),
            non_conformites: z.array(z.string().max(300)).max(30).optional(),
          })
          .strict()
          .optional()
          .describe("Résultats de l'audit d'accessibilité (déclaration d'accessibilité)"),
      })
      .strict()
      .optional()
      .describe('Informations légales : mentions légales et politique de confidentialité générées automatiquement'),
    logo: z.string().regex(/^\/img\/[A-Za-z0-9/_.-]+\.(jpe?g|png|webp)$/i).optional(),
    zone_resume: z.string().max(80).describe('Zone affichée dans le bandeau du haut'),
    villes: z.array(z.string().min(2).max(60)).max(20).optional().describe("Villes desservies, de la plus importante à la moins importante (déclarées à Google)"),
    urgence: z.object({ actif: z.boolean(), texte: z.string().max(80) }).strict(),
    reseaux: z.array(z.string().url()).max(10).default([]),
    fiche_google: z.string().url().optional().describe('Fiche Google Business Profile (lien Google Maps)'),
    cta_defaut: z
      .object({ titre: z.string().max(90), texte: z.string().max(300), ctas: z.array(cta).min(1).max(2), note: z.string().max(80).optional() })
      .strict(),
  })
  .strict()
  .superRefine((s, ctx) => {
    if (s.afficher_adresse && !s.adresse.rue) ctx.addIssue({ code: 'custom', path: ['adresse', 'rue'], message: 'rue obligatoire si afficher_adresse vaut true' });
    (s.horaires_detail ?? []).forEach((h, i) => {
      if (h.fermeture <= h.ouverture) ctx.addIssue({ code: 'custom', path: ['horaires_detail', i, 'fermeture'], message: 'fermeture avant ouverture' });
    });
  });

export type Site = z.infer<typeof site>;
