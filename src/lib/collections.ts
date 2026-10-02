/**
 * Réglages de routage et d'affichage des collections (spec §5).
 * Partie « présentation » : l'IA ne modifie pas ce fichier.
 */
import { TYPES_ANNUAIRE, AVANCEMENTS, TYPES_LIEUX, THEMES_INFOS, type NomCollection } from '../schemas/collections';
import taxonomies from '../../data/taxonomies.json' with { type: 'json' };

export interface ReglagesCollection {
  base: string;               // préfixe d'URL
  libelle: string;            // nom affiché (menu, fil d'Ariane, archive)
  detail: boolean;            // une page par élément
  archive?: {
    titre: string;
    intro?: string;
    carte: string;
    affichage: 'grid' | 'slider' | 'liste' | 'masonry' | 'flux';
    options?: Record<string, unknown>;
    ordre: string | string[];
    filtre?: Record<string, unknown>;   // ex. agenda : seulement les événements à venir
    parPage: number;
    parCategorie: boolean;    // pages /<base>/categorie/<slug>
    regrouperPar?: { champ: string; libelles: Record<string, string>; titre: string };   // défaut : thème (categorie)
  };
}

/** Champ et libellés des pages de catégorie d'une archive (thème par défaut, ou type, avancement…). */
export function categoriesArchive(nom: NomCollection): { champ: string; libelles: Record<string, string>; titre: string } {
  return reglages[nom].archive?.regrouperPar ?? { champ: 'categorie', libelles: taxonomies.metiers as Record<string, string>, titre: 'Filtrer par thème' };
}

export const reglages: Record<NomCollection, ReglagesCollection> = {
  actualites: {
    base: '/actualites', libelle: 'Actualités', detail: true,
    archive: { titre: 'Actualités', intro: 'Les nouvelles de la commune : travaux, vie municipale, écoles, associations.', carte: 'actualite-carte', affichage: 'grid', options: { colonnes: 3 }, ordre: 'date desc', parPage: 12, parCategorie: true },
  },
  agenda: {
    base: '/agenda', libelle: 'Agenda', detail: true,
    archive: { titre: 'Agenda', intro: 'Les prochains rendez-vous de la commune et des associations.', carte: 'evenement-carte', affichage: 'liste', ordre: 'date asc', filtre: { date_fin_ou_date: { apres: 'aujourdhui' } }, parPage: 30, parCategorie: false },
  },
  actes: {
    base: '/actes', libelle: 'Actes officiels', detail: true,
    archive: { titre: 'Actes officiels', intro: 'Arrêtés, délibérations et procès-verbaux du conseil municipal, publiés sous forme électronique.', carte: 'acte-ligne', affichage: 'liste', ordre: 'date desc', parPage: 40, parCategorie: false },
  },
  demarches: {
    base: '/demarches', libelle: 'Démarches', detail: true,
    archive: { titre: 'Vos démarches', intro: 'État civil, urbanisme, élections : où s\'adresser et quelles pièces fournir.', carte: 'demarche-carte', affichage: 'grid', options: { colonnes: 3 }, ordre: ['ordre asc', 'titre asc'], parPage: 60, parCategorie: true },
  },
  annuaire: {
    base: '/annuaire', libelle: 'Annuaire', detail: true,
    archive: { titre: 'Annuaire', intro: 'Associations, commerces, artisans, santé, producteurs et services de la commune.', carte: 'annuaire-fiche', affichage: 'grid', options: { colonnes: 3 }, ordre: 'titre asc', parPage: 60, parCategorie: true, regrouperPar: { champ: 'type', libelles: TYPES_ANNUAIRE, titre: 'Choisir un annuaire' } },
  },
  projets: {
    base: '/projets', libelle: 'Projets', detail: true,
    archive: { titre: 'Projets de la commune', intro: 'Les projets municipaux, de l\'étude à la fin des travaux : où ils en sont, ce qu\'ils coûtent, les documents.', carte: 'projet-carte', affichage: 'grid', options: { colonnes: 2 }, ordre: ['date desc'], parPage: 30, parCategorie: true, regrouperPar: { champ: 'avancement', libelles: AVANCEMENTS, titre: 'Filtrer par avancement' } },
  },
  lieux: {
    base: '/lieux', libelle: 'Lieux et équipements', detail: true,
    archive: { titre: 'Lieux et équipements', intro: 'Salles, écoles, équipements sportifs, parkings, défibrillateurs : adresses, horaires et accessibilité.', carte: 'lieu-fiche', affichage: 'grid', options: { colonnes: 3 }, ordre: 'titre asc', parPage: 80, parCategorie: true, regrouperPar: { champ: 'type', libelles: TYPES_LIEUX, titre: 'Filtrer par type' } },
  },
  albums: {
    base: '/albums', libelle: 'Albums photo', detail: true,
    archive: { titre: 'Albums photo', intro: 'Les fêtes, cérémonies et grands moments de la commune en images.', carte: 'album-carte', affichage: 'grid', options: { colonnes: 3 }, ordre: 'date desc', parPage: 12, parCategorie: false },
  },
  infos: {
    base: '/infos-pratiques', libelle: 'Infos pratiques', detail: true,
    archive: { titre: 'Infos pratiques', intro: 'Déchets, eau, transports, école, santé : comment fonctionne la commune au quotidien.', carte: 'info-carte', affichage: 'grid', options: { colonnes: 3 }, ordre: ['ordre asc', 'titre asc'], parPage: 60, parCategorie: true, regrouperPar: { champ: 'theme', libelles: THEMES_INFOS, titre: 'Filtrer par thème' } },
  },
  documents: {
    base: '/documents', libelle: 'Documents', detail: true,
    archive: { titre: 'Documents', intro: 'Bulletins municipaux, documents d\'urbanisme, menus de la cantine…', carte: 'document-ligne', affichage: 'liste', ordre: 'date desc', parPage: 40, parCategorie: true },
  },
};
