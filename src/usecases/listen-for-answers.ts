import type { Notation } from '@/domain/notation/naming';
import type { Degree } from '@/domain/notation/pitch';

/** Stops the listening that returned it. Calling it twice is not an error. */
type Silence = () => Promise<void>;

/**
 * Where the learner's answers come from.
 *
 * It delivers a **degree** and nothing else — no word, no confidence, no
 * timestamp. What a microphone heard and how it was turned into a degree belongs
 * on the other side of this port, which is why nothing here knows a recogniser
 * exists.
 *
 * The notation is handed over because it is the vocabulary that will be listened
 * for, settled once when listening starts rather than per answer.
 */
export interface AnswerSource {
  listen(notation: Notation, heard: (degree: Degree) => void): Promise<Silence>;
}

export type ListenForAnswers = (
  notation: Notation,
  heard: (degree: Degree) => void,
) => Promise<Silence>;

export function createListenForAnswers(source: AnswerSource): ListenForAnswers {
  return (notation, heard) => source.listen(notation, heard);
}
