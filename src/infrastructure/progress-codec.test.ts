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

  it('comes back with the degrees never met still missing, not zeroed', () => {
    expect(decode(encode(played)).mastery.bass).toEqual({ g: 2, a: 0 });
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
    expect(decode(written({ mastery: { treble: {} } }))).toEqual(noProgress());
  });

  it('starts over on a level outside the six', () => {
    expect(decode(written({ level: { treble: 0, bass: 1 } }))).toEqual(noProgress());
    expect(decode(written({ level: { treble: 7, bass: 1 } }))).toEqual(noProgress());
    expect(decode(written({ level: { treble: '2', bass: 1 } }))).toEqual(noProgress());
  });

  it('starts over on a mastery key that is not a degree', () => {
    expect(decode(written({ mastery: { treble: { h: 10 }, bass: {} } }))).toEqual(noProgress());
  });

  it('starts over on a score the rules could never have produced', () => {
    expect(decode(written({ mastery: { treble: { c: 101 }, bass: {} } }))).toEqual(noProgress());
    expect(decode(written({ mastery: { treble: { c: -1 }, bass: {} } }))).toEqual(noProgress());
    expect(decode(written({ mastery: { treble: { c: 'high' }, bass: {} } }))).toEqual(noProgress());
  });
});
