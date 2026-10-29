import type { Tone } from '@/components/ui/text';
import { type Notation, nameOf } from '@/domain/notation/naming';
import type { Degree } from '@/domain/notation/pitch';

/**
 * What the progress screen says, in the learner's words.
 *
 * The scores are the domain's; what is here is only how they are read out — and
 * what is said in place of a score that has not been earned yet.
 */

/** A figure nobody has earned. Shown rather than hidden: an em dash says one is coming. */
export const NO_FIGURE = '—';

/** A degree never met has no score. Zero is a score, and reads as one. */
export function scoreLine(score: number | undefined): string {
  return score === undefined ? NO_FIGURE : `${score}`;
}

/** Below this a degree is called out in the error colour; below the next, it is on its way. */
const WORRYING = 70;
const UNSTEADY = 80;

export function toneOf(score: number | undefined): Tone {
  if (score === undefined) {
    return 'muted';
  }

  if (score < WORRYING) {
    return 'bad';
  }

  return score < UNSTEADY ? 'late' : 'ink';
}

/** `Réviser do et fa` — weakest first, which is the order they were asked for. */
export function reviewLine(weakest: readonly Degree[], notation: Notation): string {
  return `Réviser ${weakest.map((degree) => nameOf(degree, notation)).join(' et ')}`;
}
