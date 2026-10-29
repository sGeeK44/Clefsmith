import { describe, expect, it } from 'bun:test';

import type { Recognition } from '@/domain/speech-recognizer';
import { TRACKS, type Track } from './tracks';

const NOTES = ['do', 'ré', 'mi'];

function perfectTrack(): Track {
  const build = TRACKS['fixture-perfect'] as () => Track;

  return build();
}

describe('a fixture track', () => {
  it('answers the note the fixture samples carry', async () => {
    const { recognizer } = perfectTrack();
    const heard: Recognition[] = [];

    await recognizer.start(NOTES, (recognition) => heard.push(recognition));
    recognizer.write(new Int16Array(4).fill(2));
    await recognizer.flush();

    expect(heard).toEqual([{ kind: 'final', transcript: 'mi', at: 0 }]);
  });

  it('refuses audio that does not carry the fixture encoding', async () => {
    const { recognizer } = perfectTrack();

    await recognizer.start(NOTES, () => undefined);

    expect(() => recognizer.write(Int16Array.from([2, 2, 7, 2]))).toThrow(
      /not a fixture recording/,
    );
  });
});
