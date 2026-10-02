/**
 * Liste des contenus publiés pour l'espace client (après le build) : dist/admin/diffusion.json.
 * Sert à l'écran « Diffuser » (messages pour les réseaux) et à la lettre d'information : titre, résumé, image de
 * partage (1200 × 630, générée par scripts/partage.mjs), date de mise en ligne (historique Git), réseaux et lettre
 * cochés dans l'éditeur, texte.
 */
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import { parse as parseYaml } from 'yaml';
import { reglages } from '../src/lib/collections';
import { urlPage, urlElement } from '../src/lib/urls';
import { estPublie } from '../src/lib/requete';
import { nomsCollections } from '../src/schemas/collections';
import site from '../data/site.json' with { type: 'json' };
import partage from '../data/partage.json' with { type: 'json' };

const DIST = 'dist';
const lister = (d: string): string[] => (!existsSync(d) ? [] : readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? lister(p) : [p]; }));
const dateGit = (f: string) => {
  try { return execFileSync('git', ['log', '--diff-filter=A', '--follow', '--format=%cI', '--', f], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim().split('\n').filter(Boolean).at(-1); } catch { return undefined; }
};
const sansMarkdown = (t: string) => t.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[#*_>`|]/g, '').replace(/\s+/g, ' ').trim();
const textes = (v: any, acc: string[] = []): string[] => {
  if (typeof v === 'string') { if (v.length > 20 && !v.startsWith('/') && !/^https?:/.test(v)) acc.push(v); }
  else if (Array.isArray(v)) v.forEach((x) => textes(x, acc));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (!['seo', 'image', 'images', 'src', 'href', 'brief', 'ancres'].includes(k)) textes(x, acc);
  return acc;
};
const image = (url: string) => {
  const nom = url === '/' ? 'accueil' : url.replace(/^\/|\/$/g, '').replace(/\//g, '--');
  return existsSync(join(DIST, 'partage', `${nom}.png`)) ? `/partage/${nom}.png` : undefined;
};
const iso = (d: any) => (d ? new Date(d).toISOString() : undefined);

const contenus: any[] = [];
for (const f of lister('content/pages').filter((x) => x.endsWith('.yaml'))) {
  const d = parseYaml(readFileSync(f, 'utf8')) ?? {};
  if (d.statut === 'brouillon' || d.seo?.noindex) continue;
  const id = relative('content/pages', f).replace(/\.yaml$/, '');
  const url = urlPage(id);
  contenus.push({ url, titre: d.titre, resume: d.seo?.description ?? '', type: 'Page', date: dateGit(f), image: image(url),
    diffuser: d.diffuser ?? [], lettre: !!d.lettre, sujets: d.sujets ?? [], texte: sansMarkdown(textes(d.sections).join(' ')).slice(0, 3000) });
}
for (const nom of nomsCollections) {
  if (!reglages[nom].detail) continue;
  for (const f of lister(join('content', nom)).filter((x) => x.endsWith('.md'))) {
    const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(readFileSync(f, 'utf8'));
    if (!m) continue;
    const d = parseYaml(m[1]) ?? {};
    const id = relative(join('content', nom), f).replace(/\.md$/, '');
    if (!estPublie({ id, data: d } as any)) continue;
    const url = urlElement(nom, id);
    contenus.push({ url, titre: d.titre, resume: d.resume ?? '', type: reglages[nom].libelle, date: dateGit(f) ?? iso(d.date), date_contenu: iso(d.date), image: image(url),
      diffuser: d.diffuser ?? [], lettre: !!d.lettre, sujets: d.sujets ?? [], texte: sansMarkdown(m[2]).slice(0, 3000) });
  }
}
contenus.sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')));
mkdirSync(join(DIST, 'admin'), { recursive: true });
writeFileSync(join(DIST, 'admin/diffusion.json'), JSON.stringify({
  genere: new Date().toISOString(),
  site: { nom: site.nom, ville: site.adresse?.ville, adresse: site.adresse?.rue, code_postal: site.adresse?.code_postal, couleur: (partage as any).fond_app ?? (partage as any).accent },
  contenus: contenus.slice(0, 300),
}));
console.log(`Diffusion : ${contenus.length} contenu(s) publiés → dist/admin/diffusion.json`);
