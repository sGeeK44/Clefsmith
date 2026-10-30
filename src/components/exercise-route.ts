/** The session setup, as a route carries it: strings, because a route has nothing else. */
type Session = Record<string, string>;

export const EXERCISE = '/exercise';
const MICROPHONE = '/microphone';

/**
 * Where starting a session goes.
 *
 * Without the microphone it goes to the explanation instead, **carrying the
 * same setup**: granting the permission and coming back is then the whole of
 * what the learner has to do, rather than setting the session up a second time.
 *
 * It is one function rather than a check on each screen that starts a session:
 * two copies of this rule diverge the day either one moves, and the one that
 * moved last is the one the learner meets.
 */
export function exerciseRoute(granted: boolean, session: Session) {
  return { pathname: granted ? EXERCISE : MICROPHONE, params: session };
}
