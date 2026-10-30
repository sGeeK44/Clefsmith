import { exercisesIn, type Measures } from '@/domain/training/session-settings';

/**
 * What the session panel says, in the learner's words.
 *
 * The arithmetic is the domain's; what is here is only how it is read out.
 */

export function tempoLine(tempo: number): string {
  return `${tempo} bpm`;
}

export function measuresLine(measures: Measures): string {
  return `${measures} mesures`;
}

/** `32 notes` — what the chosen length comes out to. */
export function lengthLine(measures: Measures): string {
  return `${exercisesIn(measures)} notes`;
}

/**
 * `60 bpm`, or `Sans tempo` when nothing is beating.
 *
 * The two readings of the desk differ by this alone, so the chip says which one
 * the learner is about to play rather than a tempo that would not be heard.
 */
export function beatLine(metronome: boolean, tempo: number): string {
  return metronome ? tempoLine(tempo) : 'Sans tempo';
}
