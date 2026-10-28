import { describe, expect, it } from 'bun:test';

import { type Notation, vocabularyOf } from '@/domain/notation/naming';
import axes from './corpus/axes.json';

/**
 * The corpus was recorded one word at a time, and the file names carry those words.
 * If the domain renames a degree, every recording whose name no longer matches stops
 * being found — and re-recording is a session with five speakers. So the two
 * vocabularies are compared rather than trusted.
 */
describe('the recorded vocabulary', () => {
  it('is the vocabulary the domain asks a learner for', () => {
    for (const [notation, recorded] of Object.entries(axes.notations)) {
      expect([...recorded].sort()).toEqual([...vocabularyOf(notation as Notation)].sort());
    }
  });
});
