/**
 * What a recogniser reports while it listens.
 *
 * Partial results are what makes a recogniser feel immediate on screen; the
 * final result is what the bench measures against, because it is the only one
 * the application is allowed to act on.
 */
export type Recognition =
  | { readonly kind: 'partial'; readonly transcript: string; readonly at: number }
  | { readonly kind: 'final'; readonly transcript: string | null; readonly at: number };

/**
 * A recogniser constrained to a closed vocabulary.
 *
 * The vocabulary is passed when the session opens, not per utterance: both
 * tracks CLE-17 weighs compile a grammar at that point, which is why changing
 * notation means closing the session and opening another.
 */
export interface SpeechRecognizer {
  /** Opens a session that may only return words of `vocabulary`. */
  start(
    vocabulary: readonly string[],
    onRecognition: (recognition: Recognition) => void,
  ): Promise<void>;
  /** Feeds 16-bit PCM at the sample rate the session was opened for. */
  write(pcm: Int16Array): void;
  /**
   * Ends the current utterance.
   *
   * Resolves once the final result has been emitted — or once the recogniser
   * has settled on having nothing to say, which it must also report as a final
   * result, with no transcript. A recogniser that stays silent on silence would
   * hang every caller that waits for it.
   */
  flush(): Promise<void>;
  /** Closes the session and releases the model. */
  stop(): Promise<void>;
}
