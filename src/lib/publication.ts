/**
 * Documents des actes et téléchargements : taille, empreinte SHA-256 du PDF et date de mise en ligne.
 * La date est celle où le fichier de contenu est arrivé sur la branche publiée (premier commit qui l'ajoute :
 * la publication depuis l'éditeur). Elle est lue dans l'historique Git au build (dépôt cloné en entier).
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

export interface InfosDocument { url: string; taille: string; octets: number; empreinte: string }

const cache = new Map<string, InfosDocument | null>();
export function infosDocument(url: string): InfosDocument | null {
  if (cache.has(url)) return cache.get(url)!;
  const fichier = 'media/' + url.replace(/^\/img\//, '');
  let r: InfosDocument | null = null;
  if (existsSync(fichier)) {
    const b = readFileSync(fichier);
    const ko = b.length / 1024;
    r = { url, octets: b.length, empreinte: createHash('sha256').update(b).digest('hex'), taille: ko < 1000 ? `${Math.max(1, Math.round(ko))} Ko` : `${(ko / 1024).toFixed(1).replace('.', ',')} Mo` };
  }
  cache.set(url, r);
  return r;
}

/** Date de mise en ligne d'un fichier de contenu (content/actes/<id>.md), ou undefined s'il n'est pas encore publié. */
export function miseEnLigne(fichierSource: string): Date | undefined {
  try {
    const l = execFileSync('git', ['log', '--diff-filter=A', '--follow', '--format=%cI', '--', fichierSource], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .trim().split('\n').filter(Boolean);
    return l.length ? new Date(l[l.length - 1]) : undefined;
  } catch {
    return undefined;
  }
}

export const dateLongue = (d?: Date) => (d ? new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d)) : '');
export const dateHeure = (d: Date) => new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }).format(d);
