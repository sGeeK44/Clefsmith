/**
 * The 95th percentile of a set of measured latencies, in milliseconds.
 *
 * Nearest rank, no interpolation: the figure published is one the bench
 * actually measured. An interpolated percentile sits between two samples and
 * answers a question nobody asked — and the two definitions disagree by enough,
 * on the small corpora this bench replays, to move a track across the 300 ms
 * line CLE-17 decides on.
 *
 * `NaN` when nothing was measured, so that an empty run cannot be read as fast.
 */
export function p95(samples: readonly number[]): number {
  if (samples.length === 0) {
    return Number.NaN;
  }

  const sorted = [...samples].sort((a, b) => a - b);
  const rank = Math.ceil(0.95 * sorted.length);

  return sorted[rank - 1];
}
