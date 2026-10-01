# Modèle de site de mairie — Commune de Saint-Exemple (fictive)

Site statique Astro construit avec le système xmedia·ai, pour les communes : base de chaque nouveau site de mairie.
Saint-Exemple est une commune **fictive** : textes, noms et documents sont des exemples à remplacer.

| Collection | Contenu | Page |
| --- | --- | --- |
| `actualites` | nouvelles de la commune, par thème | `/actualites/<id>` |
| `agenda` | événements (seuls ceux à venir sont listés) | `/agenda/<id>` |
| `actes` | arrêtés, délibérations, procès-verbaux (PDF, date de mise en ligne et empreinte SHA-256 affichées) | `/actes/<id>` |
| `demarches` | démarches : pièces à fournir, lien vers la démarche en ligne | `/demarches/<id>` |
| `annuaire` | associations, commerces, santé, services | `/annuaire/<id>` |
| `documents` | bulletins, PLU, menus de cantine (PDF) | `/documents/<id>` |

- **Alerte** : `data/alerte.json` (bandeau en haut de toutes les pages, disparaît après sa date de fin). Éditeur : Réglages › Alerte.
- **Formulaires** (`data/formulaires.json`) : contact, signalement (services techniques), proposition d'événement. Les demandes arrivent dans l'espace client (modules `contact`, `signalement`, `proposition`).
- **Actes** : publiés par un administrateur uniquement (règle du relais de l'éditeur). La date de mise en ligne vient de l'historique Git : le déploiement clone le dépôt en entier.
- **Thèmes** (`categorie`) : `data/taxonomies.json`.

Commandes : `npm run dev`, `npm run validate`, `npm run build`. Hébergement : voir `DEPLOIEMENT.md`.
