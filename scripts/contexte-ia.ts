/**
 * Contexte fourni à l'assistant de l'espace client (xmedia·ai) : ce que le site
 * contient, les règles et le catalogue. Régénéré à chaque build, jamais servi au public
 * (public/xmedia-ai/contexte/, jamais servi : lu par le code commun de l'espace client via XMEDIA_SITE).
 */
import { readFileSync, readdirSync, existsSync, statSync, mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { urlPage, urlElement } from '../src/lib/urls';
import { nomsCollections } from '../src/schemas/collections';
import site from '../data/site.json' with { type: 'json' };
import menu from '../data/menu.json' with { type: 'json' };
import taxonomies from '../data/taxonomies.json' with { type: 'json' };

const R = process.cwd();
const lister = (dir: string, ext: string): string[] =>
  !existsSync(dir) ? [] : readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? lister(p, ext) : p.endsWith(ext) ? [p] : []; });

const pages = lister(join(R, 'content/pages'), '.yaml').map((f) => {
  const d = parseYaml(readFileSync(f, 'utf8'));
  const id = relative(join(R, 'content/pages'), f).replace(/\.yaml$/, '');
  return {
    url: urlPage(id), fichier: relative(R, f), titre: d.titre, statut: d.statut ?? 'publie', role: d.role,
    sections: (d.sections ?? []).map((s: any) => [s.block, s.variant, s.titre].filter(Boolean).join(' · ')),
  };
});
const collections = Object.fromEntries(nomsCollections.map((nom) => [nom, lister(join(R, 'content', nom), '.md').map((f) => {
  const m = readFileSync(f, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const d = m ? parseYaml(m[1]) : {};
  const id = relative(join(R, 'content', nom), f).replace(/\.md$/, '');
  return { id, url: urlElement(nom, id), titre: d.titre, statut: d.statut ?? 'publie', categorie: d.categorie, lieu: d.lieu ?? d.ville, date: d.date, resume: d.resume, role: d.role ?? (nom === 'zones' ? 'seo' : undefined) };
})]));

const sortie = join(R, 'public/xmedia-ai/contexte');
mkdirSync(sortie, { recursive: true });
// Grille de prix : l'assistant peut répondre sur les tarifs sans les inventer
const tarifs = existsSync(join(R, 'data/tarifs.json')) ? JSON.parse(readFileSync(join(R, 'data/tarifs.json'), 'utf8')) : undefined;
writeFileSync(join(sortie, 'site.json'), JSON.stringify({ infos: site, menu, taxonomies, tarifs, pages, collections }, null, 1));
copyFileSync(join(R, 'ai/regles.md'), join(sortie, 'regles.md'));
// Formulaires métier : le serveur vérifie les envois avec cette copie (spec partie 5)
if (existsSync(join(R, 'data/formulaires.json'))) copyFileSync(join(R, 'data/formulaires.json'), join(sortie, 'formulaires.json'));
copyFileSync(join(R, 'ai/catalogue.md'), join(sortie, 'catalogue.md'));
console.log(`contexte xmedia·ai : ${pages.length} pages, ${Object.values(collections).flat().length} éléments`);
