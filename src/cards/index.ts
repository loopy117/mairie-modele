import ActualiteCarte from './ActualiteCarte.astro';
import EvenementCarte from './EvenementCarte.astro';
import ActeLigne from './ActeLigne.astro';
import DemarcheCarte from './DemarcheCarte.astro';
import AnnuaireFiche from './AnnuaireFiche.astro';
import DocumentLigne from './DocumentLigne.astro';
import ProjetCarte from './ProjetCarte.astro';
import LieuFiche from './LieuFiche.astro';
import InfoCarte from './InfoCarte.astro';
import type { NomCarte } from './cartes';

export const composantsCartes: Record<NomCarte, any> = {
  'actualite-carte': ActualiteCarte,
  'evenement-carte': EvenementCarte,
  'acte-ligne': ActeLigne,
  'demarche-carte': DemarcheCarte,
  'annuaire-fiche': AnnuaireFiche,
  'document-ligne': DocumentLigne,
  'projet-carte': ProjetCarte,
  'lieu-fiche': LieuFiche,
  'info-carte': InfoCarte,
};
