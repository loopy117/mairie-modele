# Modèle de site de mairie — Commune de Saint-Exemple (fictive)

Site statique Astro construit avec le système xmedia·ai, pour les communes : base de chaque nouveau site de mairie.
Saint-Exemple est une commune **fictive** : textes, noms et documents sont des exemples à remplacer.

| Collection | Contenu | Page |
| --- | --- | --- |
| `actualites` | nouvelles de la commune, par thème | `/actualites/<id>` |
| `agenda` | événements (seuls ceux à venir sont listés) | `/agenda/<id>` |
| `actes` | arrêtés, délibérations, procès-verbaux (PDF, date de mise en ligne et empreinte SHA-256 affichées) | `/actes/<id>` |
| `demarches` | démarches : pièces à fournir, lien vers la démarche en ligne | `/demarches/<id>` |
| `annuaire` | acteurs locaux : associations, commerces, artisans, santé, services publics, producteurs (un annuaire par type) | `/annuaire/<id>` |
| `projets` | projets municipaux suivis dans le temps (étude, concertation, voté, travaux, terminé), budget, documents, localisation | `/projets/<id>` |
| `lieux` | lieux et équipements (mairie, école, salles, parkings, défibrillateurs…), GPS, horaires, accessibilité PMR | `/lieux/<id>` |
| `infos` | informations pratiques : déchets, eau, transports, école, santé, cimetière, urbanisme, urgences | `/infos-pratiques/<id>` |
| `documents` | bulletins, PLU, menus de cantine (PDF) | `/documents/<id>` |

- **Alerte** : `data/alerte.json` (bandeau en haut de toutes les pages, disparaît après sa date de fin). Éditeur : Réglages › Alerte.
- **Formulaires** (`data/formulaires.json`) : contact, signalement (services techniques), proposition d'événement. Les demandes arrivent dans l'espace client (modules `contact`, `signalement`, `proposition`).
- **Actes** : publiés par un administrateur uniquement (règle du relais de l'éditeur). La date de mise en ligne vient de l'historique Git : le déploiement clone le dépôt en entier.
- **Vues générées** (rien à saisir) : `/aujourdhui` (alerte, mairie ouverte ou fermée d'après `horaires_detail` de `data/site.json`, collectes du jour d'après `data/collectes.json`, agenda des 15 jours, travaux en cours, dernières publications) ; `/carte` (lieux et projets géolocalisés, liste accessible + carte IGN chargée à la demande) ; `/parcours/<slug>` (fiches de toutes les collections portant le tag `publics`, parcours définis dans `data/parcours.json`).
- **Recherche** (`/recherche`, lien dans l'en-tête) : Pagefind, index statique construit après le build (`scripts/recherche.mjs`) : texte complet des pages et des PDF (actes, documents, projets), filtres par type. Sans service extérieur ni cookie. Les listes de cartes et les pages de catégorie ne sont pas indexées (doublons).
- **Signalements** : suivi interne dans l'espace client, reçu → transmis au service → en cours → traité → clos (rien n'est publié).
- **Thèmes** (`categorie`) : `data/taxonomies.json`.

Commandes : `npm run dev`, `npm run validate`, `npm run build`. Hébergement : voir `DEPLOIEMENT.md`.
