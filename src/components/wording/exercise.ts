import type { Tone } from '@/components/ui/text';
import { type Notation, nameOf } from '@/domain/notation/naming';
import type { Degree } from '@/domain/notation/pitch';
import type { Shade } from '@/domain/score/layout';
import type { Drill, Mark } from '@/domain/training/drill';

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

/**
 * How the session is to be read, said once at the top of the screen.
 *
 * It is the one line that tells the two readings apart while they are being
 * played: everything else on the exercise looks the same under a beat or not.
 */
export function paceLine(rhythmic: boolean): string {
  return rhythmic ? 'Dites chaque note en rythme' : 'Lisez à votre rythme';
}
export const RIGHT = 'Juste';
export const WRONG = 'Faux';
export const REWIND = 'On reprend au début de la mesure';
export const PAUSE = '⏸ Pause';
export const RESTART = '↺ Recommencer';
export const PAUSED = 'En pause';
export const HUSHED = 'Micro et métronome coupés. Vous reprendrez au début de la mesure.';
export const RESUME = 'Reprendre';
export const LEAVE = 'Quitter la séance';
export const OFF_BEAT = 'Juste, mais à côté du temps';
const LATE = 'Décalé';

export type Verdict = 'waiting' | 'right' | 'off-beat' | 'wrong';

export function verdictOf(last: Drill['last']): Verdict {
  if (last === undefined) {
    return 'waiting';
  }

  if (!last.right) {
    return 'wrong';
  }

  /** The note was right, so the only thing left to say about it is when it was said. */
  return last.timing === 'off-beat' ? 'off-beat' : 'right';
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

/**
 * The colour a verdict is said in.
 *
 * Off the beat has a tone of its own rather than the wrong one's: the note was
 * read right, and a learner shown red for a right note learns to distrust red.
 */
export function toneOf(verdict: Verdict): Tone {
  if (verdict === 'right') {
    return 'ok';
  }

  return verdict === 'off-beat' ? 'late' : 'bad';
}

/** What the feedback zone says under the note, once something has been said. */
export function verdictLine(verdict: Verdict): string {
  if (verdict === 'right') {
    return RIGHT;
  }

  return verdict === 'off-beat' ? OFF_BEAT : WRONG;
}

/**
 * How one note of the session is to be drawn.
 *
 * The note being read is drawn as such whatever it has been worth before: what
 * it was worth is behind the learner, and what they are being asked for is not.
 */
export function shadeOf(index: number, at: number, mark: Mark | undefined): Shade {
  if (index === at) {
    return 'current';
  }

  return mark ?? 'ahead';
}

/**
 * What the colours under the staff mean.
 *
 * `Décalé` is left out where there is no beat to be beside: a legend naming a
 * colour the session cannot produce teaches a distinction that is not there.
 */
export function legendOf(rhythmic: boolean): readonly { tone: Tone; label: string }[] {
  const late = { tone: 'late' as const, label: LATE };

  return [{ tone: 'ok', label: RIGHT }, ...(rhythmic ? [late] : []), { tone: 'bad', label: WRONG }];
}
