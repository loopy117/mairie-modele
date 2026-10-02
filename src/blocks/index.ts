import Hero from './Hero.astro';
import Texte from './Texte.astro';
import TexteImage from './TexteImage.astro';
import Features from './Features.astro';
import Galerie from './Galerie.astro';
import Slider from './Slider.astro';
import Cta from './Cta.astro';
import Faq from './Faq.astro';
import Chiffres from './Chiffres.astro';
import Boucle from './Boucle.astro';
import Formulaire from './Formulaire.astro';
import Tarifs from './Tarifs.astro';
import Legal from './Legal.astro';
import Carte from './Carte.astro';
import Lettre from './Lettre.astro';
import type { NomBloc } from '../schemas/blocs';

export const composantsBlocs: Record<NomBloc, any> = {
  hero: Hero, texte: Texte, 'texte-image': TexteImage, features: Features, galerie: Galerie,
  slider: Slider, cta: Cta, faq: Faq, chiffres: Chiffres, formulaire: Formulaire, boucle: Boucle, tarifs: Tarifs, legal: Legal, carte: Carte, lettre: Lettre,
};
