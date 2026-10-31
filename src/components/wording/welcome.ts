import type { Level } from '@/domain/training/level';

/**
 * What the introduction says, and the three places it offers to start from.
 *
 * It is the one screen whose words are the product rather than a reading of the
 * domain — which is why they are here, where they can be read in one place and
 * changed without opening a screen.
 */

export interface Step {
  readonly title: string;
  readonly body: string;
  readonly cta: string;
}

export const STEPS: readonly Step[] = [
  {
    /** Two lines, as the mockup sets it: the reading and the saying are two acts. */
    title: 'Lisez la note.\nDites-la.',
    body: 'Clefsmith vous écoute et vous corrige en direct. Dix minutes entre deux cours, et la lecture devient naturelle.',
    cta: 'Continuer',
  },
  {
    title: 'Où en êtes-vous ?',
    body: 'On choisit votre première étude. Vous pourrez changer plus tard.',
    cta: 'Continuer',
  },
  {
    title: "Le micro, c'est votre outil.",
    body: "Il sert uniquement à reconnaître les noms de notes pendant l'exercice. Rien n'est enregistré.",
    cta: 'Autoriser le micro',
  },
];

export interface Start {
  readonly level: Level;
  readonly title: string;
  readonly detail: string;
}

export const STARTS: readonly Start[] = [
  { level: 1, title: 'Je débute', detail: 'On commence par do, ré, mi' },
  { level: 3, title: 'Je déchiffre', detail: "Départ à l'étude 3" },
  { level: 5, title: 'Je lis couramment', detail: "Départ à l'étude 5" },
];

/**
 * The one offered before the learner says anything: the middle one.
 *
 * Neither extreme is a good guess, and the middle one is the only answer that is
 * wrong by the same amount in both directions.
 */
export function suggested(): Level {
  return (STARTS[Math.floor(STARTS.length / 2)] as Start).level;
}
