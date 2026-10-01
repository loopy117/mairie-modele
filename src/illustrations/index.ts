import PageSpeed from './PageSpeed.astro';
import type { nomsIllustrations } from './noms';

export const composantsIllustrations: Record<(typeof nomsIllustrations)[number], any> = {
  pagespeed: PageSpeed,
};
