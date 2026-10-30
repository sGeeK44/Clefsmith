import type { Notation } from '@/domain/notation/naming';
import type { Degree } from '@/domain/notation/pitch';

/** Stops the listening that returned it. Calling it twice is not an error. */
type Silence = () => Promise<void>;

/**
 * Where the learner's answers come from.
 *
 * It delivers a **degree** and the instant the learner started saying it — no
 * word, no confidence, no verdict. What a microphone heard and how it was turned
 * into a degree belongs on the other side of this port, which is why nothing
 * here knows a recogniser exists.
 *
 * The instant is when the utterance *began*, not when the decoder settled on it.
 * Subtracting the decoder's own latency is only possible where that latency is
 * observable, which is the other side of this port too — timing a session on
 * the settling instant would declare every right note late.
 *
 * The notation is handed over because it is the vocabulary that will be listened
 * for, settled once when listening starts rather than per answer.
 */
export interface AnswerSource {
  listen(notation: Notation, heard: Heard): Promise<Silence>;
}

/** A degree, and the instant the learner started saying it. */
export type Heard = (degree: Degree, startedAt: number) => void;

export type ListenForAnswers = (notation: Notation, heard: Heard) => Promise<Silence>;

export function createListenForAnswers(source: AnswerSource): ListenForAnswers {
  return (notation, heard) => source.listen(notation, heard);
}
