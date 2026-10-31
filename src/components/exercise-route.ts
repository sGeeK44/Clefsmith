import { oneOf } from '@/core/one-of';
import { CLEFS, type Clef } from '@/domain/notation/clef';
import { DEGREES, type Degree } from '@/domain/notation/pitch';
import { LEVELS, type Level } from '@/domain/training/level';
import { MEASURES, type Measures } from '@/domain/training/session-settings';
import type { MicrophoneAccess } from '@/usecases/microphone-access';

/** The session setup, as a route carries it: strings, because a route has nothing else. */
type Session = Record<string, string>;

/**
 * Both are `as const`: a plain `const` holds a widening literal type, which an
 * object literal widens back to `string` — and the typed routes then reject a
 * `pathname` they can no longer recognise. Caught by the typecheck, which
 * `tools/verify` now runs against freshly generated route declarations.
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

/**
 * What the route says the session is, or nothing when it does not say.
 *
 * The route is typed, not checked: everything on it is a string, and the types
 * the screen needs are unions. Casting those strings instead — which is what
 * this used to do, inside the exercise screen — lets whatever arrived travel
 * into the domain, where `Number('')` is a level zero that no staff has a range
 * for, and the screen dies on a lookup far from the link that caused it.
 *
 * Returning `undefined` makes the unreadable route a case the screen handles,
 * the way a report that was never played is one.
 */
export function briefOf({ clef, level, measures, degrees = '' }: Partial<Session>) {
  const read = {
    clef: oneOf(CLEFS, clef),
    level: oneOf(LEVELS, level),
    measures: oneOf(MEASURES, measures),
    degrees: degrees.split(',').filter(Boolean).map(oneOfDegrees),
  };

  return read.clef !== undefined &&
    read.level !== undefined &&
    read.measures !== undefined &&
    read.degrees.every((degree) => degree !== undefined)
    ? (read as Brief)
    : undefined;
}

const oneOfDegrees = (degree: string) => oneOf(DEGREES, degree);

interface Brief {
  readonly clef: Clef;
  readonly level: Level;
  readonly measures: Measures;
  readonly degrees: readonly Degree[];
}
