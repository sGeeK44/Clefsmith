/**
 * Wall-clock time, as a port, so that what depends on it can be exercised
 * without waiting for it.
 */
export interface Clock {
  /** Milliseconds since an arbitrary origin, monotonic within a run. */
  now(): number;
  /**
   * Resolves at `instant`, or immediately if it has passed.
   *
   * An instant rather than a duration: a caller that sleeps for a duration
   * accumulates the cost of everything it does between two sleeps, and a replay
   * paced that way drifts further behind real time with every frame it feeds.
   */
  sleepUntil(instant: number): Promise<void>;
}
