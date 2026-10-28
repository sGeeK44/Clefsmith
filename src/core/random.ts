/**
 * A source of chance, as a port, so that what depends on it can be replayed.
 *
 * A generator that reaches for `Math.random` cannot be tested for anything but its
 * shape: the sequence it produced is gone the moment it produced it.
 */
export interface Random {
  /** A number in [0, 1). */
  next(): number;
}
