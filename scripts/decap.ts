/**
 * Decap CMS (/admin/) :
 *  1. installe le bundle Decap (version figée, sans ses dépendances) dans public/admin/decap/ ;
 *  2. génère public/admin/config.yml à partir des schémas du site (mêmes champs, mêmes limites,
 *     mêmes listes de choix que la validation) : rien à maintenir à la main.
 *
 * Les champs techniques (requêtes des boucles, réglages des formulaires) sont conservés tels quels
 * mais masqués : on les modifie via l'espace client ou l'agence, pas dans Decap.
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync, rmSync, cpSync } from 'node:fs';
import { join, relative } from 'node:path';
import { stringify } from 'yaml';
import { z } from 'astro/zod';
import { blocs } from '../src/schemas/blocs';
import { collectionSchemas, TYPES_ACTES, TYPES_ANNUAIRE, TYPES_LIEUX, AVANCEMENTS, THEMES_INFOS } from '../src/schemas/collections';
import { page } from '../src/schemas/page';
import { reglages } from '../src/lib/collections';
import taxonomies from '../data/taxonomies.json' with { type: 'json' };
import site from '../data/site.json' with { type: 'json' };
import parcoursDonnees from '../data/parcours.json' with { type: 'json' };
import { SUJETS } from '../src/schemas/sujets';
import { TYPES_ENTREPRISE, JOURS } from '../src/schemas/site';
import { tarifs as tarifsSchema } from '../src/schemas/tarifs';

const VERSION_DECAP = '3.16.3';
const DEPOT = process.env.DECAP_DEPOT || 'loopy117/mairie-modele';
const R = process.cwd();
const ADMIN = join(R, 'public/admin');

/* ------------------------------ 1. Bundle Decap ------------------------------ */
function installerDecap() {
  const dest = join(ADMIN, 'decap');
  const marqueur = join(dest, 'VERSION');
  if (existsSync(marqueur) && readFileSync(marqueur, 'utf8').trim() === VERSION_DECAP) return;
  const tmp = join(R, 'node_modules/.cache/decap');
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });
  execSync(`npm pack decap-cms@${VERSION_DECAP} --silent --pack-destination "${tmp}"`, { stdio: 'pipe' });
  execSync(`tar -xzf decap-cms-${VERSION_DECAP}.tgz`, { cwd: tmp });
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  const dist = join(tmp, 'package/dist');
  for (const f of readdirSync(dist)) if (f.includes('decap-cms') && !f.endsWith('.map')) cpSync(join(dist, f), join(dest, f));
  writeFileSync(marqueur, VERSION_DECAP + '\n');
  console.log(`Decap ${VERSION_DECAP} installé dans public/admin/decap/`);
}

/* ------------------------ 2. Schéma JSON → champs Decap ------------------------ */
const LIBELLES: Record<string, string> = {
  titre: 'Titre', surtitre: 'Surtitre', texte: 'Texte', intro: 'Introduction', contenu: 'Contenu', variant: 'Variante',
  background: 'Fond', spacing: 'Espacement', id: 'Ancre (id)', image: 'Image', images: 'Images', ctas: 'Boutons', cta: 'Bouton',
  points: 'Points', items: 'Éléments', lien: 'Lien', label: 'Libellé', href: 'Lien (URL)', style: 'Style', src: 'Fichier', alt: 'Texte alternatif',
  focus: "Point d'intérêt", icone: 'Icône', question: 'Question', reponse: 'Réponse', valeur: 'Valeur', libelle: 'Libellé', source: 'Source',
  slides: 'Diapositives', note: 'Note', statut: 'Statut', date: 'Date', resume: 'Résumé', categorie: 'Métier', mis_en_avant: 'Mis en avant',
  ordre: 'Ordre', seo: 'Référencement', description: 'Description', noindex: 'Ne pas indexer', prestations: 'Prestations', badge: 'Badge',
  lien_label: 'Texte du lien', lieu: 'Commune', tags: 'Étiquettes', galerie: 'Galerie', ville: 'Ville', gabarit: 'Gabarit',
  fil_ariane: "Fil d'Ariane", brief: 'Demande d\'origine', sections: 'Sections', lien_tout_voir: 'Lien « tout voir »', bouton: 'Texte du bouton',
  sujet: "Objet de l'e-mail", champs: 'Champs', obligatoires: 'Champs obligatoires', body: 'Corps de la page',
};
const LIBELLES_BLOCS: Record<string, string> = {
  hero: 'Ouverture (hero)', texte: 'Texte', 'texte-image': 'Texte et image', features: 'Points forts / étapes', galerie: 'Galerie',
  slider: 'Diaporama', cta: "Appel à l'action", faq: 'Questions fréquentes', chiffres: 'Chiffres clés', formulaire: 'Formulaire de contact', tarifs: 'Tarifs',
  boucle: 'Liste automatique (boucle)', trombinoscope: 'Trombinoscope (portraits)', lettre: "Inscription à la lettre d'information",
};
/** Champs conservés mais non modifiables dans Decap. */
const MASQUES: Record<string, string[]> = {
  boucle: ['source', 'filtre', 'exclure', 'elements', 'ordre', 'nombre', 'decalage', 'carte', 'affichage', 'options', 'si_vide', 'message_vide'],
  formulaire: ['champs', 'obligatoires'],
};
const MARKDOWN = new Set(['contenu', 'reponse', 'body', 'details']);
const OPTIONS: Record<string, string> = { ...AVANCEMENTS, ...THEMES_INFOS, ...TYPES_LIEUX, ...TYPES_ACTES, ...TYPES_ANNUAIRE, ...(taxonomies.metiers as Record<string, string>) };
Object.assign(LIBELLES, {
  diffuser: 'Diffuser sur les réseaux', lettre: "Lettre d'information", sujets: 'Sujets', publics: 'Parcours (publics)',
  photos: 'Photos', legende: 'Légende', personnes: 'Personnes', nom: 'Nom', fonction: 'Fonction', details: 'Délégation, missions', permanence: 'Permanence', liste: 'Liste', photo: 'Photo', credit: 'Crédit photo', autorisations: "Droit à l'image vérifié",
  categorie: 'Thème', type: 'Nature', numero: 'Numéro', fichier: 'Document (PDF)', date_fin: 'Date de fin', horaire: 'Horaire', lieu: 'Lieu',
  organisateur: 'Organisé par', pieces: 'Pièces à fournir', contact: "Où s'adresser", adresse: 'Adresse', telephone: 'Téléphone', email: 'E-mail',
  site: 'Site internet', horaires: 'Horaires',
});
const libelle = (n: string) => LIBELLES[n] ?? n.charAt(0).toUpperCase() + n.slice(1).replace(/_/g, ' ');

function estImage(s: any) {
  return s?.type === 'object' && s.properties?.src && s.properties?.alt;
}

function champ(nom: string, s: any, requis: boolean): any {
  const base: any = { name: nom, label: libelle(nom), required: requis };
  if (s.description) base.hint = s.description;
  if (s.default !== undefined && typeof s.default !== 'object') base.default = s.default;
  if (s.anyOf) {
    const sansNull = s.anyOf.filter((x: any) => x.type !== 'null');
    return champ(nom, { ...sansNull[0], description: s.description, default: s.default }, requis);
  }
  // Position sur la carte : recherche d'adresse et mini-carte (public/admin/position.js)
  if (nom === 'position' && s.type === 'object') {
    return {
      ...base, widget: 'position', collapsed: false, ville: site.adresse?.ville ?? '', code_postal: site.adresse?.code_postal ?? '',
      fields: [
        { name: 'latitude', label: 'Latitude', widget: 'number', value_type: 'float', required: false, min: -90, max: 90 },
        { name: 'longitude', label: 'Longitude', widget: 'number', value_type: 'float', required: false, min: -180, max: 180 },
      ],
    };
  }
  if (estImage(s)) {
    // Champ image avec le bouton « Choisir dans la photothèque » (public/admin/phototheque.js)
    return {
      ...base, widget: 'image_phototheque', collapsed: false,
      fields: [
        { name: 'src', label: 'Fichier', widget: 'image', required: requis, choose_url: false },
        { name: 'alt', label: 'Texte alternatif', widget: 'string', required: false, hint: "Ce qu'on voit sur l'image (125 caractères max). Vide seulement si décorative.", pattern: ['^[\\s\\S]{0,125}$', '125 caractères maximum'] },
        { name: 'focus', label: "Point d'intérêt", widget: 'select', required: false, options: ['centre', 'haut', 'bas', 'gauche', 'droite'] },
      ],
    };
  }
  // Listes fermées : libellés lisibles (thèmes, nature des actes, catégories de l'annuaire)
  if (s.enum) return { ...base, widget: 'select', options: s.enum.map((v: string) => (OPTIONS[v] ? { label: OPTIONS[v], value: v } : v)) };
  switch (s.type) {
    case 'boolean':
      return { ...base, widget: 'boolean' };
    case 'integer':
    case 'number':
      return { ...base, widget: 'number', value_type: s.type === 'integer' ? 'int' : 'float', ...(s.minimum != null && s.minimum > -1e12 ? { min: s.minimum } : {}), ...(s.maximum != null && s.maximum < 1e12 ? { max: s.maximum } : {}) };
    case 'string': {
      if (nom === 'fichier') return { ...base, widget: 'file', choose_url: false, hint: s.description ?? 'Document PDF' };
      if (s.format === 'date-time' || s.format === 'date' || nom === 'date' || nom === 'date_fin') return { ...base, widget: 'datetime', date_format: 'DD/MM/YYYY', time_format: false, format: 'YYYY-MM-DD', picker_utc: true };
      const w = MARKDOWN.has(nom) || /Markdown/.test(s.description ?? '') ? 'markdown' : (s.maxLength ?? 0) > 160 ? 'text' : 'string';
      const f: any = { ...base, widget: w };
      if (w === 'markdown') f.buttons = ['bold', 'italic', 'link', 'heading-two', 'heading-three', 'bulleted-list', 'numbered-list'], f.editor_components = [], f.modes = ['rich_text'];
      const min = s.minLength ?? 0;
      if (s.maxLength || min) f.pattern = [`^[\\s\\S]{${min},${s.maxLength ?? ''}}$`, s.maxLength ? `${min ? `${min} à ` : ''}${s.maxLength} caractères maximum` : `${min} caractères minimum`];
      if (s.pattern && !f.pattern) f.pattern = [s.pattern, 'Format invalide'];
      return f;
    }
    case 'array': {
      const it = s.items ?? {};
      const lim = { ...(s.minItems ? { min: s.minItems } : {}), ...(s.maxItems ? { max: s.maxItems } : {}) };
      if (it.enum) {
        // Listes à libellés : sujets (data/sujets.json) et publics (data/parcours.json)
        const lib: Record<string, string> = nom === 'diffuser' ? { facebook: 'Facebook', instagram: 'Instagram', linkedin: 'LinkedIn' } : nom === 'sujets' ? Object.fromEntries(Object.entries(SUJETS).map(([k, v]) => [k, v.libelle]))
          : nom === 'publics' ? Object.fromEntries(Object.entries(parcoursDonnees as Record<string, { titre: string }>).map(([k, v]) => [k, v.titre])) : {};
        return { ...base, widget: 'select', multiple: true, options: it.enum.map((v: string) => (lib[v] ? { label: lib[v], value: v } : v)), ...lim };
      }
      if (estImage(it)) return {
        ...base, widget: 'list', ...lim, summary: '{{fields.image.alt}}',
        field: {
          ...champ('image', it, true), label: 'Photo',
          fields: [
            ...champ('x', it, true).fields,
            ...Object.keys(it.properties).filter((k) => !['src', 'alt', 'focus'].includes(k)).map((k) => champ(k, it.properties[k], false)),
          ],
        },
      };
      if (it.type === 'object') return { ...base, widget: 'list', ...lim, collapsed: true, fields: champsObjet(it) };
      return { ...base, widget: 'list', ...lim, field: { ...champ('valeur', it, true), label: 'Valeur' } };
    }
    case 'object': {
      // Decap exige les sous-champs obligatoires même quand le groupe facultatif est absent :
      // dans un groupe facultatif, tout devient facultatif (la validation du site contrôle le reste).
      const champs = champsObjet(s);
      return { ...base, widget: 'object', collapsed: true, fields: requis ? champs : champs.map(facultatif) };
    }
    default:
      return { ...base, widget: 'hidden', required: false };
  }
}

function champsObjet(s: any, ignorer: string[] = [], masques: string[] = []): any[] {
  const req = new Set<string>(s.required ?? []);
  return Object.entries<any>(s.properties ?? {})
    .filter(([n]) => !ignorer.includes(n))
    .map(([n, p]) => (masques.includes(n) ? { name: n, label: libelle(n), widget: 'hidden', required: false } : champ(n, p, req.has(n) && p.default === undefined)));
}

function facultatif(f: any): any {
  const g = { ...f, required: false };
  if (g.fields && g.widget === 'object') g.fields = g.fields.map(facultatif);
  return g;
}

const js = (sch: any) => z.toJSONSchema(sch, { io: 'input', unrepresentable: 'any' }) as any;

function typesBlocs() {
  return Object.entries(blocs).map(([nom, sch]) => {
    const meta: any = (sch as any).meta?.() ?? {};
    return {
      name: nom, label: LIBELLES_BLOCS[nom] ?? nom, summary: '{{fields.titre}}', ...(meta.quand ? { hint: meta.quand } : {}),
      widget: 'object', fields: champsObjet(js(sch), ['block'], MASQUES[nom] ?? []),
    };
  });
}

const champSections = (requis: boolean) => ({
  name: 'sections', label: 'Sections', widget: 'list', required: requis, collapsed: false, typeKey: 'block', types: typesBlocs(),
  hint: 'Les sections de la page, dans l\'ordre. La première doit être une ouverture (hero).',
});

function champsPage() {
  const s = js(page);
  // « Demande d'origine » (brief) : mémoire de l'assistant, conservée mais jamais montrée dans l'éditeur
  return champsObjet(s, ['sections'], ['brief']).concat([champSections(true)]);
}

function champsCollection(nom: keyof typeof collectionSchemas) {
  const s = js(collectionSchemas[nom]);
  return [
    ...champsObjet(s, ['sections']),
    { name: 'body', label: 'Corps de la page', widget: 'markdown', required: false, buttons: ['bold', 'italic', 'link', 'heading-two', 'heading-three', 'bulleted-list', 'numbered-list'], editor_components: [], modes: ['rich_text'] },
    { ...champSections(false), label: 'Sections supplémentaires', hint: 'Facultatif : sections ajoutées après le corps sur la page de détail.' },
  ];
}

/* ------------------------------ Réglages (data/*.json) ------------------------------ */
const entreeNav = (avecEnfants: boolean): any[] => [
  { name: 'page', label: 'Page (chemin, ex. /contact)', widget: 'string', required: false },
  { name: 'element', label: 'Élément de collection (ex. services/climatisation)', widget: 'string', required: false },
  { name: 'collection', label: 'Archive de collection', widget: 'select', required: false, options: Object.keys(collectionSchemas) },
  { name: 'label', label: 'Libellé (facultatif : titre de la page par défaut)', widget: 'string', required: false },
  ...(avecEnfants ? [{ name: 'enfants', label: 'Sous-menu', widget: 'list', required: false, collapsed: true, fields: entreeNav(false) }] : []),
];

const reglagesSite = {
  name: 'reglages', label: 'Réglages du site', editor: { preview: false },
  files: [
    {
      name: 'sujets', label: 'Sujets (mots-clés)', file: 'data/sujets.json',
      description: "Liste des sujets que l'on peut attacher aux pages et aux fiches. Chaque sujet a sa page (/sujets/…) qui rassemble tout ce qui le porte. Un nouveau sujet est proposé dans les fiches après la mise en ligne suivante.",
      fields: [
        { name: 'sujets', label: 'Sujets', widget: 'list', summary: '{{fields.libelle}}', fields: [
          { name: 'libelle', label: 'Nom affiché', widget: 'string', pattern: ['^.{2,40}$', '2 à 40 caractères'] },
          { name: 'id', label: 'Identifiant (adresse /sujets/…)', widget: 'string', pattern: ['^[a-z0-9]+(-[a-z0-9]+)*$', 'minuscules sans accent, mots séparés par des tirets'], hint: 'Ex. conseil-municipal. Ne plus le changer une fois le sujet utilisé.' },
          { name: 'intro', label: 'Introduction de la page du sujet', widget: 'text', required: false, pattern: ['^[\\s\\S]{0,220}$', '220 caractères maximum'] },
        ] },
      ],
    },
    {
      name: 'alerte', label: "Alerte (bandeau en haut de toutes les pages)", file: 'data/alerte.json',
      description: "Coupure d'eau, vigilance météo, route fermée… Réservé aux administrateurs ; disparaît d'elle-même après la date de fin.",
      fields: [
        { name: 'actif', label: 'Afficher', widget: 'boolean', default: false },
        { name: 'niveau', label: 'Niveau', widget: 'select', options: [{ label: 'Information (bleu)', value: 'info' }, { label: 'Important (orange)', value: 'important' }, { label: 'Urgent (rouge)', value: 'urgent' }], default: 'info' },
        { name: 'message', label: 'Message', widget: 'text', required: false, pattern: ['^[\\s\\S]{0,220}$', '220 caractères maximum'] },
        { name: 'lien', label: 'Lien (facultatif)', widget: 'object', required: false, collapsed: true, fields: [{ name: 'label', label: 'Texte du lien', widget: 'string', required: false }, { name: 'href', label: 'Adresse (/page ou https://…)', widget: 'string', required: false }] },
        { name: 'jusqu_au', label: "Dernier jour d'affichage", widget: 'datetime', required: false, date_format: 'DD/MM/YYYY', time_format: false, format: 'YYYY-MM-DD' },
      ],
    },
    {
      name: 'site', label: 'Coordonnées et informations', file: 'data/site.json',
      fields: [
        { name: 'nom', label: "Nom de l'entreprise", widget: 'string' },
        { name: 'baseline', label: 'Accroche (sous le logo)', widget: 'string' },
        { name: 'description', label: 'Description courte (pied de page)', widget: 'text' },
        { name: 'url', label: 'Adresse du site', widget: 'hidden' },
        { name: 'types_schema', label: "Type d'entreprise pour Google (schema.org)", widget: 'select', multiple: true, min: 1, max: 3, options: [...TYPES_ENTREPRISE], hint: 'Le plus précis possible ; plusieurs si l\'activité est mixte.' },
        { name: 'telephone', label: 'Téléphone', widget: 'string' },
        { name: 'email', label: 'E-mail', widget: 'string' },
        { name: 'horaires', label: 'Horaires', widget: 'string' },
        { name: 'horaires_detail', label: 'Horaires pour Google', widget: 'list', required: false, summary: '{{fields.ouverture}}–{{fields.fermeture}}', fields: [
          { name: 'jours', label: 'Jours', widget: 'select', multiple: true, options: [...JOURS] },
          { name: 'ouverture', label: 'Ouverture (HH:MM)', widget: 'string', pattern: ['^([01]\\d|2[0-3]):[0-5]\\d$', 'format HH:MM'] },
          { name: 'fermeture', label: 'Fermeture (HH:MM)', widget: 'string', pattern: ['^([01]\\d|2[0-3]):[0-5]\\d$', 'format HH:MM'] }] },
        { name: 'adresse', label: 'Adresse', widget: 'object', fields: [
          { name: 'rue', label: 'Numéro et rue', widget: 'string', required: false },
          { name: 'ville', label: 'Ville', widget: 'string' }, { name: 'code_postal', label: 'Code postal', widget: 'string' }, { name: 'pays', label: 'Pays', widget: 'hidden' }] },
        { name: 'afficher_adresse', label: "Afficher l'adresse complète", widget: 'boolean', required: false, default: false },
        { name: 'siret', label: 'SIRET', widget: 'string' },
        { name: 'zone_resume', label: "Zone d'intervention (bandeau du haut)", widget: 'string' },
        { name: 'urgence', label: "Bandeau d'urgence", widget: 'object', fields: [
          { name: 'actif', label: 'Afficher', widget: 'boolean' }, { name: 'texte', label: 'Texte', widget: 'string' }] },
        { name: 'villes', label: 'Villes desservies (de la plus importante à la moins importante)', widget: 'list', required: false, field: { name: 'ville', label: 'Ville', widget: 'string' } },
        { name: 'reseaux', label: 'Réseaux sociaux', widget: 'list', required: false, field: { name: 'url', label: 'Adresse', widget: 'string' } },
        { name: 'fiche_google', label: 'Fiche Google (lien Google Maps)', widget: 'string', required: false },
        { name: 'logo', label: 'Logo', widget: 'image', required: false },
        { name: 'cta_defaut', label: "Appel à l'action des pages de détail", widget: 'object', collapsed: true, fields: [
          { name: 'titre', label: 'Titre', widget: 'string' }, { name: 'texte', label: 'Texte', widget: 'text' },
          { name: 'ctas', label: 'Boutons', widget: 'list', fields: [{ name: 'label', label: 'Libellé', widget: 'string' }, { name: 'href', label: 'Lien', widget: 'string' }, { name: 'style', label: 'Style', widget: 'select', options: ['primaire', 'secondaire'] }] },
          { name: 'note', label: 'Note', widget: 'string', required: false }] },
      ],
    },
    {
      name: 'menu', label: 'Menu principal', file: 'data/menu.json',
      fields: [
        { name: 'principal', label: 'Entrées (7 maximum)', widget: 'list', max: 7, summary: '{{fields.label}} {{fields.page}}{{fields.element}}{{fields.collection}}', fields: entreeNav(true) },
        { name: 'bouton', label: "Bouton d'action", widget: 'object', fields: [{ name: 'label', label: 'Libellé', widget: 'string' }, { name: 'href', label: 'Lien', widget: 'string' }] },
      ],
    },
    {
      name: 'footer', label: 'Pied de page', file: 'data/footer.json',
      fields: [
        { name: 'colonnes', label: 'Colonnes', widget: 'list', max: 3, summary: '{{fields.titre}}', fields: [
          { name: 'titre', label: 'Titre', widget: 'string' }, { name: 'liens', label: 'Liens', widget: 'list', fields: entreeNav(false) }] },
        { name: 'legal', label: 'Liens légaux', widget: 'list', fields: entreeNav(false) },
      ],
    },
    // Grille de prix : seulement pour les sites qui en ont une
    ...(existsSync(join(R, 'data/tarifs.json'))
      ? [{ name: 'tarifs', label: 'Tarifs', file: 'data/tarifs.json', fields: champsObjet(js(tarifsSchema)) }]
      : []),
  ],
};

/* ------------------------------------ Config ------------------------------------ */
function pagesImbriquees() {
  const racine = join(R, 'content/pages');
  const liste: string[] = [];
  const parcourir = (d: string) => readdirSync(d).forEach((f) => { const p = join(d, f); if (statSync(p).isDirectory()) parcourir(p); else if (p.endsWith('.yaml') && relative(racine, p).includes('/')) liste.push(p); });
  parcourir(racine);
  return liste.map((p) => {
    const rel = relative(R, p);
    const id = relative(racine, p).replace(/\.yaml$/, '');
    const titre = (readFileSync(p, 'utf8').match(/^titre:\s*(.+)$/m)?.[1] ?? id).replace(/^["']|["']$/g, '');
    return {
      name: id.replace(/[^a-z0-9]+/gi, '-'), label: `${titre} (/${id})`, file: rel, fields: champsPage(),
      // Images de la page rangées dans media/pages/<chemin>/ (Decap ne garde que le nom du fichier)
      media_folder: `/media/pages/${id}`, public_folder: `/img/pages/${id}`,
    };
  });
}

function config() {
  const url = (process.env.SITE_URL || site.url).replace(/\/$/, '');
  const imbriquees = pagesImbriquees();
  return {
    backend: {
      // Sans compte GitHub : connexion par l'espace client, puis relais vers GitHub (code commun du serveur, /xmedia-ai/)
      name: 'github', repo: DEPOT, branch: 'main', base_url: url, auth_endpoint: 'xmedia-ai/decap-auth.php', api_root: `${url}/xmedia-ai/github.php`, squash_merges: true,
      commit_messages: { create: 'Decap : création de {{collection}} « {{slug}} »', update: 'Decap : modification de {{collection}} « {{slug}} »', delete: 'Decap : suppression de {{collection}} « {{slug}} »', uploadMedia: 'Decap : ajout de {{path}}', deleteMedia: 'Decap : suppression de {{path}}', openAuthoring: '{{message}}' },
    },
    local_backend: true,
    publish_mode: 'editorial_workflow',
    locale: 'fr',
    site_url: url,
    display_url: url,
    // /img/<chemin> dans le contenu = media/<chemin> dans le dépôt (résolu au build)
    media_folder: 'media',
    public_folder: '/img',
    slug: { encoding: 'ascii', clean_accents: true, sanitize_replacement: '-' },
    collections: [
      {
        name: 'pages', label: 'Pages', label_singular: 'Page', folder: 'content/pages', extension: 'yaml', format: 'yaml', create: true,
        identifier_field: 'titre', summary: '{{titre}} — {{statut}}', slug: '{{slug}}', editor: { preview: false },
        media_folder: '/media/pages/{{filename}}', public_folder: '/img/pages/{{filename}}',
        description: 'Pages principales du site. Les pages rangées sous une rubrique (ex. /services/pompe-a-chaleur/piscine) sont dans « Sous-pages ». Les pages en brouillon ne sont pas publiées.', fields: champsPage(),
      },
      ...(imbriquees.length ? [{ name: 'sous_pages', label: 'Sous-pages', label_singular: 'Sous-page', description: 'Pages rangées sous une rubrique, ex. Services › Pompe à chaleur › Piscine (/services/pompe-a-chaleur/piscine).', editor: { preview: false }, files: imbriquees }] : []),
      ...(Object.keys(collectionSchemas) as (keyof typeof collectionSchemas)[]).map((nom) => ({
        name: nom, label: reglages[nom].libelle, folder: `content/${nom}`, extension: 'md', format: 'frontmatter', create: true,
        identifier_field: 'titre', summary: '{{titre}}', slug: '{{slug}}', editor: { preview: false },
        media_folder: `/media/${nom}/{{filename}}`, public_folder: `/img/${nom}/{{filename}}`,
        sortable_fields: ['titre', 'date', 'ordre'], ...(nom === 'actes' || nom === 'annuaire' ? { view_groups: [{ label: 'Nature', field: 'type' }] } : nom !== 'agenda' ? { view_groups: [{ label: 'Thème', field: 'categorie' }] } : {}),
        fields: champsCollection(nom),
      })),
      reglagesSite,
    ],
  };
}

installerDecap();
// Leaflet pour la mini-carte du widget « position » (public/admin/position.js), depuis node_modules
if (existsSync(join(R, 'node_modules/leaflet/dist/leaflet.js'))) {
  const dest = join(ADMIN, 'leaflet');
  mkdirSync(dest, { recursive: true });
  for (const f of ['leaflet.js', 'leaflet.css']) cpSync(join(R, 'node_modules/leaflet/dist', f), join(dest, f));
  cpSync(join(R, 'node_modules/leaflet/dist/images'), join(dest, 'images'), { recursive: true });
}
const cfg = config();
writeFileSync(join(ADMIN, 'config.yml'), '# Généré par scripts/decap.ts — ne pas modifier à la main.\n' + stringify(cfg, { lineWidth: 0 }));
// Même configuration en JSON : l'éditeur la filtre pour un rédacteur (seulement ses rubriques), sans analyseur YAML
writeFileSync(join(ADMIN, 'config.json'), JSON.stringify(cfg));
console.log('public/admin/config.yml généré');
void taxonomies;
