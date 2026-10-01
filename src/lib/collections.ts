/**
 * Réglages de routage et d'affichage des collections (spec §5).
 * Partie « présentation » : l'IA ne modifie pas ce fichier.
 */
import type { NomCollection } from '../schemas/collections';

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
  };
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
    archive: { titre: 'Annuaire', intro: 'Associations, commerces, santé et services de la commune.', carte: 'annuaire-fiche', affichage: 'grid', options: { colonnes: 3 }, ordre: 'titre asc', parPage: 60, parCategorie: false },
  },
  documents: {
    base: '/documents', libelle: 'Documents', detail: true,
    archive: { titre: 'Documents', intro: 'Bulletins municipaux, documents d\'urbanisme, menus de la cantine…', carte: 'document-ligne', affichage: 'liste', ordre: 'date desc', parPage: 40, parCategorie: true },
  },
};
