/** Registre des cartes : quelle carte sait afficher quelle collection (spec §3). */
import type { NomCollection } from '../schemas/collections';

export const cartes = {
  'actualite-carte': { collection: 'actualites', description: 'Image, date et thème, titre, résumé.' },
  'evenement-carte': { collection: 'agenda', description: 'Pastille de date, titre, jour, horaire et lieu. Avec la disposition « liste ».' },
  'acte-ligne': { collection: 'actes', description: 'Nature, numéro et date de l\'acte, titre, lien vers le PDF. Avec la disposition « liste ».' },
  'demarche-carte': { collection: 'demarches', description: 'Titre, résumé, lien vers la démarche.' },
  'annuaire-fiche': { collection: 'annuaire', description: 'Catégorie, nom, résumé, téléphone et e-mail.' },
  'document-ligne': { collection: 'documents', description: 'Titre, date, thème et bouton de téléchargement. Avec la disposition « liste ».' },
  'projet-carte': { collection: 'projets', description: 'Image, titre, résumé, frise d\'avancement, lieu et budget.' },
  'lieu-fiche': { collection: 'lieux', description: 'Type, nom, adresse, accessibilité PMR.' },
  'album-carte': { collection: 'albums', description: 'Photo de couverture, titre, date, nombre de photos.' },
  'info-carte': { collection: 'infos', description: 'Thème, titre, résumé.' },
} as const satisfies Record<string, { collection: NomCollection; description: string }>;

export type NomCarte = keyof typeof cartes;
export const nomsCartes = Object.keys(cartes) as NomCarte[];
