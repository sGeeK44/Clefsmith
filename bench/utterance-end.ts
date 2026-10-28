const FRAME_MS = 20;

/**
 * How far below the loudest moment of a recording still counts as speech.
 *
 * A tenth of the peak amplitude: a word's last consonant is much quieter than
 * its vowel, and a threshold any higher clips the end of every utterance that
 * ends on one.
 */
const SPEECH_FLOOR = 0.1;

/**
 * Proposes where the speaker stops talking, in milliseconds from the start.
 *
 * A proposal, not a measurement: it is written into the manifest once, read by
 * a human, and frozen. Detecting this at replay time instead would put the
 * bench's own detector inside what the bench measures — a track would be
 * credited or blamed for where this function drew the line.
 *
 * Returns 0 for a recording with nothing in it, which the manifest review is
 * meant to catch.
 */
export function proposeUtteranceEndMs(pcm: Int16Array, sampleRate: number): number {
  const samplesPerFrame = Math.round((sampleRate * FRAME_MS) / 1000);
  const frames: number[] = [];

  for (let start = 0; start < pcm.length; start += samplesPerFrame) {
    frames.push(rms(pcm.subarray(start, start + samplesPerFrame)));
  }

  const peak = Math.max(...frames, 0);

  if (peak === 0) {
    return 0;
  }

  const lastSpoken = frames.findLastIndex((level) => level >= peak * SPEECH_FLOOR);

  return (lastSpoken + 1) * FRAME_MS;
}

function rms(frame: Int16Array): number {
  if (frame.length === 0) {
    return 0;
  }

  let sum = 0;

  for (const sample of frame) {
    sum += sample * sample;
  }

  return Math.sqrt(sum / frame.length);
}
