/**
 * Index du site : toutes les URL générées, avec leur titre et leur statut.
 * Pur TypeScript, partagé par le rendu (menu, fil d'Ariane) et la validation.
 */
import { reglages, categoriesArchive } from './collections';
import parcours from '../../data/parcours.json' with { type: 'json' };
import { urlPage, urlElement, urlArchive, urlCategorie } from './urls';
import { estPublie, type Element } from './requete';
import type { NomCollection } from '../schemas/collections';

export interface EntreeIndex { url: string; titre: string; publie: boolean; type: 'page' | 'element' | 'archive' | 'categorie'; collection?: NomCollection; id?: string; resume?: string; ancres?: string[] }

export function construireIndex(pages: Element[], collections: Record<NomCollection, Element[]>, taxonomies: { metiers: Record<string, string> }): Map<string, EntreeIndex> {
  const index = new Map<string, EntreeIndex>();
  for (const p of pages) {
    const url = urlPage(p.id);
    index.set(url, { url, titre: p.data.titre, publie: p.data.statut !== 'brouillon', type: 'page', id: p.id, ancres: p.data.ancres });
  }
  for (const [nom, liste] of Object.entries(collections) as [NomCollection, Element[]][]) {
    const r = reglages[nom];
    if (r.archive) {
      // Archive vide (aucun élément publié) : pas de page générée, liens masqués
      index.set(urlArchive(nom), { url: urlArchive(nom), titre: r.libelle, publie: liste.some((e) => estPublie(e)), type: 'archive', collection: nom });
      if (r.archive.parCategorie) {
        const { champ, libelles } = categoriesArchive(nom);
        const cats = new Set(liste.filter((e) => estPublie(e)).map((e) => e.data[champ]).filter(Boolean));
        for (const c of cats) index.set(urlCategorie(nom, c), { url: urlCategorie(nom, c), titre: `${r.libelle} · ${libelles[c] ?? c}`, publie: true, type: 'categorie', collection: nom });
      }
    }
    if (r.detail) {
      for (const e of liste) {
        const url = urlElement(nom, e.id);
        index.set(url, { url, titre: e.data.titre, publie: estPublie(e), type: 'element', collection: nom, id: e.id, resume: e.data.resume, ancres: e.data.ancres });
      }
    }
  }
  // Vues générées à partir des contenus (src/pages/aujourdhui.astro, carte.astro, parcours)
  index.set('/aujourdhui', { url: '/aujourdhui', titre: "Aujourd'hui dans la commune", publie: true, type: 'page' });
  index.set('/recherche', { url: '/recherche', titre: 'Rechercher dans le site', publie: true, type: 'page' });
  if ((collections as any).lieux?.some((e: Element) => estPublie(e) && e.data.latitude != null)) index.set('/carte', { url: '/carte', titre: 'Carte de la commune', publie: true, type: 'page' });
  for (const [slug, p] of Object.entries(parcours)) {
    const publie = Object.values(collections).some((l) => l.some((e) => estPublie(e) && (e.data.publics ?? []).includes(slug)));
    index.set(`/parcours/${slug}`, { url: `/parcours/${slug}`, titre: p.titre, publie, type: 'page' });
  }
  return index;
}

export interface EntreeNav { page?: string; element?: string; collection?: NomCollection; href?: string; label?: string; enfants?: EntreeNav[] }
export interface LienResolu { label: string; href: string; visible: boolean; probleme?: { grave: boolean; message: string }; enfants?: LienResolu[] }

/** Transforme une entrée de menu.json / footer.json en lien. Une cible en brouillon est masquée. */
export function resoudreEntree(e: EntreeNav, index: Map<string, EntreeIndex>): LienResolu {
  let url: string | undefined;
  if (e.page) url = e.page;
  else if (e.element) { const [col, ...id] = e.element.split('/'); url = urlElement(col as NomCollection, id.join('/')); }
  else if (e.collection) url = urlArchive(e.collection);
  else if (e.href) return { label: e.label ?? e.href, href: e.href, visible: true };

  const cible = url ? index.get(url) : undefined;
  const enfants = e.enfants?.map((x) => resoudreEntree(x, index));
  if (!url || !cible) {
    return { label: e.label ?? url ?? '?', href: url ?? '#', visible: false, enfants, probleme: { grave: true, message: `cible introuvable : ${JSON.stringify(e)}` } };
  }
  if (!cible.publie) {
    return { label: e.label ?? cible.titre, href: url, visible: false, enfants, probleme: { grave: false, message: `« ${cible.titre} » (${url}) est en brouillon : entrée masquée` } };
  }
  return { label: e.label ?? cible.titre, href: url, visible: true, enfants };
}
