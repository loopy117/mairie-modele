/**
 * Index de recherche du site (Pagefind), après le build : texte complet des pages (zone data-pagefind-body
 * de src/layouts/Base.astro) et texte des PDF (actes, documents, documents des projets), extrait avec unpdf.
 * Écrit dist/pagefind/ ; la page /recherche le charge à la demande. Aucun service extérieur, aucun cookie.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import * as pagefind from 'pagefind';
import { extractText, getDocumentProxy } from 'unpdf';

const DIST = 'dist';
const SOURCES = { actes: 'Actes officiels', documents: 'Documents', projets: 'Projets' };
const MAX = 60000;   // caractères indexés par PDF

const { index, errors } = await pagefind.createIndex({ forceLanguage: 'fr' });
if (errors.length) throw new Error(errors.join('\n'));
const pages = await index.addDirectory({ path: DIST });
if (pages.errors.length) throw new Error(pages.errors.join('\n'));

// PDF : un résultat par fichier, titré comme dans le contenu qui le publie
const pdfs = [];
for (const [col, type] of Object.entries(SOURCES)) {
  const dossier = join('content', col);
  if (!existsSync(dossier)) continue;
  for (const f of readdirSync(dossier).filter((x) => x.endsWith('.md'))) {
    const m = /^---\n([\s\S]*?)\n---/.exec(readFileSync(join(dossier, f), 'utf8'));
    if (!m) continue;
    const d = parseYaml(m[1]) ?? {};
    if (d.statut === 'brouillon') continue;
    if (d.fichier) pdfs.push({ url: d.fichier, titre: d.titre, type });
    for (const doc of d.documents ?? []) pdfs.push({ url: doc.fichier, titre: `${doc.titre} · ${d.titre}`, type });
  }
}
let n = 0;
for (const p of pdfs) {
  const chemin = join('media', p.url.replace(/^\/img\//, ''));
  if (!existsSync(chemin)) continue;
  try {
    const pdf = await getDocumentProxy(new Uint8Array(readFileSync(chemin)));
    const { text } = await extractText(pdf, { mergePages: true });
    const contenu = String(text).replace(/\s+/g, ' ').trim().slice(0, MAX);
    if (!contenu) continue;
    const r = await index.addCustomRecord({ url: p.url, content: contenu, language: 'fr', meta: { title: `${p.titre} (PDF)` }, filters: { type: [p.type] } });
    if (r.errors.length) console.warn(`⚠ ${p.url} : ${r.errors.join(', ')}`); else n++;
  } catch (e) {
    console.warn(`⚠ ${p.url} : texte illisible (${e.message}) — PDF scanné ?`);
  }
}

const ecrit = await index.writeFiles({ outputPath: join(DIST, 'pagefind') });
if (ecrit.errors.length) throw new Error(ecrit.errors.join('\n'));
await pagefind.close();
console.log(`Recherche : ${pages.page_count} page(s) et ${n} PDF indexés → ${DIST}/pagefind`);
