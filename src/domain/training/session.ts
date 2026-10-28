import type { Random } from '@/core/random';
import { diatonicIndex, type Pitch } from '@/domain/notation/pitch';

/**
 * The pitches of one session, drawn from a pool.
 *
 * Uniformly, and **never the same pitch twice in a row**: a note that has just been
 * answered is answered again without being read, which is the one thing a
 * sight-reading drill must not reward.
 *
 * Takes the pool rather than a level, so that the rule above can be exercised
 * against a pool too small to satisfy it.
 */
export function sessionOf(
  pool: readonly Pitch[],
  length: number,
  random: Random,
): readonly Pitch[] {
  if (length > 1 && pool.length < 2) {
    throw new Error('A session of more than one exercise needs a pool of more than one pitch.');
  }

  const drawn: Pitch[] = [];
  for (let step = 0; step < length; step += 1) {
    const previous = drawn.at(-1);
    const choices =
      previous === undefined
        ? pool
        : pool.filter((pitch) => diatonicIndex(pitch) !== diatonicIndex(previous));

    drawn.push(choices[Math.floor(random.next() * choices.length)] as Pitch);
  }

  return drawn;
}
