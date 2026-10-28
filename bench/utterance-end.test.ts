import { describe, expect, it } from 'bun:test';

import { proposeUtteranceEndMs } from './utterance-end';

const SAMPLE_RATE = 16_000;
const FRAME = (SAMPLE_RATE * 20) / 1000;

/** A recording of `frames` frames, loud only where `loudAt` says so. */
function recordingOf(frames: number, loudAt: (frame: number) => number): Int16Array {
  const pcm = new Int16Array(frames * FRAME);

  for (let frame = 0; frame < frames; frame += 1) {
    pcm.fill(loudAt(frame), frame * FRAME, (frame + 1) * FRAME);
  }

  return pcm;
}

describe('proposed end of utterance', () => {
  it('lands at the end of the last frame that still carries speech', () => {
    const spokenForTheFirstHundredMs = recordingOf(20, (frame) => (frame < 5 ? 10_000 : 0));

    expect(proposeUtteranceEndMs(spokenForTheFirstHundredMs, SAMPLE_RATE)).toBe(100);
  });

  it('keeps a quiet last consonant rather than clipping the word short', () => {
    const trailingOff = recordingOf(10, (frame) => {
      if (frame < 3) {
        return 10_000;
      }

      return frame === 3 ? 2_000 : 0;
    });

    expect(proposeUtteranceEndMs(trailingOff, SAMPLE_RATE)).toBe(80);
  });

  it('drops a noise floor far below the loudest moment', () => {
    const hiss = recordingOf(10, (frame) => (frame < 3 ? 10_000 : 100));

    expect(proposeUtteranceEndMs(hiss, SAMPLE_RATE)).toBe(60);
  });

  it('proposes nothing for a recording nobody spoke into', () => {
    expect(proposeUtteranceEndMs(new Int16Array(FRAME * 10), SAMPLE_RATE)).toBe(0);
  });
});
