/**
 * data/tarifs.json : grille de prix du site, en un seul endroit (bloc `tarifs`, contexte de l'assistant).
 * Facultatif : seuls les sites qui affichent des prix en ont un. Montants HT, en euros, sans symbole.
 */
import { z } from 'astro/zod';
import { icone } from './communs';

const montant = z.number().nonnegative().max(1_000_000);

export const tarifs = z
  .object({
    mention: z.string().max(80).default('Prix hors taxes.').describe('Ligne discrète sous la grille'),
    creation: z
      .object({
        titre: z.string().max(60).default('Création de votre site'),
        note_engagement: z.string().max(80).optional().describe('Sous le sélecteur de durée (ex. « L\'abonnement mensuel reste identique. »)'),
        texte: z.string().max(220).optional(),
        a_partir_de: z.boolean().default(true).describe('Affiche « à partir de » devant le prix'),
        prix: montant,
        paiement_3_fois: z.boolean().default(false),
        engagements: z
          .array(z.object({ mois: z.number().int().min(1).max(60), remise: z.number().min(0).max(90).default(0).describe('Remise sur la création, en %') }).strict())
          .max(4)
          .default([])
          .describe('Durées proposées ; la première est sélectionnée par défaut. Vide = pas de sélecteur'),
      })
      .strict()
      .optional(),
    formules: z
      .array(
        z
          .object({
            nom: z.string().max(30),
            icone: icone.optional(),
            prix_mois: montant,
            accroche: z.string().max(140).optional(),
            inclus_intro: z.string().max(60).optional().describe('Ligne avant la liste (ex. « Tout Essentiel, plus : »)'),
            inclus: z.array(z.string().max(90)).min(1).max(10),
            demandes: z.string().max(80).optional().describe('Ligne sous la liste (ex. « Jusqu\'à 2 demandes de modification par mois »)'),
            bouton: z.string().max(40).optional().describe('Texte du bouton (défaut : « Choisir <nom> »)'),
            mis_en_avant: z.boolean().default(false),
            badge: z.string().max(24).optional(),
          })
          .strict(),
      )
      .min(1)
      .max(4),
    options_titre: z.string().max(60).default('Les options, à la carte'),
    options_intro: z.string().max(120).optional(),
    options: z
      .array(
        z
          .object({
            nom: z.string().max(40),
            icone: icone.optional(),
            texte: z.string().max(160).optional(),
            prix: z.string().max(30).optional().describe('Texte libre (« 19 € HT / mois », « sur devis ») ; vide = non affiché'),
            bientot: z.boolean().default(false).describe('Option pas encore disponible : affichée « Bientôt »'),
          })
          .strict(),
      )
      .max(8)
      .default([]),
  })
  .strict()
  .superRefine((t, ctx) => {
    if (t.formules.filter((f) => f.mis_en_avant).length > 1) ctx.addIssue({ code: 'custom', path: ['formules'], message: 'une seule formule mise en avant' });
    const mois = t.creation?.engagements.map((e) => e.mois) ?? [];
    if (new Set(mois).size !== mois.length) ctx.addIssue({ code: 'custom', path: ['creation', 'engagements'], message: 'durées en double' });
  });

export type Tarifs = z.infer<typeof tarifs>;

/** Montant formaté à la française : 1 490 €, 348 € (arrondi à l'euro). */
export const euros = (n: number) => `${Math.round(n).toLocaleString('fr-FR').replace(/ | /g, ' ')} €`;
