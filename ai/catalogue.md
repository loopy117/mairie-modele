# Catalogue du site — pour l'IA

> Généré par `npm run catalogue` à partir des schémas. Ne pas modifier à la main.
> À lire avec `ai/regles.md`. Tout ce qui n'est pas dans ce catalogue n'existe pas.

## Options communes à tous les blocs

| Option | Valeurs | Défaut |
| --- | --- | --- |
| `background` | `clair` · `alt` · `sombre` · `accent` | `clair` |
| `spacing` | `compact` · `normal` · `large` | `normal` |
| `id` | ancre HTML (minuscules, chiffres, tirets) | aucune |

**Types partagés** — image : `{ src: /img/<dossier>/<nom>.jpg, alt, focus?: centre|haut|bas|gauche|droite }` · bouton (cta) : `{ label, href, style: primaire|secondaire }` · lien : `{ label, href }`.

**Icônes disponibles** : `eclair`, `maison`, `flocon`, `soleil`, `telephone`, `bouclier`, `horloge`, `euro`, `outil`, `check`, `tendance`, `crayon`, `filtre`, `colonnes`, `etoile`, `telechargement`, `graphique`, `repere`, `plus`.

## Blocs

### `hero`

Ouverture de page, message principal.

- **Variantes** : `plein-ecran` · `split` · `minimal` (défaut `plein-ecran`)
- **Quand l'utiliser** : Toujours en première section, un seul par page. plein-ecran : accueil et pages de service avec une belle photo. split : photo moins forte ou texte plus long. minimal : pages utilitaires (contact, mentions).
- **À éviter** : Titre générique (« Bienvenue ») ; plus de deux boutons.

| Champ | Obligatoire | Type | Limites et notes |
| --- | --- | --- | --- |
| `surtitre` | non | texte | ≤ 40 car. — Pastille au-dessus du titre (ex. « Artisan installateur · Pertuis ») |
| `titre` | oui | texte | ≥ 10 car., ≤ 70 car. — Titre principal de la page (H1) |
| `texte` | non | texte | ≤ 220 car. |
| `image` | non | { src: texte, alt: texte, focus?: `centre` · `haut` · `bas` · `gauche` · `droite` } | Obligatoire sauf variante minimal (ou illustration en variante split) |
| `illustration` | non | { nom: `pagespeed`, score_mobile?: entier, score_ordinateur?: entier, date?: texte, legende?: texte } | Variante split : illustration codée à la place de la photo |
| `ctas` | non | liste de { label: texte, href: texte, style?: `primaire` · `secondaire` } | ≤ 2 éléments |
| `points` | non | liste de texte | ≤ 4 éléments — Garanties courtes affichées sous les boutons |

### `texte`

Contenu rédactionnel libre en Markdown.

- **Variantes** : `standard` · `etroit` · `deux-colonnes` (défaut `etroit`)
- **Quand l'utiliser** : Explications détaillées, mentions légales, contenus longs. etroit pour la lecture, deux-colonnes pour un texte long découpé.
- **À éviter** : Plus de deux blocs texte à la suite : alterner avec texte-image ou features.

| Champ | Obligatoire | Type | Limites et notes |
| --- | --- | --- | --- |
| `surtitre` | non | texte | ≤ 40 car. — Petit texte en capitales au-dessus du titre |
| `titre` | non | texte | ≤ 110 car. — Titre de section (H2) |
| `intro` | non | texte | ≤ 300 car. |
| `contenu` | oui | texte | ≤ 4000 car. — Markdown : paragraphes, listes, gras, liens, titres ## et ### (jamais #) |

### `texte-image`

Explication illustrée : un texte ou des arguments à côté d'une ou trois images.

- **Variantes** : `image-droite` · `image-gauche` · `visuel-dessous` (défaut `image-droite`)
- **Quand l'utiliser** : Présenter l'entreprise, un argument, une méthode. 3 images = mosaïque (portrait d'équipe + deux détails).
- **À éviter** : Deux texte-image consécutifs du même côté : alterner image-droite / image-gauche.

| Champ | Obligatoire | Type | Limites et notes |
| --- | --- | --- | --- |
| `surtitre` | non | texte | ≤ 40 car. — Petit texte en capitales au-dessus du titre |
| `titre` | oui | texte | ≤ 90 car. |
| `contenu` | non | texte | ≤ 1200 car. — Markdown : paragraphes, listes, gras, liens, titres ## et ### (jamais #) |
| `citation` | non | oui/non | défaut : false — Contenu affiché comme une citation (police de titre, plus grand) |
| `points` | non | liste de { icone?: `eclair` · `maison` · `flocon` · `soleil` · `telephone` · `bouclier` · `horloge` · `euro` · `outil` · `check` · `tendance` · `crayon` · `filtre` · `colonnes` · `etoile` · `telechargement` · `graphique` · `repere` · `plus`, titre?: texte, texte?: texte } | ≤ 5 éléments — Arguments courts |
| `points_style` | non | `traits` · `icones` · `encarts` | défaut : "traits" — traits : trait de couleur · icones : icône devant le texte · encarts : petites cartes (2 colonnes) |
| `signature` | non | { nom?: texte, role: texte } | Sous une citation : nom et fonction |
| `images` | non | liste de { src: texte, alt: texte, focus?: `centre` · `haut` · `bas` · `gauche` · `droite` } | ≤ 3 éléments — 1 image, ou 3 pour une mosaïque (la 1re en hauteur) |
| `illustration` | non | { nom: `pagespeed`, score_mobile?: entier, score_ordinateur?: entier, date?: texte, legende?: texte } | Illustration codée à la place des images |
| `lien` | non | { label: texte, href: texte } |  |

### `features`

Points forts, garanties, étapes d'un processus.

- **Variantes** : `grille-icones` · `liste` · `etapes-numerotees` · `comparatif` · `paires` (défaut `grille-icones`)
- **Quand l'utiliser** : grille-icones : 3 à 6 avantages. etapes-numerotees : un déroulé (devis, pose, mise en service). liste : points plus longs.
- **À éviter** : Items sans texte en variante liste ; plus de 8 items.

| Champ | Obligatoire | Type | Limites et notes |
| --- | --- | --- | --- |
| `surtitre` | non | texte | ≤ 40 car. — Petit texte en capitales au-dessus du titre |
| `titre` | non | texte | ≤ 110 car. — Titre de section (H2) |
| `intro` | non | texte | ≤ 300 car. |
| `items` | oui | liste de { icone?: `eclair` · `maison` · `flocon` · `soleil` · `telephone` · `bouclier` · `horloge` · `euro` · `outil` · `check` · `tendance` · `crayon` · `filtre` · `colonnes` · `etoile` · `telechargement` · `graphique` · `repere` · `plus`, titre: texte, texte?: texte, lien?: { label: texte, href: texte }, mis_en_avant?: oui/non, badge?: texte } | ≥ 2 éléments, ≤ 8 éléments |
| `illustration` | non | { nom: `pagespeed`, score_mobile?: entier, score_ordinateur?: entier, date?: texte, legende?: texte } | Illustration codée en première case de la grille (ex. pagespeed) |

### `galerie`

Ensemble d'images.

- **Variantes** : `grille` · `mosaique` · `carrousel` (défaut `grille`)
- **Quand l'utiliser** : Photos d'un chantier ou d'une réalisation. mosaique pour 5+ images de formats variés, carrousel pour une page déjà longue.
- **À éviter** : Galerie de 2 images : préférer texte-image.

| Champ | Obligatoire | Type | Limites et notes |
| --- | --- | --- | --- |
| `surtitre` | non | texte | ≤ 40 car. — Petit texte en capitales au-dessus du titre |
| `titre` | non | texte | ≤ 110 car. — Titre de section (H2) |
| `intro` | non | texte | ≤ 300 car. |
| `images` | oui | liste de { src: texte, alt: texte, focus?: `centre` · `haut` · `bas` · `gauche` · `droite` } | ≥ 2 éléments, ≤ 24 éléments |

### `slider`

Défilement d'images légendées (scroll horizontal, sans JavaScript).

- **Variantes** : `plein-large` · `contenu` (défaut `contenu`)
- **Quand l'utiliser** : Montrer plusieurs visuels forts avec une légende chacun.
- **À éviter** : Messages importants cachés dans les slides suivantes.

| Champ | Obligatoire | Type | Limites et notes |
| --- | --- | --- | --- |
| `surtitre` | non | texte | ≤ 40 car. — Petit texte en capitales au-dessus du titre |
| `titre` | non | texte | ≤ 110 car. — Titre de section (H2) |
| `intro` | non | texte | ≤ 300 car. |
| `slides` | oui | liste de { image: { src: texte, alt: texte, focus?: `centre` · `haut` · `bas` · `gauche` · `droite` }, titre?: texte, texte?: texte, cta?: { label: texte, href: texte, style?: `primaire` · `secondaire` } } | ≥ 2 éléments, ≤ 6 éléments |

### `cta`

Appel à l'action.

- **Variantes** : `bandeau` · `carte` · `split-image` (défaut `carte`)
- **Quand l'utiliser** : carte (encadré vert) en fin de page de conversion. bandeau (pleine largeur, souvent fond sombre) pour un message court en milieu de page (urgence, téléphone).
- **À éviter** : Plus de deux cta par page.

| Champ | Obligatoire | Type | Limites et notes |
| --- | --- | --- | --- |
| `icone` | non | `eclair` · `maison` · `flocon` · `soleil` · `telephone` · `bouclier` · `horloge` · `euro` · `outil` · `check` · `tendance` · `crayon` · `filtre` · `colonnes` · `etoile` · `telechargement` · `graphique` · `repere` · `plus` | Pastille d'icône (variante bandeau) |
| `titre` | oui | texte | ≤ 80 car. |
| `texte` | non | texte | ≤ 220 car. |
| `ctas` | oui | liste de { label: texte, href: texte, style?: `primaire` · `secondaire` } | ≥ 1 éléments, ≤ 2 éléments |
| `note` | non | texte | ≤ 80 car. — Ligne discrète sous les boutons (ex. « ou appelez le … ») |
| `image` | non | { src: texte, alt: texte, focus?: `centre` · `haut` · `bas` · `gauche` · `droite` } | Obligatoire pour split-image |

### `faq`

Questions-réponses (balisage FAQPage automatique).

- **Variantes** : `accordeon` · `deux-colonnes` · `titre-gauche` (défaut `accordeon`)
- **Quand l'utiliser** : Lever les objections avant la prise de contact : prix, délais, aides, entretien.
- **À éviter** : Réponses inventées (prix, délais) : utiliser [À COMPLÉTER : …].

| Champ | Obligatoire | Type | Limites et notes |
| --- | --- | --- | --- |
| `surtitre` | non | texte | ≤ 40 car. — Petit texte en capitales au-dessus du titre |
| `titre` | non | texte | ≤ 110 car. — Titre de section (H2) |
| `intro` | non | texte | ≤ 300 car. |
| `items` | oui | liste de { question: texte, reponse: texte } | ≥ 3 éléments, ≤ 15 éléments |

### `chiffres`

Statistiques clés.

- **Variantes** : `ligne` · `cartes` (défaut `ligne`)
- **Quand l'utiliser** : Uniquement avec des chiffres fournis par le client ou présents sur le site.
- **À éviter** : Tout chiffre inventé ou arrondi « pour faire bien ».

| Champ | Obligatoire | Type | Limites et notes |
| --- | --- | --- | --- |
| `surtitre` | non | texte | ≤ 40 car. — Petit texte en capitales au-dessus du titre |
| `titre` | non | texte | ≤ 110 car. — Titre de section (H2) |
| `intro` | non | texte | ≤ 300 car. |
| `items` | oui | liste de { valeur: texte, libelle: texte, source?: texte } | ≥ 2 éléments, ≤ 4 éléments |

### `formulaire`

Formulaire de contact ou de demande de devis. Avec « formulaire » (data/formulaires.json) : formulaire métier en deux étapes (la seconde facultative, photos comprises), demandes qualifiées et suivies dans l'espace client. Sans : formulaire simple envoyé par e-mail.

- **Variantes** : `avec-coordonnees` · `simple` · `carte` (défaut `avec-coordonnees`)
- **Quand l'utiliser** : Page contact, et en fin de page de service à fort enjeu (avec un sujet précis). avec-coordonnees : formulaire + téléphone, e-mail, horaires à côté. simple : formulaire seul.
- **À éviter** : Plus d'un formulaire par page ; des champs obligatoires inutiles (chaque champ en trop fait perdre des demandes).

| Champ | Obligatoire | Type | Limites et notes |
| --- | --- | --- | --- |
| `surtitre` | non | texte | ≤ 40 car. — Petit texte en capitales au-dessus du titre |
| `titre` | non | texte | ≤ 110 car. — Titre de section (H2) |
| `intro` | non | texte | ≤ 300 car. |
| `note` | non | texte | ≤ 120 car. — Ligne sous le bouton (ex. « Sans engagement. ») |
| `champs` | non | liste de `nom` · `email` · `telephone` · `commune` · `service` · `message` | ≥ 3 éléments, défaut : ["nom","email","telephone","commune","service","message"] — Champs affichés, dans cet ordre |
| `obligatoires` | non | liste de `nom` · `email` · `telephone` · `commune` · `service` · `message` | défaut : ["nom","message"] — Champs obligatoires (message toujours obligatoire) |
| `sujet` | non | texte | ≤ 60 car., défaut : "Demande depuis le site" — Objet de l'e-mail reçu (ex. « Demande de devis PAC piscine ») |
| `bouton` | non | texte | ≤ 40 car., défaut : "Envoyer ma demande" |
| `formulaire` | non | texte | Formulaire métier de data/formulaires.json (ex. devis) : remplace champs et obligatoires, les demandes arrivent qualifiées dans l'espace client |

### `boucle`

Affiche des éléments d'une collection selon une requête, avec une carte et une disposition.

- **Quand l'utiliser** : Dès qu'on montre des services, réalisations, zones… Les éléments ajoutés plus tard apparaissent automatiquement.
- **À éviter** : Une boucle dont le filtre ne renvoie rien ; recopier à la main des éléments qui existent dans une collection.

| Champ | Obligatoire | Type | Limites et notes |
| --- | --- | --- | --- |
| `surtitre` | non | texte | ≤ 40 car. — Petit texte en capitales au-dessus du titre |
| `titre` | non | texte | ≤ 110 car. — Titre de section (H2) |
| `intro` | non | texte | ≤ 300 car. |
| `lien_tout_voir` | non | { label: texte, href: texte } |  |
| `source` | oui | `services` · `realisations` · `zones` |  |
| `filtre` | non | objet | Conditions cumulées (ET) |
| `exclure` | non | liste de texte |  |
| `elements` | non | liste de texte | Sélection manuelle : remplace filtre, ordre et nombre |
| `ordre` | non | texte ou liste de texte | défaut : "date desc" |
| `nombre` | non | entier | ≥ 1, ≤ 24, défaut : 6 |
| `decalage` | non | entier | ≥ 0, défaut : 0 |
| `carte` | oui | `service-carte` · `realisation-carte` · `zone-pastille` |  |
| `affichage` | non | `grid` · `slider` · `liste` · `masonry` · `flux` | défaut : "grid" |
| `options` | non | objet |  |
| `si_vide` | non | `masquer` · `message` | défaut : "masquer" |
| `message_vide` | non | texte | ≤ 120 car. |

### `tarifs`

Grille de prix : création (avec sélecteur de durée d'engagement), formules mensuelles, options. Les prix viennent de data/tarifs.json.

- **Quand l'utiliser** : Page tarifs, ou en fin d'accueil avant la FAQ. Modifier un prix : data/tarifs.json, jamais la page.
- **À éviter** : Site sans data/tarifs.json ; recopier des prix dans un autre bloc.

| Champ | Obligatoire | Type | Limites et notes |
| --- | --- | --- | --- |
| `surtitre` | non | texte | ≤ 40 car. — Petit texte en capitales au-dessus du titre |
| `titre` | non | texte | ≤ 110 car. — Titre de section (H2) |
| `intro` | non | texte | ≤ 300 car. |
| `creation` | non | oui/non | défaut : true — Afficher le bloc création (prix, engagement) |
| `options` | non | oui/non | défaut : true — Afficher les options |
| `cta` | non | { label: texte, href: texte, style?: `primaire` · `secondaire` } | Bouton sous chaque formule (ex. vers le formulaire d'audit) |

### `legal`

Mentions légales (éditeur, création, hébergeur, conditions d'utilisation) ou politique de confidentialité, générées depuis data/site.json (champ legal).

- **Variantes** : `mentions` · `confidentialite` · `accessibilite` (défaut `mentions`)
- **Quand l'utiliser** : Pages /mentions-legales (variant mentions) et /confidentialite (variant confidentialite) : rien à rédiger, compléter data/site.json.
- **À éviter** : Recopier ces informations dans un bloc texte : elles ne seraient plus mises à jour.

| Champ | Obligatoire | Type | Limites et notes |
| --- | --- | --- | --- |
| `surtitre` | non | texte | ≤ 40 car. — Petit texte en capitales au-dessus du titre |
| `titre` | non | texte | ≤ 110 car. — Titre de section (H2) |
| `intro` | non | texte | ≤ 300 car. |
| `complement` | non | texte | ≤ 2000 car. — Texte ajouté à la fin (cas particuliers) |

### `carte`

Carte au clic : aperçu léger sans Google, carte Google Maps chargée seulement si le visiteur clique, lien Itinéraire.

- **Variantes** : `avec-texte` · `seule` (défaut `avec-texte`)
- **Quand l'utiliser** : Page contact ou zone d'intervention, quand le client veut une carte. Lieu et communes viennent de data/site.json.
- **À éviter** : Plus d'une carte par page ; une carte sur une page de service (le lien Itinéraire du contact suffit).

| Champ | Obligatoire | Type | Limites et notes |
| --- | --- | --- | --- |
| `surtitre` | non | texte | ≤ 40 car. — Petit texte en capitales au-dessus du titre |
| `titre` | non | texte | ≤ 110 car. — Titre de section (H2) |
| `intro` | non | texte | ≤ 300 car. |
| `lieu` | non | texte | ≤ 160 car. — Adresse ou lieu à montrer (par défaut : adresse du site, rue si affichée, sinon la ville) |
| `zoom` | non | entier | ≥ 5, ≤ 18 — Zoom de la carte interactive (10 : une vallée, 14 : un quartier) |
| `texte` | non | texte | ≤ 1500 car. — Markdown : paragraphes, listes, gras, liens, titres ## et ### (jamais #) |
| `communes` | non | oui/non | défaut : true — Afficher les communes desservies (data/site.json, villes) |

## Boucle : cartes, dispositions, requêtes

### Cartes

| Carte | Collection | Rendu |
| --- | --- | --- |
| `service-carte` | `services` | Grande carte : image, trait de couleur du métier, titre, résumé, prestations, lien. |
| `realisation-carte` | `realisations` | Image, commune en surtitre, titre du chantier. |
| `zone-pastille` | `zones` | Pastille cliquable colorée selon le métier. À utiliser avec la disposition « flux ». |

### Dispositions (`affichage`) et leurs `options`

| Disposition | Options | Rendu |
| --- | --- | --- |
| `grid` | `colonnes` (entier, 2–4, défaut 3) | Grille responsive (cas général). |
| `slider` | `visibles` (entier, 1–4, défaut 3) | Défilement horizontal (scroll-snap, sans JavaScript). |
| `liste` | `separateurs` (oui/non, défaut true) | Liste verticale. |
| `masonry` | `colonnes` (entier, 2–4, défaut 3) | Colonnes à hauteurs variables. |
| `flux` | — | Éléments en ligne qui passent à la ligne (pastilles, étiquettes). |

### Opérateurs de `filtre` (conditions cumulées)

| Écriture | Sens |
| --- | --- |
| `champ: valeur` | égal à (ou, pour une liste, la contient) |
| `champ: [a, b]` | l'une des valeurs |
| `champ: { different: v }` | différent de |
| `champ: { contient: [a, b] }` | liste contenant au moins une valeur |
| `champ: { contient_tous: [a, b] }` | liste contenant toutes les valeurs |
| `champ: { apres: AAAA-MM-JJ, avant: AAAA-MM-JJ }` | plage de dates, bornes incluses |
| `champ: { depuis: 6 mois }` | date relative au build (jours, mois, ans) |
| `champ: { min: n, max: n }` | plage numérique |
| `champ: { existe: true }` | champ renseigné |

Tri : `ordre: date desc` ou liste `[mis_en_avant desc, date desc]`, ou `aleatoire` (figé au build). Sélection manuelle : `elements: [id1, id2]`. Dans une page de détail uniquement : `$courant.<champ>` et `$courant.id`.

## Collections

### `services` — dossier `content/services/`, un fichier `<id>.md`

Un métier / une offre de service. Page de détail : /services/<id>.

| Champ | Obligatoire | Type | Limites et notes |
| --- | --- | --- | --- |
| `titre` | oui | texte | ≥ 3 car., ≤ 90 car. |
| `statut` | non | `brouillon` · `publie` · `programme` | défaut : "publie" |
| `date` | non | valeur libre |  |
| `resume` | non | texte | ≤ 300 car. |
| `image` | non | { src: texte, alt: texte, focus?: `centre` · `haut` · `bas` · `gauche` · `droite` } | Image : { src, alt, focus? } |
| `categorie` | oui | `creation` · `amenagement` · `bien-etre` · `entretien` | Métier (data/taxonomies.json) |
| `mis_en_avant` | non | oui/non | défaut : false |
| `ordre` | non | entier | ≥ -9007199254740991, défaut : 100 |
| `seo` | non | { titre?: texte, description?: texte, noindex?: oui/non } | défaut : {"noindex":false} |
| `ancres` | non | liste de texte | ≤ 6 éléments — Expressions qui, dans le texte des autres pages, deviennent un lien vers celle-ci (ex. « pompe à chaleur de piscine »). Précises, 2 à 6 mots ; jamais « ici », « nos services ». |
| `role` | non | `aimant` · `seo` | aimant : élément que le visiteur a envie d'ouvrir, cible des liens d'engagement. seo : page d'entrée depuis Google (les zones le sont par défaut). |
| `prestations` | oui | liste de { label: texte, badge?: texte } | ≥ 1 éléments, ≤ 6 éléments — Prestations listées sur la carte et la page du service |
| `lien_label` | non | texte | ≤ 40 car., défaut : "Voir le détail" — Texte du lien de la carte |

Corps Markdown facultatif après le frontmatter (affiché sur la page de détail). `sections` facultatif : blocs ajoutés après le corps.

### `realisations` — dossier `content/realisations/`, un fichier `<id>.md`

Un chantier réalisé. Page de détail : /realisations/<id>.

| Champ | Obligatoire | Type | Limites et notes |
| --- | --- | --- | --- |
| `titre` | oui | texte | ≥ 3 car., ≤ 90 car. |
| `statut` | non | `brouillon` · `publie` · `programme` | défaut : "publie" |
| `date` | oui | valeur libre |  |
| `resume` | non | texte | ≤ 300 car. |
| `image` | non | { src: texte, alt: texte, focus?: `centre` · `haut` · `bas` · `gauche` · `droite` } | Image : { src, alt, focus? } |
| `categorie` | oui | `creation` · `amenagement` · `bien-etre` · `entretien` | Métier (data/taxonomies.json) |
| `mis_en_avant` | non | oui/non | défaut : false |
| `ordre` | non | entier | ≥ -9007199254740991, défaut : 100 |
| `seo` | non | { titre?: texte, description?: texte, noindex?: oui/non } | défaut : {"noindex":false} |
| `ancres` | non | liste de texte | ≤ 6 éléments — Expressions qui, dans le texte des autres pages, deviennent un lien vers celle-ci (ex. « pompe à chaleur de piscine »). Précises, 2 à 6 mots ; jamais « ici », « nos services ». |
| `role` | non | `aimant` · `seo` | aimant : élément que le visiteur a envie d'ouvrir, cible des liens d'engagement. seo : page d'entrée depuis Google (les zones le sont par défaut). |
| `lieu` | oui | texte | ≤ 40 car. — Commune du chantier |
| `tags` | non | liste de `massif` · `plantation` · `bordure-acier` · `paillage` · `terrasse-bois` · `arrosage` · `gazon` · `elagage` · `debroussaillage` · `bain-norvegien` · `allee` · `dallage` · `muret` · `cloture` · `eclairage` | ≤ 6 éléments |
| `galerie` | non | liste de { src: texte, alt: texte, focus?: `centre` · `haut` · `bas` · `gauche` · `droite` } | ≤ 24 éléments |

Corps Markdown facultatif après le frontmatter (affiché sur la page de détail). `sections` facultatif : blocs ajoutés après le corps.

### `zones` — dossier `content/zones/`, un fichier `<id>.md`

Une page locale « métier + ville » pour le référencement. Page de détail : /zones/<id>.

| Champ | Obligatoire | Type | Limites et notes |
| --- | --- | --- | --- |
| `titre` | oui | texte | ≥ 3 car., ≤ 90 car. |
| `statut` | non | `brouillon` · `publie` · `programme` | défaut : "publie" |
| `date` | non | valeur libre |  |
| `resume` | non | texte | ≤ 300 car. |
| `image` | non | { src: texte, alt: texte, focus?: `centre` · `haut` · `bas` · `gauche` · `droite` } | Image : { src, alt, focus? } |
| `categorie` | oui | `creation` · `amenagement` · `bien-etre` · `entretien` | Métier (data/taxonomies.json) |
| `mis_en_avant` | non | oui/non | défaut : false |
| `ordre` | non | entier | ≥ -9007199254740991, défaut : 100 |
| `seo` | non | { titre?: texte, description?: texte, noindex?: oui/non } | défaut : {"noindex":false} |
| `ancres` | non | liste de texte | ≤ 6 éléments — Expressions qui, dans le texte des autres pages, deviennent un lien vers celle-ci (ex. « pompe à chaleur de piscine »). Précises, 2 à 6 mots ; jamais « ici », « nos services ». |
| `role` | non | `aimant` · `seo` | aimant : élément que le visiteur a envie d'ouvrir, cible des liens d'engagement. seo : page d'entrée depuis Google (les zones le sont par défaut). |
| `ville` | oui | texte | ≤ 40 car. |

Corps Markdown facultatif après le frontmatter (affiché sur la page de détail). `sections` facultatif : blocs ajoutés après le corps.

## Taxonomies (`data/taxonomies.json`)

- **Métiers** (`categorie`) : `creation` (Conception et création de jardins), `amenagement` (Aménagements extérieurs), `bien-etre` (Bains norvégiens, spas et piscines bois), `entretien` (Taille, débroussaillage et entretien)
- **Tags de `realisations`** : `massif`, `plantation`, `bordure-acier`, `paillage`, `terrasse-bois`, `arrosage`, `gazon`, `elagage`, `debroussaillage`, `bain-norvegien`, `allee`, `dallage`, `muret`, `cloture`, `eclairage`

Une valeur absente de ces listes est refusée. Pour en ajouter une, la proposer dans le rapport.
