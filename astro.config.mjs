import { defineConfig } from 'astro/config';
import site from './data/site.json' with { type: 'json' };

// SITE_URL (fourni par le workflow de déploiement) remplace l'URL de data/site.json :
// le même contenu peut être publié sur une adresse de recette puis sur le domaine final.
export default defineConfig({
  site: process.env.SITE_URL || site.url,
  trailingSlash: 'never',
  // CSS intégré à chaque page : aucune feuille de style ne bloque le premier affichage
  build: { inlineStylesheets: 'always' },
});
