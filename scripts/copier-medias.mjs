// Copie media/ → dist/img/ après le build.
// Le site utilise les versions optimisées (/_astro/…) ; ces originaux servent
// uniquement aux aperçus de l'éditeur /admin (Decap affiche les images par leur
// chemin /img/…). Ils ne sont pas indexés et pas mis en cache longtemps.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';

if (!existsSync('dist')) throw new Error('dist/ absent : lancer astro build avant.');
// media/ peut être absent (site neuf, dossier vide non suivi par Git)
mkdirSync('dist/img', { recursive: true });
if (existsSync('media')) cpSync('media', 'dist/img', { recursive: true });
writeFileSync('dist/img/.htaccess', `Options -Indexes
<IfModule mod_headers.c>
  Header set X-Robots-Tag "noindex"
  Header set Cache-Control "public, max-age=300"
</IfModule>
`);
console.log('Médias copiés dans dist/img (aperçus de l\'éditeur).');
