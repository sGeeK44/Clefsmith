/** Where the learner is, and where the session they started has got to. */
interface Reading {
  /** Whether the session is read to a tempo rather than at the learner's own pace. */
  readonly rhythmic: boolean;
  /** Whether the notes have been dealt. */
  readonly dealt: boolean;
  readonly paused: boolean;
  /**
   * What React Native says of the application. Its own type for the value it
   * hands out on mount is `string | null | undefined`, so the rule below reads
   * the one word that means in front of the learner rather than trusting a
   * union the platform does not guarantee.
   */
  readonly appState: string | null | undefined;
}

/**
 * What a session should be doing, given where the learner is.
 *
 * It is one function rather than a condition on each effect of the screen,
 * because the three effects are three clocks — the wall clock that counts, the
 * audio clock that clicks, the recogniser that listens — and a condition
 * written three times is a condition that holds in two of them. A metronome
 * clicking over a session nothing was counting, and a microphone held open by a
 * screen the learner had left, were both that.
 */
export function sessionLife({ rhythmic, dealt, paused, appState }: Reading) {
  /**
   * Only `active` is in front of the learner. `inactive` is the control centre
   * pulled down over the screen or the app switcher opened — a session the
   * learner is no longer reading, whatever they go back to.
   */
  const here = appState === 'active' && !paused;

  return { beats: here && rhythmic && dealt, listens: here };
}
