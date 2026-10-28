import { describe, expect, it } from 'bun:test';
import { answered, noProgress, sessionFinished, WINDOW } from '@/domain/training/progress';
import { decode, encode } from '@/infrastructure/progress-codec';

const played = sessionFinished(
  answered(answered(noProgress(), 'bass', 4, true), 'treble', 1, false),
);

/** The written record, with one of its fields replaced. */
function written(changed: Record<string, unknown>): string {
  return JSON.stringify({ ...JSON.parse(encode(played)), ...changed });
}

describe('a record written down', () => {
  it('reads back as what was written', () => {
    expect(decode(encode(played))).toEqual(played);
  });

  it('carries the schema it was written against', () => {
    expect(JSON.parse(encode(played)).schema).toBe(1);
  });
});

describe('a record that cannot be read', () => {
  it('starts the learner over when nothing was ever written', () => {
    expect(decode(undefined)).toEqual(noProgress());
  });

  it('starts the learner over when the text is not a record at all', () => {
    expect(decode('{ truncated')).toEqual(noProgress());
    expect(decode('"a string"')).toEqual(noProgress());
  });

  it('refuses a schema this version does not know', () => {
    expect(decode(written({ schema: 2 }))).toEqual(noProgress());
  });

  it('refuses a session count that is not a count', () => {
    expect(decode(written({ sessions: -1 }))).toEqual(noProgress());
    expect(decode(written({ sessions: 1.5 }))).toEqual(noProgress());
    expect(decode(written({ sessions: '3' }))).toEqual(noProgress());
  });

  it('refuses a record missing a clef', () => {
    expect(decode(written({ answers: { treble: played.answers.treble } }))).toEqual(noProgress());
  });

  it('refuses a clef missing a level', () => {
    const { 6: _dropped, ...fiveLevels } = played.answers.bass;

    expect(decode(written({ answers: { ...played.answers, bass: fiveLevels } }))).toEqual(
      noProgress(),
    );
  });

  it('refuses answers that are not answers', () => {
    const answers = { ...played.answers, bass: { ...played.answers.bass, 4: ['yes'] } };

    expect(decode(written({ answers }))).toEqual(noProgress());
  });

  it('refuses a window longer than the rule judges on', () => {
    const tooMany = Array.from({ length: WINDOW + 1 }, () => true);
    const answers = { ...played.answers, bass: { ...played.answers.bass, 4: tooMany } };

    expect(decode(written({ answers }))).toEqual(noProgress());
  });
});
