import ActualiteCarte from './ActualiteCarte.astro';
import EvenementCarte from './EvenementCarte.astro';
import ActeLigne from './ActeLigne.astro';
import DemarcheCarte from './DemarcheCarte.astro';
import AnnuaireFiche from './AnnuaireFiche.astro';
import DocumentLigne from './DocumentLigne.astro';
import type { NomCarte } from './cartes';

export const composantsCartes: Record<NomCarte, any> = {
  'actualite-carte': ActualiteCarte,
  'evenement-carte': EvenementCarte,
  'acte-ligne': ActeLigne,
  'demarche-carte': DemarcheCarte,
  'annuaire-fiche': AnnuaireFiche,
  'document-ligne': DocumentLigne,
};
