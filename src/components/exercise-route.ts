import type { MicrophoneAccess } from '@/usecases/microphone-access';

/** The session setup, as a route carries it: strings, because a route has nothing else. */
type Session = Record<string, string>;

/**
 * Both are `as const`: a plain `const` holds a widening literal type, which an
 * object literal widens back to `string` — and the typed routes then reject a
 * `pathname` they can no longer recognise. Nothing catches it until the route
 * types are generated, which `tools/verify` does not do.
 */
export const EXERCISE = '/exercise' as const;
const MICROPHONE = '/microphone' as const;

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
export function exerciseRoute(access: MicrophoneAccess, session: Session) {
  return { pathname: access === 'granted' ? EXERCISE : MICROPHONE, params: session };
}
