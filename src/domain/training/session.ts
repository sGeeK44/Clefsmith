import type { Random } from '@/core/random';
import { diatonicIndex, type Pitch } from '@/domain/notation/pitch';

/**
 * How often a session reaches for the notes the level brings rather than for the
 * whole pool. Without it, a level that adds two notes to a pool of seven shows
 * them barely a quarter of the time, and the thing being learnt is the thing
 * least practised.
 */
const NEW_NOTE_CHANCE = 0.45;

/**
 * The pitches of one session, drawn from a pool.
 *
 * Biased towards `newcomers` — the notes the level brings — and **never the same
 * pitch twice in a row**: a note that has just been answered is answered again
 * without being read, which is the one thing a sight-reading drill must not
 * reward.
 *
 * Takes the pool and the newcomers rather than a level, so that both rules can be
 * exercised against inputs no level produces: a pool too small to avoid repeating
 * itself, and a single newcomer that the previous pitch rules out.
 */
export function sessionOf(
  pool: readonly Pitch[],
  newcomers: readonly Pitch[],
  length: number,
  random: Random,
): readonly Pitch[] {
  if (length > 1 && pool.length < 2) {
    throw new Error('A session of more than one exercise needs a pool of more than one pitch.');
  }

  const drawn: Pitch[] = [];
  for (let step = 0; step < length; step += 1) {
    const previous = drawn.at(-1);
    const biased = newcomers.length > 0 && random.next() < NEW_NOTE_CHANCE;
    const choices = allowed(biased ? newcomers : pool, previous);

    drawn.push(pick(choices.length > 0 ? choices : allowed(pool, previous), random));
  }

  return drawn;
}

function allowed(pitches: readonly Pitch[], previous: Pitch | undefined): readonly Pitch[] {
  if (previous === undefined) {
    return pitches;
  }

  return pitches.filter((pitch) => diatonicIndex(pitch) !== diatonicIndex(previous));
}

function pick(choices: readonly Pitch[], random: Random): Pitch {
  return choices[Math.floor(random.next() * choices.length)] as Pitch;
}
