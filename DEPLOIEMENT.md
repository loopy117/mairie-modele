# Déploiement — site de mairie (modèle)

Hébergé sur le serveur xmediacreation (kit `xmedia-serveur`). Domaine principal : celui de la commune (modèle : `saint-exemple.fr`, fictif).
Dépôt : `loopy117/mairie-modele`.

Règle générale : les clés, jetons et secrets se collent **directement** dans GitHub ou dans `www.php` sur le serveur,
jamais dans une conversation, un e-mail ou un fichier du dépôt.

---

## 1. Mettre le serveur à jour

```sh
sudo xm-maj
```

Installe la dernière version des outils `xm-*`, du code commun (espace client, formulaire, éditeur) et des modèles.

## 2. Créer le site et ses secrets

Nouveau site :

```sh
sudo xm-site creer <commune> www.<commune>.fr <commune>.fr
```

Site déjà créé avant le 30/09/2026 (fichier `www.php` encore vide) :

```sh
sudo xm-site secrets <commune>
```

Dans les deux cas, le serveur prépare `/srv/sites/<commune>/config/www.php` avec les sels et le secret du webhook déjà
générés, puis **affiche une seule fois** les valeurs à copier dans GitHub (étape 7) :

- variables `SSH_HOTE`, `SSH_UTILISATEUR`, `DOSSIER_PRODUCTION`, `URL_PRODUCTION` (avec `creer`) ;
- secrets `SSH_KNOWN_HOSTS`, `SSH_CLE_PRIVEE` (avec `creer`) ;
- secret `XMEDIA_AI_SECRET`.

Garder le terminal ouvert jusqu'à l'étape 7. En cas de perte :

| Perdu | Commande |
| --- | --- |
| clé de déploiement (`SSH_CLE_PRIVEE`) | `sudo xm-site cle <commune>` (nouvelle clé, l'ancienne ne marche plus) |
| `XMEDIA_AI_SECRET` | `sudo xm-site secrets <commune>` (le réaffiche) |
| secret compromis | `sudo xm-site secrets <commune> --webhook` (nouveau secret, à reporter dans GitHub) |

## 3. Deux clés API Anthropic

Sur https://platform.claude.com, de préférence dans un **espace de travail (workspace) propre au site** :

1. Créer deux clés :
   - `<commune>-espace-client` → pour le serveur (`www.php`, étape 6) : dialogue avec le client, cadrage des demandes ;
   - `<commune>-github` → pour GitHub (secret `ANTHROPIC_API_KEY`, étape 7) : réalisation des demandes.
2. Fixer une **limite de dépense mensuelle** sur l'espace de travail (par exemple 20 € pendant les essais).

Deux clés séparées : on peut en révoquer une sans couper l'autre, et la console montre la consommation de chacune.

## 4. Jeton GitHub pour le serveur

Le serveur s'en sert pour lancer une réalisation (quand le client valide une demande) et suivre la proposition.

github.com → photo de profil → **Settings** → **Developer settings** → **Personal access tokens** →
**Fine-grained tokens** → **Generate new token** :

| Champ | Valeur |
| --- | --- |
| Token name | `<commune>-serveur` |
| Resource owner | `loopy117` |
| Expiration | 1 an (noter la date dans l'agenda pour le renouveler) |
| Repository access | **Only select repositories** → `loopy117/mairie-modele` |
| Permissions → Repository → **Contents** | **Read and write** (lancer une réalisation) |
| Permissions → Repository → **Pull requests** | **Read-only** (suivre la proposition) |

*Metadata : Read-only* s'ajoute tout seul. Aucune autre permission. **Generate token**, copier le jeton
(`github_pat_…`) : il n'est affiché qu'une fois. Il va dans `www.php` (étape 6).

À l'expiration, l'espace client ne peut plus lancer de réalisation : recréer un jeton et remplacer l'ancien dans `www.php`.

## 5. Application OAuth pour l'éditeur (/admin/)

github.com → **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App** :

| Champ | Valeur |
| --- | --- |
| Application name | `Commune de <commune> — édition` |
| Homepage URL | `https://www.<commune>.fr` |
| Authorization callback URL | `https://www.<commune>.fr/admin/auth.php` |

**Register application**, noter le *Client ID* (`Ov23…`), puis **Generate a new client secret** et le copier.

## 6. Compléter la configuration du site

Mot de passe du compte client (tapé deux fois, jamais affiché ni enregistré) :

```sh
sudo xm-site hash
```

Copier l'empreinte affichée (`$2y$…`), puis ouvrir la configuration :

```sh
sudo xm-site config <commune>
```

Remplacer chaque `A-REMPLIR` :

| Champ | Valeur |
| --- | --- |
| `destinataires` | adresse qui reçoit les demandes du formulaire (ex. `contact@www.<commune>.fr`) |
| `decap` → `client_id`, `client_secret` | étape 5 |
| `xmedia_ai` → `utilisateurs` | e-mail, nom et `hash` de chaque compte client (un `hash` par personne) |
| `xmedia_ai` → `email_client` | adresse qui reçoit « demande reçue », questions, « en ligne » |
| `xmedia_ai` → `claude` → `cle_api` | clé `<commune>-espace-client` (étape 3) |
| `xmedia_ai` → `github` → `jeton` | jeton `github_pat_…` (étape 4) |

Déjà remplis, à ne pas toucher : les deux `sel`, `secret_webhook`, `hotes_autorises`, `url_site`, `depot`.
Facultatif : `'metier'` (questionnaire du brief) et `'modules'` (modules de la formule), en commentaire dans le fichier.

Le fichier est vérifié à l'enregistrement : en cas d'erreur de syntaxe PHP, il n'est pas enregistré.

## 7. GitHub : variables, secrets, permissions

Dépôt `loopy117/mairie-modele` → **Settings** :

**Secrets and variables → Actions → Variables**

| Nom | Valeur |
| --- | --- |
| `SSH_HOTE` | affiché à l'étape 2 |
| `SSH_UTILISATEUR` | `d-<commune>` |
| `DOSSIER_PRODUCTION` | `www` |
| `URL_PRODUCTION` | `https://www.<commune>.fr` (sans barre à la fin) |
| `NOINDEX_PRODUCTION` | `1` jusqu'au lancement (étape 11) |
| `CLAUDE_MODELE` | facultatif (défaut `claude-sonnet-5`) |

**Secrets and variables → Actions → Secrets**

| Nom | Valeur |
| --- | --- |
| `SSH_CLE_PRIVEE` | étape 2 (lignes BEGIN et END comprises) |
| `SSH_KNOWN_HOSTS` | étape 2 (toutes les lignes) |
| `XMEDIA_AI_SECRET` | étape 2 (identique au `secret_webhook` du serveur) |
| `ANTHROPIC_API_KEY` | clé `<commune>-github` (étape 3) |

**Actions → General → Workflow permissions** : « Read and write permissions » et cocher
« Allow GitHub Actions to create and approve pull requests ». Sans cette case, les réalisations échouent au moment
d'ouvrir la proposition.

## 8. E-mails du site

```sh
sudo xm-site envoi <commune>
```

Crée l'envoi par Scaleway (domaine, SPF, DKIM, DMARC chez OVH, clé d'envoi) et le fichier `www.envoi.php`.
Peut se faire avant la bascule DNS. Les e-mails partent de `formulaire@<commune>.fr`.

## 9. Premier déploiement

GitHub → onglet **Actions** → **Déploiement** → **Run workflow** (ou pousser sur `main`).
Le workflow valide le contenu, construit le site et l'envoie sur le serveur. Vérifier :

```sh
ls /srv/sites/<commune>/www
```

## 10. Bascule DNS et Search Console

```sh
sudo xm-site dns <commune>     # affiche le plan (anciennes → nouvelles adresses), demande confirmation
sudo xm-site gsc <commune>     # propriété Search Console vérifiée par DNS, envoi du sitemap
```

Le certificat HTTPS est obtenu tout seul 1 à 2 minutes après la bascule. Ouvrir https://www.<commune>.fr.

## 11. Tester, puis lancer

1. Formulaire d'audit : envoyer une demande, vérifier la réception et l'onglet « Demandes clients ».
2. Espace client : https://www.<commune>.fr/xmedia-ai/ avec un compte client → nouvelle demande → « C'est bon, lancez ».
   Onglet Actions : le workflow « Demande xmedia·ai » tourne, une proposition apparaît, l'e-mail « À valider » arrive.
3. Éditeur : https://www.<commune>.fr/admin/ → « Se connecter avec GitHub ».
   Avant le lancement : compléter `legal` dans `data/site.json` (raison sociale, forme, immatriculation ou SIRET, adresse du siège, directeur de la publication ; médiateur si clientèle de particuliers), puis passer `content/pages/mentions-legales.yaml` et `confidentialite.yaml` en `statut: publie`. Ces deux pages sont générées par le bloc `legal` (éditeur, création, hébergeur, conditions d'utilisation, données personnelles). Le build refuse d'ouvrir le site aux moteurs (`NOINDEX=0`) sans elles.
4. Lancement : supprimer la variable `NOINDEX_PRODUCTION` dans GitHub, relancer **Déploiement**.
   À chaque mise en ligne suivante, les pages ajoutées, modifiées ou supprimées sont signalées à Bing (et aux autres moteurs IndexNow) : étape « Prévenir Bing… » du déploiement (`scripts/indexnow.mjs`). Clé IndexNow : variable `INDEXNOW_CLE` facultative, sinon dérivée de l'adresse du site ; publiée dans `dist/<clé>.txt`.

---

L'espace client, le formulaire et la connexion de l'éditeur sont fournis par le code commun du serveur
(`/opt/xmedia-commun`, mis à jour par `sudo xm-maj`) : rien à installer dans ce dépôt.
