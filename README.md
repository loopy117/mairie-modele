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
| `albums` | albums photo : photos avec texte alternatif et légende, visionneuse au clavier ; publication seulement si le droit à l'image est vérifié | `/albums/<id>` |
| `documents` | bulletins, PLU, menus de cantine (PDF) | `/documents/<id>` |

- **Alerte** : `data/alerte.json` (bandeau en haut de toutes les pages, disparaît après sa date de fin). Éditeur : Réglages › Alerte.
- **Formulaires** (`data/formulaires.json`) : contact, signalement (services techniques), proposition d'événement. Les demandes arrivent dans l'espace client (modules `contact`, `signalement`, `proposition`).
- **Actes** : publiés par un administrateur uniquement (règle du relais de l'éditeur). La date de mise en ligne vient de l'historique Git : le déploiement clone le dépôt en entier.
- **Vues générées** (rien à saisir) : `/aujourdhui` (alerte, mairie ouverte ou fermée d'après `horaires_detail` de `data/site.json`, collectes du jour d'après `data/collectes.json`, agenda des 15 jours, travaux en cours, dernières publications) ; `/carte` (lieux et projets géolocalisés, liste accessible + carte IGN chargée à la demande) ; `/parcours/<slug>` (fiches de toutes les collections portant le tag `publics`, parcours définis dans `data/parcours.json`).
- **Recherche** (`/recherche`, lien dans l'en-tête) : Pagefind, index statique construit après le build (`scripts/recherche.mjs`) : texte complet des pages et des PDF (actes, documents, projets), filtres par type. Sans service extérieur ni cookie. Les listes de cartes et les pages de catégorie ne sont pas indexées (doublons).
- **Photos** : réduites à l'envoi par le serveur (3200 px, redressées, sans EXIF ni GPS) et par `npm run import-media` ; la validation signale les originaux de plus de 3 Mo. Images optimisées gardées en cache entre deux déploiements (`.cache/astro`).
- **Photothèque de l'éditeur** : chaque champ image a un bouton « Choisir dans la photothèque » (`public/admin/phototheque.js`) qui montre toutes les images publiées, avec où elles sont utilisées ; recherche et filtre ; un clic reprend la photo et son texte alternatif, sans la dupliquer. Index et vignettes générés au build (`scripts/phototheque.mjs` → `dist/admin/phototheque.json`).
- **Sujets (mots-clés)** : liste gérée par la mairie (`data/sujets.json`, Réglages › Sujets) ; pages et fiches en portent plusieurs (`sujets`), affichés en pastilles ; une page par sujet (`/sujets/<id>`) rassemble tout, classé par type ; filtre « sujet » dans la recherche. Les pages ont aussi `publics` (parcours).
- **Carte** (`/carte`) : Leaflet et fonds IGN de la Géoplateforme (plan, photo aérienne, cadastre ; sans clé ni cookie, chargés à la demande), filtres par type avec pastilles de couleur, liste accessible. Dans l'éditeur, champ « Position » : recherche de l'adresse (géocodage IGN, Base Adresse Nationale) et mini-carte où l'on clique ou fait glisser le point (`public/admin/position.js`).
- **Diffusion et lettre d'information** : chaque page ou publication a « Diffuser sur… » (Facebook, Instagram, LinkedIn) et « Ajouter à la lettre d'information ». Au build, `scripts/diffusion.ts` écrit `dist/admin/diffusion.json` ; l'espace client prépare un message par réseau (relu et publié par la mairie, rien n'est automatique) et compose la lettre (aperçu, essai, envoi par Brevo). Inscription : bloc `lettre` (page `/lettre-d-information`, double opt-in, fonctionne sans JavaScript). Mise en place côté serveur : `sudo xm-site lettre <nom>` (voir LISEZMOI du serveur).
- **Signalements** : suivi interne dans l'espace client, reçu → transmis au service → en cours → traité → clos (rien n'est publié).
- **Thèmes** (`categorie`) : `data/taxonomies.json`.

Commandes : `npm run dev`, `npm run validate`, `npm run build`. Hébergement : voir `DEPLOIEMENT.md`.
