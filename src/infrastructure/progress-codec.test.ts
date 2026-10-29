import { describe, expect, it } from 'bun:test';
import { noProgress, type Progress, sessionFinished } from '@/domain/training/progress';
import { decode, encode } from '@/infrastructure/progress-codec';

const played: Progress = sessionFinished(noProgress(), {
  clef: 'bass',
  level: 1,
  review: false,
  answers: [
    { degree: 'g', correct: true },
    { degree: 'a', correct: false },
  ],
});

/** A record this version would write, so a test can spoil one field at a time. */
function written(spoilt: Record<string, unknown> = {}): string {
  return JSON.stringify({ ...JSON.parse(encode(played)), ...spoilt });
}

describe('a record that can be read', () => {
  it('comes back as it went in', () => {
    expect(decode(encode(played))).toEqual(played);
  });

  it('carries the levels both clefs are on', () => {
    expect(decode(written({ level: { treble: 4, bass: 6 } })).level).toEqual({
      treble: 4,
      bass: 6,
    });
  });
});

describe('a record that cannot be read', () => {
  it('starts the learner over when nothing was ever written', () => {
    expect(decode(null)).toEqual(noProgress());
  });

  it('starts over on anything that is not JSON', () => {
    expect(decode('{"schema":2,"sess')).toEqual(noProgress());
  });

  it('starts over on JSON that is not a record', () => {
    expect(decode('42')).toEqual(noProgress());
  });

  it('starts over on a schema this version does not know', () => {
    expect(decode(written({ schema: 3 }))).toEqual(noProgress());
    expect(decode(written({ schema: 1 }))).toEqual(noProgress());
  });

  it('starts over when the count of sessions is not one', () => {
    expect(decode(written({ sessions: -1 }))).toEqual(noProgress());
    expect(decode(written({ sessions: 1.5 }))).toEqual(noProgress());
    expect(decode(written({ sessions: '3' }))).toEqual(noProgress());
  });

  it('starts over when a clef is missing', () => {
    expect(decode(written({ level: { treble: 2 } }))).toEqual(noProgress());
  });

  it('starts over on a level outside the six', () => {
    expect(decode(written({ level: { treble: 0, bass: 1 } }))).toEqual(noProgress());
    expect(decode(written({ level: { treble: 7, bass: 1 } }))).toEqual(noProgress());
    expect(decode(written({ level: { treble: '2', bass: 1 } }))).toEqual(noProgress());
  });
});
