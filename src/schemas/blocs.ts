/**
 * Schémas des blocs (spec §4). Chaque bloc : un composant dans src/blocks/,
 * ce schéma, et une fiche générée dans ai/catalogue.md (npm run catalogue).
 * .meta({ role, quand, eviter }) alimente le catalogue lu par l'IA.
 */
import { z } from 'astro/zod';
import formulairesSite from '../../data/formulaires.json' with { type: 'json' };
import { image, cta, lien, icone, markdown, optionsCommunes, entete } from './communs';
import { collectionSchemas, nomsCollections, type NomCollection } from './collections';
import { cartes, nomsCartes } from '../cards/cartes';
import { illustration } from '../illustrations/noms';
import { dispositions, nomsDispositions } from '../dispositions/dispositions';

const sansH1 = (s: string) => !/^#\s/m.test(s);

export const hero = z
  .object({
    block: z.literal('hero'),
    variant: z.enum(['plein-ecran', 'split', 'minimal']).default('plein-ecran'),
    ...optionsCommunes,
    surtitre: z.string().max(40).optional().describe('Pastille au-dessus du titre (ex. « Artisan installateur · Pertuis »)'),
    titre: z.string().min(10).max(70).describe('Titre principal de la page (H1)'),
    texte: z.string().max(220).optional(),
    image: image.optional().describe('Obligatoire sauf variante minimal (ou illustration en variante split)'),
    illustration: illustration.optional().describe('Variante split : illustration codée à la place de la photo'),
    ctas: z.array(cta).max(2).default([]),
    points: z.array(z.string().max(40)).max(4).default([]).describe('Garanties courtes affichées sous les boutons'),
  })
  .strict()
  .refine((b) => b.variant === 'minimal' || !!b.image || (b.variant === 'split' && !!b.illustration), { message: 'image obligatoire (plein-ecran), image ou illustration (split)', path: ['image'] })
  .meta({
    role: 'Ouverture de page, message principal.',
    quand: 'Toujours en première section, un seul par page. plein-ecran : accueil et pages de service avec une belle photo. split : photo moins forte ou texte plus long. minimal : pages utilitaires (contact, mentions).',
    eviter: 'Titre générique (« Bienvenue ») ; plus de deux boutons.',
  });

export const texte = z
  .object({
    block: z.literal('texte'),
    variant: z.enum(['standard', 'etroit', 'deux-colonnes']).default('etroit'),
    ...optionsCommunes,
    ...entete,
    contenu: markdown.max(4000).refine(sansH1, 'pas de titre de niveau 1 (#) dans le contenu'),
  })
  .strict()
  .meta({
    role: 'Contenu rédactionnel libre en Markdown.',
    quand: 'Explications détaillées, mentions légales, contenus longs. etroit pour la lecture, deux-colonnes pour un texte long découpé.',
    eviter: 'Plus de deux blocs texte à la suite : alterner avec texte-image ou features.',
  });

export const texteImage = z
  .object({
    block: z.literal('texte-image'),
    variant: z.enum(['image-droite', 'image-gauche', 'visuel-dessous']).default('image-droite')
      .describe('visuel-dessous : texte et points côte à côte, visuel en pleine largeur dessous'),
    ...optionsCommunes,
    surtitre: entete.surtitre,
    titre: z.string().max(90),
    contenu: markdown.max(1200).refine(sansH1, 'pas de titre de niveau 1 (#)').optional(),
    citation: z.boolean().default(false).describe('Contenu affiché comme une citation (police de titre, plus grand)'),
    points: z
      .array(z.object({ icone: icone.optional(), titre: z.string().max(60).optional(), texte: z.string().max(200).optional() }).strict()
        .refine((p) => !!(p.titre || p.texte), 'titre ou texte'))
      .max(5)
      .default([])
      .describe('Arguments courts'),
    points_style: z.enum(['traits', 'icones', 'encarts']).default('traits').describe('traits : trait de couleur · icones : icône devant le texte · encarts : petites cartes (2 colonnes)'),
    signature: z.object({ nom: z.string().max(60).optional(), role: z.string().max(90) }).strict().optional().describe('Sous une citation : nom et fonction'),
    images: z.array(image).max(3).default([]).describe('1 image, ou 3 pour une mosaïque (la 1re en hauteur)'),
    illustration: illustration.optional().describe('Illustration codée à la place des images'),
    lien: lien.optional(),
  })
  .strict()
  .refine((b) => !(b.images.length && b.illustration), { message: 'images ou illustration, pas les deux', path: ['illustration'] })
  .meta({
    role: 'Explication illustrée : un texte ou des arguments à côté d\'une ou trois images.',
    quand: 'Présenter l\'entreprise, un argument, une méthode. 3 images = mosaïque (portrait d\'équipe + deux détails).',
    eviter: 'Deux texte-image consécutifs du même côté : alterner image-droite / image-gauche.',
  });

export const features = z
  .object({
    block: z.literal('features'),
    variant: z.enum(['grille-icones', 'liste', 'etapes-numerotees', 'comparatif', 'paires']).default('grille-icones')
      .describe('comparatif : cartes titrées en petites capitales (options comparées) · paires : items regroupés deux par carte'),
    ...optionsCommunes,
    ...entete,
    items: z
      .array(z.object({
        icone: icone.optional(), titre: z.string().max(60), texte: z.string().max(200).optional(), lien: lien.optional(),
        mis_en_avant: z.boolean().optional().describe('Carte mise en valeur (fond de couleur) : une seule par bloc, grille uniquement'),
        badge: z.string().max(24).optional().describe('Pastille sur la carte mise en avant (ex. « Recommandé »)'),
      }).strict())
      .min(2)
      .max(8),
    illustration: illustration.optional().describe('Illustration codée en première case de la grille (ex. pagespeed)'),
  })
  .strict()
  .superRefine((b, ctx) => {
    if (b.items.filter((i) => i.mis_en_avant).length > 1) ctx.addIssue({ code: 'custom', path: ['items'], message: 'une seule carte mise en avant par bloc' });
  })
  .meta({
    role: 'Points forts, garanties, étapes d\'un processus.',
    quand: 'grille-icones : 3 à 6 avantages. etapes-numerotees : un déroulé (devis, pose, mise en service). liste : points plus longs.',
    eviter: 'Items sans texte en variante liste ; plus de 8 items.',
  });

export const galerie = z
  .object({
    block: z.literal('galerie'),
    variant: z.enum(['grille', 'mosaique', 'carrousel']).default('grille'),
    ...optionsCommunes,
    ...entete,
    images: z.array(image).min(2).max(24),
  })
  .strict()
  .meta({
    role: 'Ensemble d\'images.',
    quand: 'Photos d\'un chantier ou d\'une réalisation. mosaique pour 5+ images de formats variés, carrousel pour une page déjà longue.',
    eviter: 'Galerie de 2 images : préférer texte-image.',
  });

export const slider = z
  .object({
    block: z.literal('slider'),
    variant: z.enum(['plein-large', 'contenu']).default('contenu'),
    ...optionsCommunes,
    ...entete,
    slides: z
      .array(z.object({ image, titre: z.string().max(60).optional(), texte: z.string().max(160).optional(), cta: cta.optional() }).strict())
      .min(2)
      .max(6),
  })
  .strict()
  .meta({
    role: 'Défilement d\'images légendées (scroll horizontal, sans JavaScript).',
    quand: 'Montrer plusieurs visuels forts avec une légende chacun.',
    eviter: 'Messages importants cachés dans les slides suivantes.',
  });

export const ctaBloc = z
  .object({
    block: z.literal('cta'),
    variant: z.enum(['bandeau', 'carte', 'split-image']).default('carte'),
    ...optionsCommunes,
    icone: icone.optional().describe('Pastille d\'icône (variante bandeau)'),
    titre: z.string().max(80),
    texte: z.string().max(220).optional(),
    ctas: z.array(cta).min(1).max(2),
    note: z.string().max(80).optional().describe('Ligne discrète sous les boutons (ex. « ou appelez le … »)'),
    image: image.optional().describe('Obligatoire pour split-image'),
  })
  .strict()
  .refine((b) => b.variant !== 'split-image' || !!b.image, { message: 'image obligatoire pour la variante split-image', path: ['image'] })
  .meta({
    role: 'Appel à l\'action.',
    quand: 'carte (encadré vert) en fin de page de conversion. bandeau (pleine largeur, souvent fond sombre) pour un message court en milieu de page (urgence, téléphone).',
    eviter: 'Plus de deux cta par page.',
  });

export const faq = z
  .object({
    block: z.literal('faq'),
    variant: z.enum(['accordeon', 'deux-colonnes', 'titre-gauche']).default('accordeon').describe('titre-gauche : titre à gauche, questions ouvertes à droite'),
    ...optionsCommunes,
    ...entete,
    items: z.array(z.object({ question: z.string().max(150), reponse: markdown.max(800) }).strict()).min(3).max(15),
  })
  .strict()
  .meta({
    role: 'Questions-réponses (balisage FAQPage automatique).',
    quand: 'Lever les objections avant la prise de contact : prix, délais, aides, entretien.',
    eviter: 'Réponses inventées (prix, délais) : utiliser [À COMPLÉTER : …].',
  });

export const chiffres = z
  .object({
    block: z.literal('chiffres'),
    variant: z.enum(['ligne', 'cartes']).default('ligne'),
    ...optionsCommunes,
    ...entete,
    items: z.array(z.object({ valeur: z.string().max(12), libelle: z.string().max(60), source: z.string().max(80).optional() }).strict()).min(2).max(4),
  })
  .strict()
  .meta({
    role: 'Statistiques clés.',
    quand: 'Uniquement avec des chiffres fournis par le client ou présents sur le site.',
    eviter: 'Tout chiffre inventé ou arrondi « pour faire bien ».',
  });

/* -------------------------------- formulaire -------------------------------- */

export const champsFormulaire = ['nom', 'email', 'telephone', 'commune', 'service', 'message'] as const;
const champForm = z.enum(champsFormulaire);

export const formulaire = z
  .object({
    block: z.literal('formulaire'),
    variant: z.enum(['avec-coordonnees', 'simple', 'carte']).default('avec-coordonnees')
      .describe('carte : texte à gauche, formulaire dans une carte blanche à droite'),
    ...optionsCommunes,
    ...entete,
    note: z.string().max(120).optional().describe('Ligne sous le bouton (ex. « Sans engagement. »)'),
    champs: z.array(champForm).min(3).default([...champsFormulaire]).describe('Champs affichés, dans cet ordre'),
    obligatoires: z.array(champForm).default(['nom', 'message']).describe('Champs obligatoires (message toujours obligatoire)'),
    sujet: z.string().max(60).default('Demande depuis le site').describe("Objet de l'e-mail reçu (ex. « Demande de devis PAC piscine »)"),
    bouton: z.string().max(40).default('Envoyer ma demande'),
    formulaire: z
      .string()
      .optional()
      .describe("Formulaire métier de data/formulaires.json (ex. devis) : remplace champs et obligatoires, les demandes arrivent qualifiées dans l'espace client"),
  })
  .strict()
  .superRefine((b, ctx) => {
    if (b.formulaire && !(b.formulaire in formulairesSite)) ctx.addIssue({ code: 'custom', path: ['formulaire'], message: `formulaire « ${b.formulaire} » absent de data/formulaires.json (${Object.keys(formulairesSite).join(', ') || 'aucun'})` });
    if (new Set(b.champs).size !== b.champs.length) ctx.addIssue({ code: 'custom', path: ['champs'], message: 'champ en double' });
    if (!b.champs.includes('message')) ctx.addIssue({ code: 'custom', path: ['champs'], message: 'le champ message est obligatoire' });
    if (!b.champs.includes('email') && !b.champs.includes('telephone')) ctx.addIssue({ code: 'custom', path: ['champs'], message: 'il faut au moins email ou telephone pour pouvoir répondre' });
    for (const c of b.obligatoires) if (!b.champs.includes(c)) ctx.addIssue({ code: 'custom', path: ['obligatoires'], message: `« ${c} » est obligatoire mais absent de champs` });
  })
  .meta({
    role: 'Formulaire de contact ou de demande de devis. Avec « formulaire » (data/formulaires.json) : formulaire métier en deux étapes (la seconde facultative, photos comprises), demandes qualifiées et suivies dans l\'espace client. Sans : formulaire simple envoyé par e-mail.',
    quand: 'Page contact, et en fin de page de service à fort enjeu (avec un sujet précis). avec-coordonnees : formulaire + téléphone, e-mail, horaires à côté. simple : formulaire seul.',
    eviter: 'Plus d\'un formulaire par page ; des champs obligatoires inutiles (chaque champ en trop fait perdre des demandes).',
  });

/* ---------------------------------- boucle --------------------------------- */

const scalaire = z.union([z.string(), z.number(), z.boolean()]);
const operateurs = z
  .object({
    different: scalaire.optional(),
    contient: z.array(scalaire).optional(),
    contient_tous: z.array(scalaire).optional(),
    apres: z.string().optional(),
    avant: z.string().optional(),
    depuis: z.string().regex(/^\d+\s*(jours?|mois|ans?)$/, 'format : « 6 mois », « 30 jours », « 2 ans »').optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    existe: z.boolean().optional(),
  })
  .strict();
export const valeurFiltre = z.union([scalaire, z.array(scalaire), operateurs]);

export const boucle = z
  .object({
    block: z.literal('boucle'),
    ...optionsCommunes,
    ...entete,
    lien_tout_voir: lien.optional(),
    source: z.enum(nomsCollections as [NomCollection, ...NomCollection[]]),
    filtre: z.record(z.string(), valeurFiltre).optional().describe('Conditions cumulées (ET)'),
    exclure: z.array(z.string()).default([]),
    elements: z.array(z.string()).optional().describe('Sélection manuelle : remplace filtre, ordre et nombre'),
    ordre: z.union([z.string(), z.array(z.string())]).default('date desc'),
    nombre: z.number().int().min(1).max(24).default(6),
    decalage: z.number().int().min(0).default(0),
    carte: z.enum(nomsCartes as [string, ...string[]]),
    affichage: z.enum(nomsDispositions).default('grid'),
    options: z.record(z.string(), z.unknown()).default({}),
    si_vide: z.enum(['masquer', 'message']).default('masquer'),
    message_vide: z.string().max(120).optional(),
  })
  .strict()
  .superRefine((b, ctx) => {
    const carte = cartes[b.carte as keyof typeof cartes];
    if (carte && carte.collection !== b.source) {
      ctx.addIssue({ code: 'custom', path: ['carte'], message: `la carte « ${b.carte} » affiche la collection « ${carte.collection} », pas « ${b.source} »` });
    }
    const opts = dispositions[b.affichage].options.safeParse(b.options);
    if (!opts.success) {
      for (const i of opts.error.issues) ctx.addIssue({ code: 'custom', path: ['options', ...i.path.map(String)], message: `option invalide pour « ${b.affichage} » : ${i.message}` });
    }
    if (b.elements && b.filtre) ctx.addIssue({ code: 'custom', path: ['elements'], message: 'elements (sélection manuelle) et filtre sont exclusifs' });
    const champs = new Set(['id', ...Object.keys(collectionSchemas[b.source].shape), ...('date_fin' in collectionSchemas[b.source].shape ? ['date_fin_ou_date'] : [])]);   // champ calculé (lib/requete.ts)
    for (const c of Object.keys(b.filtre ?? {})) {
      if (!champs.has(c)) ctx.addIssue({ code: 'custom', path: ['filtre', c], message: `champ inconnu pour « ${b.source} » (champs : ${[...champs].join(', ')})` });
    }
    for (const o of [b.ordre].flat()) {
      const [c, sens = 'asc'] = o.trim().split(/\s+/);
      if (c === 'aleatoire') continue;
      if (!champs.has(c) || !['asc', 'desc'].includes(sens)) ctx.addIssue({ code: 'custom', path: ['ordre'], message: `tri invalide « ${o} » : attendu « <champ> asc|desc » ou « aleatoire »` });
    }
    if (b.si_vide === 'message' && !b.message_vide) ctx.addIssue({ code: 'custom', path: ['message_vide'], message: 'message_vide obligatoire quand si_vide = message' });
  })
  .meta({
    role: 'Affiche des éléments d\'une collection selon une requête, avec une carte et une disposition.',
    quand: 'Dès qu\'on montre des services, réalisations, zones… Les éléments ajoutés plus tard apparaissent automatiquement.',
    eviter: 'Une boucle dont le filtre ne renvoie rien ; recopier à la main des éléments qui existent dans une collection.',
  });

export const tarifsBloc = z
  .object({
    block: z.literal('tarifs'),
    ...optionsCommunes,
    ...entete,
    creation: z.boolean().default(true).describe('Afficher le bloc création (prix, engagement)'),
    options: z.boolean().default(true).describe('Afficher les options'),
    cta: cta.optional().describe('Bouton sous chaque formule (ex. vers le formulaire d\'audit)'),
  })
  .strict()
  .meta({
    role: 'Grille de prix : création (avec sélecteur de durée d\'engagement), formules mensuelles, options. Les prix viennent de data/tarifs.json.',
    quand: 'Page tarifs, ou en fin d\'accueil avant la FAQ. Modifier un prix : data/tarifs.json, jamais la page.',
    eviter: 'Site sans data/tarifs.json ; recopier des prix dans un autre bloc.',
  });

export const legal = z
  .object({
    block: z.literal('legal'),
    variant: z.enum(['mentions', 'confidentialite', 'accessibilite']).default('mentions'),
    ...optionsCommunes,
    ...entete,
    complement: markdown.max(2000).refine(sansH1, 'pas de titre de niveau 1 (#) dans le contenu').optional().describe('Texte ajouté à la fin (cas particuliers)'),
  })
  .strict()
  .meta({
    role: 'Mentions légales (éditeur, création, hébergeur, conditions d\'utilisation) ou politique de confidentialité, générées depuis data/site.json (champ legal).',
    quand: 'Pages /mentions-legales (variant mentions) et /confidentialite (variant confidentialite) : rien à rédiger, compléter data/site.json.',
    eviter: 'Recopier ces informations dans un bloc texte : elles ne seraient plus mises à jour.',
  });

export const carte = z
  .object({
    block: z.literal('carte'),
    variant: z.enum(['avec-texte', 'seule']).default('avec-texte').describe('avec-texte : texte et communes à côté de la carte · seule : la carte en pleine largeur'),
    ...optionsCommunes,
    ...entete,
    lieu: z.string().max(160).optional().describe('Adresse ou lieu à montrer (par défaut : adresse du site, rue si affichée, sinon la ville)'),
    zoom: z.number().int().min(5).max(18).optional().describe('Zoom de la carte interactive (10 : une vallée, 14 : un quartier)'),
    texte: markdown.max(1500).refine(sansH1, 'pas de titre de niveau 1 (#) dans le contenu').optional(),
    communes: z.boolean().default(true).describe('Afficher les communes desservies (data/site.json, villes)'),
  })
  .strict()
  .meta({
    role: "Carte au clic : aperçu léger sans Google, carte Google Maps chargée seulement si le visiteur clique, lien Itinéraire.",
    quand: "Page contact ou zone d'intervention, quand le client veut une carte. Lieu et communes viennent de data/site.json.",
    eviter: "Plus d'une carte par page ; une carte sur une page de service (le lien Itinéraire du contact suffit).",
  });

export const blocs = { hero, texte, 'texte-image': texteImage, features, galerie, slider, cta: ctaBloc, faq, chiffres, formulaire, boucle, tarifs: tarifsBloc, legal, carte } as const;
export type NomBloc = keyof typeof blocs;

export const section = z.discriminatedUnion('block', [hero, texte, texteImage, features, galerie, slider, ctaBloc, faq, chiffres, formulaire, boucle, tarifsBloc, legal, carte]);
export type Section = z.infer<typeof section>;
