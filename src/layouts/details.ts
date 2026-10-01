/**
 * Gabarits de détail des collections, écrits comme des compositions de
 * sections (spec §5). Les boucles « similaires » utilisent $courant.
 * Les informations pratiques (date, lieu, document, pièces à fournir…) sont
 * affichées par components/FicheInfos.astro, entre l'en-tête et le texte.
 * Partie présentation : l'IA ne modifie pas ce fichier.
 */
import taxonomies from '../../data/taxonomies.json';
import { TYPES_ACTES, TYPES_ANNUAIRE, AVANCEMENTS, TYPES_LIEUX, THEMES_INFOS, type NomCollection } from '../schemas/collections';

const dateFr = (d?: Date) => (d ? new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d)) : undefined);

/** Sections placées avant le corps Markdown, et après. */
export function gabaritDetail(collection: NomCollection, e: { id: string; data: any }): { avant: any[]; apres: any[] } {
  const d = e.data;
  const theme = (taxonomies.metiers as Record<string, string>)[d.categorie];
  const hero = (surtitre?: string) => ({ block: 'hero', variant: d.image ? 'split' : 'minimal', surtitre, titre: d.titre, texte: d.resume, image: d.image });
  switch (collection) {
    case 'actualites':
      return {
        avant: [hero([dateFr(d.date), theme].filter(Boolean).join(' · '))],
        apres: [{ block: 'boucle', background: 'alt', titre: 'À lire aussi', source: 'actualites', filtre: { categorie: '$courant.categorie' }, exclure: ['$courant.id'], ordre: 'date desc', nombre: 3, carte: 'actualite-carte', affichage: 'grid', lien_tout_voir: { label: 'Toutes les actualités', href: '/actualites' } }],
      };
    case 'agenda':
      return {
        avant: [hero('Agenda')],
        apres: [{ block: 'boucle', background: 'alt', titre: 'Les prochains rendez-vous', source: 'agenda', filtre: { date_fin_ou_date: { apres: 'aujourdhui' } }, exclure: ['$courant.id'], ordre: 'date asc', nombre: 4, carte: 'evenement-carte', affichage: 'liste', lien_tout_voir: { label: 'Tout l\'agenda', href: '/agenda' } }],
      };
    case 'actes':
      return {
        avant: [hero([(TYPES_ACTES as Record<string, string>)[d.type], d.numero && `n° ${d.numero}`].filter(Boolean).join(' '))],
        apres: [{ block: 'boucle', background: 'alt', titre: 'Autres actes de même nature', source: 'actes', filtre: { type: '$courant.type' }, exclure: ['$courant.id'], ordre: 'date desc', nombre: 5, carte: 'acte-ligne', affichage: 'liste', lien_tout_voir: { label: 'Tous les actes', href: '/actes' } }],
      };
    case 'demarches':
      return {
        avant: [hero(theme ?? 'Démarches')],
        apres: [{ block: 'boucle', background: 'alt', titre: 'Démarches proches', source: 'demarches', filtre: { categorie: '$courant.categorie' }, exclure: ['$courant.id'], ordre: ['ordre asc', 'titre asc'], nombre: 3, carte: 'demarche-carte', affichage: 'grid' }],
      };
    case 'annuaire':
      return {
        avant: [hero((TYPES_ANNUAIRE as Record<string, string>)[d.type])],
        apres: [{ block: 'boucle', background: 'alt', titre: 'Dans la même catégorie', source: 'annuaire', filtre: { type: '$courant.type' }, exclure: ['$courant.id'], ordre: 'titre asc', nombre: 3, carte: 'annuaire-fiche', affichage: 'grid', lien_tout_voir: { label: 'Tout l\'annuaire', href: '/annuaire' } }],
      };
    case 'documents':
      return {
        avant: [hero([dateFr(d.date), theme].filter(Boolean).join(' · '))],
        apres: [{ block: 'boucle', background: 'alt', titre: 'Autres documents', source: 'documents', filtre: { categorie: '$courant.categorie' }, exclure: ['$courant.id'], ordre: 'date desc', nombre: 5, carte: 'document-ligne', affichage: 'liste', lien_tout_voir: { label: 'Tous les documents', href: '/documents' } }],
      };
    case 'projets':
      return {
        avant: [hero(`Projet · ${(AVANCEMENTS as Record<string, string>)[d.avancement]}`)],
        apres: [
          ...(d.galerie?.length >= 2 ? [{ block: 'galerie', variant: 'mosaique', titre: 'En images', images: d.galerie }] : []),
          { block: 'boucle', background: 'alt', titre: 'Les autres projets', source: 'projets', exclure: ['$courant.id'], ordre: 'date desc', nombre: 4, carte: 'projet-carte', affichage: 'grid', options: { colonnes: 2 }, lien_tout_voir: { label: 'Tous les projets', href: '/projets' } },
        ],
      };
    case 'lieux':
      return {
        avant: [hero((TYPES_LIEUX as Record<string, string>)[d.type])],
        apres: [{ block: 'boucle', background: 'alt', titre: 'Dans la même catégorie', source: 'lieux', filtre: { type: '$courant.type' }, exclure: ['$courant.id'], ordre: 'titre asc', nombre: 3, carte: 'lieu-fiche', affichage: 'grid' }],
      };
    case 'infos':
      return {
        avant: [hero((THEMES_INFOS as Record<string, string>)[d.theme])],
        apres: [{ block: 'boucle', background: 'alt', titre: 'Autres infos pratiques', source: 'infos', exclure: ['$courant.id'], ordre: ['ordre asc', 'titre asc'], nombre: 3, carte: 'info-carte', affichage: 'grid', lien_tout_voir: { label: 'Toutes les infos pratiques', href: '/infos-pratiques' } }],
      };
  }
}
