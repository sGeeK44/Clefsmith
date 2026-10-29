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
