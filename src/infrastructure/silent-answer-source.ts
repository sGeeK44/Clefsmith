import type { AnswerSource } from '@/usecases/listen-for-answers';

/**
 * An answer source that hears nothing, until CLE-18 brings one that does.
 *
 * It is here rather than absent so that the exercise is wired end to end on the
 * side that can be: the screen asks to listen, is told listening has started,
 * and is never told anything was said. The day the recogniser lands, this file
 * is replaced and nothing above it moves.
 */
export const silentAnswerSource: AnswerSource = {
  listen: async () => async () => {},
};
