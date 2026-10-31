import { describe, expect, it } from 'bun:test';
import type { Degree, Pitch } from '@/domain/notation/pitch';
import {
  answered,
  beaten,
  drillOf,
  expectedOf,
  isOver,
  restarted,
  rewound,
  scored,
} from '@/domain/training/drill';
import { accuracyOf } from '@/domain/training/progress';

/** What a beaten session hands the drill: a verdict, and how far off it was. */
const ON_BEAT = { timing: 'in-time', offset: 0 } as const;
const OFF_BEAT = { timing: 'off-beat', offset: 700 } as const;

/** Five notes: one whole measure of four, and the first note of the next. */
const NOTES: readonly Pitch[] = [
  { degree: 'c', octave: 4 },
  { degree: 'd', octave: 4 },
  { degree: 'e', octave: 4 },
  { degree: 'f', octave: 4 },
  { degree: 'g', octave: 4 },
];

function reading(said: readonly Degree[]) {
  return said.reduce(answered, drillOf(NOTES));
}

describe('a session being read', () => {
  it('asks for its first note, and nothing has been answered', () => {
    const drill = drillOf(NOTES);

    expect(expectedOf(drill)).toEqual({ degree: 'c', octave: 4 });
    expect(drill.answers).toEqual([]);
    expect(isOver(drill)).toBe(false);
  });

  it('moves on to the next note when the shown one is named', () => {
    expect(expectedOf(reading(['c']))).toEqual({ degree: 'd', octave: 4 });
  });

  it('records what was named against what was shown', () => {
    expect(reading(['c', 'a']).last).toEqual({
      said: 'a',
      expected: 'd',
      right: false,
      beating: undefined,
    });
  });

  it('sends a mistake back to the start of the measure, notes already read included', () => {
    expect(expectedOf(reading(['c', 'd', 'a']))).toEqual({ degree: 'c', octave: 4 });
  });

  it('leaves a mistake on the first note of a measure exactly where it is', () => {
    expect(expectedOf(reading(['c', 'd', 'e', 'f', 'a']))).toEqual({ degree: 'g', octave: 4 });
  });

  it('counts a mistake as an attempt on the note that was shown', () => {
    expect(reading(['c', 'a']).answers).toEqual([
      { degree: 'c', correct: true },
      { degree: 'd', correct: false },
    ]);
  });

  it('is over once the last note has been read right, and asks for nothing more', () => {
    const drill = reading(['c', 'd', 'e', 'f', 'g']);

    expect(isOver(drill)).toBe(true);
    expect(expectedOf(drill)).toBeUndefined();
  });

  it('answers nothing more once it is over', () => {
    const over = reading(['c', 'd', 'e', 'f', 'g']);

    expect(answered(over, 'c')).toBe(over);
  });

  it('counts accuracy over attempts, so a re-read measure costs what it cost', () => {
    const drill = reading(['c', 'd', 'a', 'c', 'd', 'e', 'f', 'g']);

    expect(drill.answers).toHaveLength(8);
    expect(accuracyOf(drill.answers)).toBe(88);
  });

  describe('under a metronome', () => {
    it('moves on when the beat passes, whatever was said', () => {
      expect(expectedOf(beaten(drillOf(NOTES)))).toEqual({ degree: 'd', octave: 4 });
    });

    it('records nothing for a beat: a note nobody named is not a wrong answer', () => {
      expect(beaten(drillOf(NOTES)).answers).toStrictEqual([]);
    });

    it('is over once the last note has been beaten, and no further', () => {
      const beatenThrough = NOTES.reduce(beaten, drillOf(NOTES));

      expect(isOver(beatenThrough)).toBe(true);
      expect(beaten(beatenThrough).at).toBe(NOTES.length);
    });

    it('counts what was named without moving the reading on', () => {
      const drill = scored(drillOf(NOTES), 'c', ON_BEAT);

      expect(expectedOf(drill)).toEqual({ degree: 'c', octave: 4 });
      expect(drill.last).toEqual({ said: 'c', expected: 'c', right: true, beating: ON_BEAT });
    });

    it('leaves a mistake where it stands rather than sending it back', () => {
      const drill = scored(beaten(beaten(drillOf(NOTES))), 'a', ON_BEAT);

      expect(expectedOf(drill)).toEqual({ degree: 'e', octave: 4 });
      expect(accuracyOf(drill.answers)).toBe(0);
    });

    it('records how a note was timed on the attempt, where the session is counted from', () => {
      expect(scored(drillOf(NOTES), 'c', OFF_BEAT).answers).toEqual([
        { degree: 'c', correct: true, timing: 'off-beat' },
      ]);
    });

    it('records a reading with no beat as timed by nothing, not as off the beat', () => {
      expect(scored(drillOf(NOTES), 'c', undefined).answers).toEqual([
        { degree: 'c', correct: true, timing: undefined },
      ]);
    });

    it('says nothing about the timing of a wrong note: the mistake is the note', () => {
      expect(scored(drillOf(NOTES), 'a', OFF_BEAT).last?.beating).toBeUndefined();
    });
  });
});

describe('what each note has been worth', () => {
  it('starts with nothing said about any of them', () => {
    expect(drillOf(NOTES).marks).toEqual([undefined, undefined, undefined, undefined, undefined]);
  });

  it('marks a note said right, and leaves it marked as the reading moves on', () => {
    expect(reading(['c', 'd']).marks).toEqual(['ok', 'ok', undefined, undefined, undefined]);
  });

  it('marks a right note said off the beat as late rather than as a mistake', () => {
    expect(scored(drillOf(NOTES), 'c', OFF_BEAT).marks[0]).toBe('late');
  });

  it('marks a right note said on the beat', () => {
    expect(scored(drillOf(NOTES), 'c', ON_BEAT).marks[0]).toBe('ok');
  });

  it('marks a wrong note under a metronome, where the reading does not rewind', () => {
    expect(scored(drillOf(NOTES), 'a', ON_BEAT).marks[0]).toBe('wrong');
  });

  it('clears the measure it sends the learner back to, keeping the note they missed', () => {
    expect(reading(['c', 'd', 'a']).marks).toEqual([
      undefined,
      undefined,
      'wrong',
      undefined,
      undefined,
    ]);
  });

  it('leaves an earlier measure alone when a later one is missed', () => {
    expect(reading(['c', 'd', 'e', 'f', 'a']).marks).toEqual(['ok', 'ok', 'ok', 'ok', 'wrong']);
  });
});

describe('coming back to the measure in hand', () => {
  it('goes back to its first note', () => {
    expect(rewound(reading(['c', 'd'])).at).toBe(0);
  });

  it('shows that measure as unread, the note it was interrupted on included', () => {
    expect(rewound(reading(['c', 'd'])).marks).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });

  it('leaves the measures already behind the learner alone', () => {
    const second = reading(['c', 'd', 'e', 'f']);

    expect(rewound(second).at).toBe(4);
    expect(rewound(second).marks).toEqual(['ok', 'ok', 'ok', 'ok', undefined]);
  });

  it('keeps what was attempted: a measure re-read is not a measure unplayed', () => {
    expect(rewound(reading(['c', 'd'])).answers).toHaveLength(2);
  });
});

describe('starting the same notes over', () => {
  it('reads from the first note again, with nothing marked', () => {
    const fresh = restarted(reading(['c', 'd', 'a']));

    expect(fresh.at).toBe(0);
    expect(fresh.marks.every((mark) => mark === undefined)).toBe(true);
  });

  it('drops the attempts of the reading left behind', () => {
    expect(restarted(reading(['c', 'd', 'a'])).answers).toEqual([]);
  });

  it('reads the same notes', () => {
    expect(restarted(reading(['c'])).notes).toEqual(NOTES);
  });
});
