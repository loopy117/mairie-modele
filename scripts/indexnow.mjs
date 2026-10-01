// IndexNow : prévient Bing (et Yandex, Seznam, Naver… via api.indexnow.org) des pages ajoutées, modifiées
// ou supprimées, dès la mise en ligne, sans attendre leur prochain passage. Google n'utilise pas IndexNow.
//
//   node scripts/indexnow.mjs preparer           (build) clé dans dist/<clé>.txt + empreintes des pages du sitemap
//   node scripts/indexnow.mjs envoyer <ancien>   (après rsync) compare avec les empreintes de la version précédente
//                                               et envoie les adresses qui ont changé
// Rien n'est fait si NOINDEX=1 (recette, site pas encore ouvert) ou sans SITE_URL.
// Clé : variable INDEXNOW_CLE si elle existe, sinon dérivée de l'adresse du site (la clé est publique par nature :
// elle sert seulement à prouver que l'envoi vient du site, en étant publiée à sa racine).
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const FICHIER = 'indexnow-empreintes.json';
const site = (process.env.SITE_URL || '').replace(/\/+$/, '');
const actif = site && process.env.NOINDEX !== '1';
const cle = (process.env.INDEXNOW_CLE || '').trim() || createHash('sha256').update(`indexnow:${site}`).digest('hex').slice(0, 32);
if (!/^[a-zA-Z0-9-]{8,128}$/.test(cle)) { console.error('INDEXNOW_CLE invalide (8 à 128 caractères a-z, A-Z, 0-9, -)'); process.exit(1); }

function pagesDuSitemap() {
  const xml = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&')).filter((u) => u.startsWith(site + '/'));
}

function fichierDe(url) {
  const chemin = decodeURIComponent(new URL(url).pathname);
  if (chemin.includes('..')) return null;
  for (const f of [join(DIST, chemin, 'index.html'), join(DIST, chemin.replace(/\/$/, '') + '.html'), join(DIST, chemin)]) {
    if (existsSync(f) && f.endsWith('.html')) return f;
  }
  return null;
}

// Empreinte du contenu, sans les noms de fichiers générés (_astro/xxx.HASH.css) qui changent à chaque build de style
const empreinte = (html) => createHash('sha256').update(html.replace(/\/_astro\/[^"'\s)]+/g, '/_astro/')).digest('hex').slice(0, 20);

function preparer() {
  if (!actif) { console.log('IndexNow : site non indexable (NOINDEX=1 ou sans SITE_URL), rien à préparer'); return; }
  writeFileSync(join(DIST, `${cle}.txt`), cle);
  const pages = {};
  for (const url of pagesDuSitemap()) {
    const f = fichierDe(url);
    if (f) pages[url] = empreinte(readFileSync(f, 'utf8'));
  }
  writeFileSync(join(DIST, FICHIER), JSON.stringify({ site, pages }));
  console.log(`IndexNow : ${Object.keys(pages).length} page(s) prête(s)`);
}

async function envoyer(ancienFichier) {
  if (!actif) { console.log('IndexNow : site non indexable, aucun envoi'); return; }
  const nouveau = JSON.parse(readFileSync(join(DIST, FICHIER), 'utf8')).pages;
  let ancien = null;
  try {
    const a = JSON.parse(readFileSync(ancienFichier, 'utf8'));
    if (a && a.site === site && a.pages && typeof a.pages === 'object') ancien = a.pages;
  } catch { /* première mise en ligne indexable : tout est nouveau */ }
  const urls = ancien === null
    ? Object.keys(nouveau)
    : [...Object.keys(nouveau).filter((u) => ancien[u] !== nouveau[u]), ...Object.keys(ancien).filter((u) => !(u in nouveau))];
  if (!urls.length) { console.log('IndexNow : aucune page modifiée'); return; }
  const hote = new URL(site).host;
  // La clé doit être en ligne avant l'envoi (les moteurs la vérifient)
  const verif = await fetch(`${site}/${cle}.txt`).then((r) => (r.ok ? r.text() : '')).catch(() => '');
  if (verif.trim() !== cle) { console.log(`::warning::IndexNow : ${site}/${cle}.txt pas encore accessible, envoi annulé`); return; }
  for (let i = 0; i < urls.length; i += 10000) {
    const lot = urls.slice(i, i + 10000);
    const r = await fetch(process.env.INDEXNOW_API || 'https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: hote, key: cle, keyLocation: `${site}/${cle}.txt`, urlList: lot }),
    }).catch((e) => ({ ok: false, status: 0, text: async () => String(e) }));
    // 200 : reçu ; 202 : reçu, clé en cours de vérification
    if (r.ok) console.log(`IndexNow : ${lot.length} adresse(s) envoyée(s) (HTTP ${r.status})\n  ${lot.join('\n  ')}`);
    else console.log(`::warning::IndexNow : envoi refusé (HTTP ${r.status}) ${(await r.text()).slice(0, 200)}`);
  }
}

const [commande, arg] = process.argv.slice(2);
if (commande === 'preparer') preparer();
else if (commande === 'envoyer') await envoyer(arg || 'indexnow-ancien.json');
else { console.error('usage : node scripts/indexnow.mjs preparer | envoyer <ancien.json>'); process.exit(1); }
