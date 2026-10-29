import { type Notation, nameOf } from '@/domain/notation/naming';
import type { Degree } from '@/domain/notation/pitch';
import type { Drill } from '@/domain/training/drill';

/**
 * What the exercise screen says, in the learner's words.
 *
 * The reading is the domain's; what is here is how far along it reads, and which
 * of the three things the feedback zone has to say. One zone, three states: a
 * screen that stacks them shows an empty box two thirds of the time.
 */

/** Before anything has been said, and after each note is answered. */
export const LISTENING = "J'écoute…";
export const HINT = 'Dites la note surlignée';
export const RIGHT = 'Juste';
export const WRONG = 'Faux';
export const REWIND = 'On reprend au début de la mesure';

export type Verdict = 'waiting' | 'right' | 'wrong';

export function verdictOf(last: Drill['last']): Verdict {
  if (last === undefined) {
    return 'waiting';
  }

  return last.right ? 'right' : 'wrong';
}

/**
 * `7 / 32` — the note being read, counted from one.
 *
 * The last answer leaves the reading past the last note, and a session that ends
 * on `33 / 32` reads as a bug. It holds on the last one instead.
 */
export function countLine(at: number, total: number): string {
  return `${Math.min(at + 1, total)} / ${total}`;
}

/**
 * How much of the session is behind the learner, as the bar draws it.
 *
 * A session is never empty and the reading never runs past its last note, so
 * neither a division by zero nor a share over one is defended against here.
 */
export function shareOf(at: number, total: number): number {
  return at / total;
}

/** `C'était un do` — the note the learner missed, named rather than pointed at. */
export function expectedLine(degree: Degree, notation: Notation): string {
  return `C'était un ${nameOf(degree, notation)}`;
}
