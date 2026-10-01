/**
 * Validation du contenu (spec §11). Lancée par l'IA après chaque génération,
 * et avant chaque build. Messages : fichier › chemin : problème.
 *   npm run validate            → rapport lisible, code 1 si erreur bloquante
 *   npm run validate -- --json  → rapport JSON (pour l'IA)
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { page as pageSchema } from '../src/schemas/page';
import { section as sectionSchema } from '../src/schemas/blocs';
import { collectionSchemas, nomsCollections, type NomCollection } from '../src/schemas/collections';
import { construireIndex, resoudreEntree } from '../src/lib/index-site';
import { executer, estPublie, type Element } from '../src/lib/requete';
import { urlPage, urlElement } from '../src/lib/urls';
import taxonomies from '../data/taxonomies.json' with { type: 'json' };
import menu from '../data/menu.json' with { type: 'json' };
import footer from '../data/footer.json' with { type: 'json' };
import siteDonnees from '../data/site.json' with { type: 'json' };
import { site as siteSchema } from '../src/schemas/site';
import formulairesDonnees from '../data/formulaires.json' with { type: 'json' };
import alerteDonnees from '../data/alerte.json' with { type: 'json' };
import collectesDonnees from '../data/collectes.json' with { type: 'json' };
import parcoursDonnees from '../data/parcours.json' with { type: 'json' };
import { alerte } from '../src/schemas/alerte';
import { formulaires as formulairesSchema } from '../src/schemas/formulaires';
import { tarifs as tarifsSchema } from '../src/schemas/tarifs';
import { manquesLegal } from '../src/lib/legal';

type Niveau = 'erreur' | 'avertissement';
const rapport: { niveau: Niveau; fichier: string; chemin: string; message: string }[] = [];
const signaler = (niveau: Niveau, fichier: string, chemin: (string | number)[] | string, message: string) =>
  rapport.push({ niveau, fichier, chemin: Array.isArray(chemin) ? formater(chemin) : chemin, message });
const formater = (c: (string | number | symbol)[]) => c.map((x, i) => (typeof x === 'number' ? `[${x}]` : (i ? '.' : '') + String(x))).join('');

const RACINE = process.cwd();
const lister = (dir: string, ext: string): string[] =>
  !existsSync(dir) ? [] : readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? lister(p, ext) : p.endsWith(ext) ? [p] : []; });
const rel = (p: string) => relative(RACINE, p);

function lireYaml(fichier: string, texte: string): any {
  try { return parseYaml(texte, { prettyErrors: true }); }
  catch (e: any) { signaler('erreur', fichier, 'yaml', `YAML invalide : ${e.message.split('\n')[0]}`); return undefined; }
}

/* ------------------------------ 1. Schémas ------------------------------ */
const pages: (Element & { fichier: string })[] = [];
for (const f of lister(join(RACINE, 'content/pages'), '.yaml')) {
  const brut = lireYaml(rel(f), readFileSync(f, 'utf8'));
  if (brut === undefined) continue;
  const r = pageSchema.safeParse(brut);
  if (!r.success) { for (const i of r.error.issues) signaler('erreur', rel(f), i.path as any, i.message); continue; }
  pages.push({ id: relative(join(RACINE, 'content/pages'), f).replace(/\.yaml$/, ''), data: r.data, fichier: rel(f) });
}

const collections = {} as Record<NomCollection, (Element & { fichier: string; corps: string })[]>;
for (const nom of nomsCollections) {
  collections[nom] = [];
  for (const f of lister(join(RACINE, 'content', nom), '.md')) {
    const texte = readFileSync(f, 'utf8');
    const m = texte.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!m) { signaler('erreur', rel(f), 'frontmatter', 'frontmatter YAML absent (--- ... ---)'); continue; }
    const brut = lireYaml(rel(f), m[1]);
    if (brut === undefined) continue;
    const r = collectionSchemas[nom].safeParse(brut);
    if (!r.success) { for (const i of r.error.issues) signaler('erreur', rel(f), i.path as any, i.message); continue; }
    (r.data.sections ?? []).forEach((s: unknown, k: number) => {
      const rs = sectionSchema.safeParse(s);
      if (!rs.success) for (const i of rs.error.issues) signaler('erreur', rel(f), ['sections', k, ...(i.path as any)], i.message);
    });
    collections[nom].push({ id: relative(join(RACINE, 'content', nom), f).replace(/\.md$/, ''), data: r.data, fichier: rel(f), corps: m[2] });
  }
}

// data/site.json : coordonnées et données structurées de l'entreprise
{
  const r = siteSchema.safeParse(siteDonnees);
  if (!r.success) for (const i of r.error.issues) signaler('erreur', 'data/site.json', i.path as any, i.message);
  else {
    const s = r.data;
    if (s.types_schema.length === 1 && s.types_schema[0] === 'LocalBusiness') signaler('avertissement', 'data/site.json', 'types_schema', 'type générique « LocalBusiness » : choisir le type le plus précis du métier (liste dans src/schemas/site.ts)');
    if (!s.horaires_detail?.length) signaler('avertissement', 'data/site.json', 'horaires_detail', 'horaires non lisibles par Google : les déduire du champ « horaires »');
    if (!s.villes?.length) signaler('avertissement', 'data/site.json', 'villes', 'villes desservies non déclarées : seule la ville du siège est indiquée à Google');
  }
}

// data/alerte.json : bandeau d'alerte de la commune
{
  const r = alerte.safeParse(alerteDonnees);
  if (!r.success) for (const i of r.error.issues) signaler('erreur', 'data/alerte.json', i.path as any, i.message);
}

// data/collectes.json et data/parcours.json (vues « Aujourd'hui » et parcours)
{
  const J = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  collectesDonnees.collectes.forEach((c: any, i: number) => {
    if (!c.type) signaler('erreur', 'data/collectes.json', ['collectes', i, 'type'], 'type de collecte manquant');
    for (const j of c.jours ?? []) if (!J.includes(j)) signaler('erreur', 'data/collectes.json', ['collectes', i, 'jours'], `jour inconnu : « ${j} »`);
  });
  for (const [slug, p] of Object.entries(parcoursDonnees as Record<string, any>)) if (!p.titre || !p.intro) signaler('erreur', 'data/parcours.json', slug, 'titre et intro obligatoires');
}

// data/formulaires.json : formulaires métier (spec partie 5)
{
  const r = formulairesSchema.safeParse(formulairesDonnees);
  if (!r.success) for (const i of r.error.issues) signaler('erreur', 'data/formulaires.json', i.path as any, i.message);
}

// data/tarifs.json : grille de prix (facultative), obligatoire dès qu'une page utilise le bloc tarifs
{
  const fichier = join(RACINE, 'data/tarifs.json');
  if (existsSync(fichier)) {
    const r = tarifsSchema.safeParse(JSON.parse(readFileSync(fichier, 'utf8')));
    if (!r.success) for (const i of r.error.issues) signaler('erreur', 'data/tarifs.json', i.path as any, i.message);
  } else {
    for (const p of pages) (p.data.sections ?? []).forEach((s: any, k: number) => {
      if (s?.block === 'tarifs') signaler('erreur', p.fichier, ['sections', k], 'bloc tarifs sans data/tarifs.json');
    });
  }
}

/* ------------------------ 2. Index et navigation ------------------------ */
const index = construireIndex(pages, collections as any, taxonomies);
const verifierNav = (fichier: string, liste: any[], chemin: string) =>
  liste.forEach((e, i) => {
    const r = resoudreEntree(e, index);
    if (r.probleme) signaler(r.probleme.grave ? 'erreur' : 'avertissement', fichier, `${chemin}[${i}]`, r.probleme.message);
    if (e.enfants) verifierNav(fichier, e.enfants, `${chemin}[${i}].enfants`);
  });
verifierNav('data/menu.json', menu.principal, 'principal');
if (menu.principal.length > 7) signaler('erreur', 'data/menu.json', 'principal', `7 entrées maximum (${menu.principal.length})`);
footer.colonnes.forEach((c, i) => verifierNav('data/footer.json', c.liens, `colonnes[${i}].liens`));
verifierNav('data/footer.json', footer.legal, 'legal');

/* ------------------- 3. Liens, images, marqueurs, boucles ------------------- */
const imagesUtilisees = new Set<string>();
const provisoires = new Set<string>();

function parcourir(v: any, chemin: (string | number)[], visite: (v: any, chemin: (string | number)[]) => void) {
  visite(v, chemin);
  if (Array.isArray(v)) v.forEach((x, i) => parcourir(x, [...chemin, i], visite));
  else if (v && typeof v === 'object' && !(v instanceof Date)) for (const [k, x] of Object.entries(v)) parcourir(x, [...chemin, k], visite);
}

function verifierLien(fichier: string, chemin: (string | number)[], href: string) {
  if (!href.startsWith('/')) return;
  const url = href.split('#')[0].replace(/\/$/, '') || '/';
  const cible = index.get(url);
  if (!cible) signaler('erreur', fichier, chemin, `lien cassé : ${href}`);
  else if (!cible.publie) signaler('erreur', fichier, chemin, `lien vers une page en brouillon : ${href} (« ${cible.titre} »)`);
}

function verifierContenu(fichier: string, donnees: any, publie: boolean, courant?: Element) {
  // Boucles vides masquées : rien n'est affiché, leurs liens (« tout voir ») ne sont pas vérifiés
  const masquees: string[] = [];
  const dansMasquee = (chemin: (string | number)[]) => masquees.some((m) => chemin.join('/').startsWith(m + '/'));
  parcourir(donnees, [], (v, chemin) => {
    const cle = chemin.at(-1);
    if (typeof v === 'string') {
      if (/\[À COMPLÉTER/i.test(v)) signaler(publie ? 'erreur' : 'avertissement', fichier, chemin, `marqueur à compléter : « ${v.match(/\[À COMPLÉTER[^\]]*\]/i)?.[0]} »${publie ? ' (bloque la publication)' : ''}`);
      if (publie && cle === 'href' && !dansMasquee(chemin)) verifierLien(fichier, chemin, v);
      if (publie) for (const m of v.matchAll(/\]\((\/[^)\s]*)\)/g)) verifierLien(fichier, chemin, m[1]);
    }
    if (typeof v === 'string' && /^\/img\/.+\.pdf$/i.test(v) && !existsSync(join(RACINE, 'media/' + v.slice(5)))) signaler('erreur', fichier, chemin, `document introuvable : media/${v.slice(5)}`);
    if (v && typeof v === 'object' && typeof v.src === 'string' && v.src.startsWith('/img/')) {
      const f = 'media/' + v.src.slice(5);
      imagesUtilisees.add(f);
      if (!existsSync(join(RACINE, f))) signaler('erreur', fichier, [...chemin, 'src'], `image introuvable : ${f}`);
      if (/provisoire/.test(f) && publie) provisoires.add(f);
      if (v.alt === '' ) signaler('avertissement', fichier, [...chemin, 'alt'], 'image marquée décorative (alt vide) : à confirmer');
    }
    if (v && typeof v === 'object' && v.block === 'boucle') {
      const txt = JSON.stringify(v);
      if (!courant && txt.includes('$courant')) { signaler('erreur', fichier, chemin, '$courant n\'est utilisable que dans une page de détail'); return; }
      for (const [champ, cond] of Object.entries(v.filtre ?? {})) {
        const valeurs = [cond as any].flat().flatMap((c: any) => (c && typeof c === 'object' ? [c.different, c.contient, c.contient_tous].flat() : [c])).filter((x) => typeof x === 'string' && !x.startsWith('$'));
        const permis = champ === 'categorie' ? taxonomies.metiers : champ === 'tags' ? (taxonomies.tags as any)[v.source] : undefined;
        for (const x of valeurs) if (permis && !(x in permis)) signaler('erreur', fichier, [...chemin, 'filtre', champ], `valeur « ${x} » absente de data/taxonomies.json`);
      }
      if (publie) {
        const n = executer(collections[v.source as NomCollection] ?? [], v, { courant }).length;
        if (n === 0) signaler('avertissement', fichier, chemin, `la boucle sur « ${v.source} » ne renvoie aucun élément (si_vide : ${v.si_vide ?? 'masquer'})`);
        if (n === 0 && (v.si_vide ?? 'masquer') === 'masquer') masquees.push(chemin.join('/'));
      }
    }
  });
}

for (const p of pages) {
  const publie = p.data.statut === 'publie';
  verifierContenu(p.fichier, p.data, publie);
  if (!publie) continue;
  // Règles de composition (avertissements)
  const s = p.data.sections;
  const max = p.data.gabarit === 'landing' ? 12 : 8;
  if (s.length > max) signaler('avertissement', p.fichier, 'sections', `${s.length} sections : ${max} maximum recommandé pour ce gabarit`);
  const ctas = s.filter((x: any) => x.block === 'cta').length;
  if (ctas > 2) signaler('avertissement', p.fichier, 'sections', `${ctas} blocs cta : 2 maximum recommandé`);
  const fond = (x: any) => (x.block === 'hero' && x.variant === 'plein-ecran' ? 'sombre' : x.block === 'cta' && x.variant !== 'bandeau' ? null : x.background ?? 'clair');
  for (let i = 1; i < s.length; i++) {
    const a = fond(s[i - 1]), b = fond(s[i]);
    if (a && b && a === b && a !== 'clair') signaler('avertissement', p.fichier, ['sections', i, 'background'], `deux sections consécutives sur fond « ${b} »`);
    if (a === 'clair' && b === 'clair' && s[i - 1].block === s[i].block && s[i].block !== 'texte') signaler('avertissement', p.fichier, ['sections', i], `deux blocs « ${s[i].block} » consécutifs sur fond clair : varier le fond ou la disposition`);
  }
}
for (const nom of nomsCollections) for (const e of collections[nom]) verifierContenu(e.fichier, { ...e.data, corps: e.corps }, estPublie(e), e);

// Doublons SEO
const vus = new Map<string, string>();
for (const p of pages.filter((p) => p.data.statut === 'publie')) {
  for (const [k, v] of [['titre', p.data.seo?.titre], ['description', p.data.seo?.description]] as const) {
    if (!v) continue;
    if (vus.has(k + v)) signaler('avertissement', p.fichier, `seo.${k}`, `identique à ${vus.get(k + v)}`);
    else vus.set(k + v, p.fichier);
  }
}

// Médias
for (const f of lister(join(RACINE, 'media'), '')) {
  const r = rel(f);
  if (/\.(jpe?g|png|webp)$/i.test(r) && !imagesUtilisees.has(r)) signaler('avertissement', r, '', 'image non référencée');
}
if (provisoires.size) signaler('avertissement', 'media/', '', `${provisoires.size} image(s) provisoire(s) sur des contenus publiés : à remplacer par les vraies photos`);

// Mentions légales et confidentialité (bloc legal, générées depuis data/site.json)
const siteLegal = siteSchema.safeParse(siteDonnees);
for (const p of pages) {
  if (p.data.statut === 'brouillon' || !(p.data.sections ?? []).some((b: any) => b?.block === 'legal') || !siteLegal.success) continue;
  const m = manquesLegal(siteLegal.data);
  if (m.length) signaler('erreur', p.fichier, 'sections', `informations légales manquantes : ${m.join(', ')}`);
}
// Site ouvert aux moteurs (production, NOINDEX=0) : mentions légales et confidentialité obligatoires.
// Avertissement (signalé aussi dans le résumé du déploiement) plutôt qu'erreur : un site déjà en ligne
// doit pouvoir être mis à jour en attendant les informations légales du client.
if (process.env.NOINDEX === '0') for (const u of ['/mentions-legales', '/confidentialite']) {
  if (!index.get(u)?.publie) {
    signaler('avertissement', 'content/pages', u, `OBLIGATOIRE : page à publier (site ouvert aux moteurs) : ${u} (bloc legal, statut publie)`);
    if (process.env.GITHUB_ACTIONS) console.log(`::warning::Mentions légales : la page ${u} n'est pas publiée (obligatoire pour un site en ligne)`);
  }
}

// Pages en brouillon (information)
const brouillons = pages.filter((p) => p.data.statut === 'brouillon').map((p) => urlPage(p.id));

/* ------------------------------- Rapport -------------------------------- */
const erreurs = rapport.filter((r) => r.niveau === 'erreur');
const avert = rapport.filter((r) => r.niveau === 'avertissement');
if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ ok: erreurs.length === 0, erreurs, avertissements: avert, brouillons }, null, 2));
} else {
  const ligne = (r: (typeof rapport)[number]) => `  ${r.fichier}${r.chemin ? ' › ' + r.chemin : ''} : ${r.message}`;
  if (erreurs.length) console.log(`\n✖ ${erreurs.length} erreur(s) bloquante(s)\n` + erreurs.map(ligne).join('\n'));
  if (avert.length) console.log(`\n▲ ${avert.length} avertissement(s)\n` + avert.map(ligne).join('\n'));
  if (brouillons.length) console.log(`\n· ${brouillons.length} page(s) en brouillon : ${brouillons.join(', ')}`);
  const nb = pages.length + nomsCollections.reduce((n, c) => n + collections[c].length, 0);
  console.log(`\n${erreurs.length ? '✖ Validation échouée' : '✔ Validation réussie'} — ${nb} fichiers de contenu vérifiés.\n`);
}
process.exit(erreurs.length ? 1 : 0);
