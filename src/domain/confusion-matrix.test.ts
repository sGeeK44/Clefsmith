import { describe, expect, it } from 'bun:test';

import { confusionMatrix, confusions, type Observation } from '@/domain/confusion-matrix';

const NOTES = ['do', 'mi', 'si'];

function said(expected: string, heard: string | null, times: number): Observation[] {
  return Array.from({ length: times }, () => ({ expected, heard }));
}

describe('confusion matrix', () => {
  it('reports no confusion when every note comes back as itself', () => {
    const perfect = [...said('do', 'do', 4), ...said('mi', 'mi', 4), ...said('si', 'si', 4)];

    const matrix = confusionMatrix('syllabic', NOTES, perfect);

    expect(confusions(matrix)).toEqual([]);
    expect(matrix.errorRate).toBe(0);
  });

  it('publishes a known confusion on that exact pair of notes', () => {
    const misheard = [...said('mi', 'mi', 8), ...said('mi', 'si', 2)];

    const matrix = confusionMatrix('syllabic', NOTES, misheard);

    expect(confusions(matrix)).toEqual([{ expected: 'mi', heard: 'si', count: 2, rate: 0.2 }]);
  });

  it('counts a note that came back as itself nine times out of ten as a 10 % error rate', () => {
    const misheard = [...said('mi', 'mi', 9), ...said('mi', 'si', 1)];

    expect(confusionMatrix('syllabic', NOTES, misheard).errorRate).toBe(0.1);
  });

  it('gives an utterance nothing was heard for its own column', () => {
    const silent = [...said('do', 'do', 3), ...said('do', null, 1)];

    const matrix = confusionMatrix('syllabic', NOTES, silent);

    expect(confusions(matrix)).toEqual([{ expected: 'do', heard: null, count: 1, rate: 0.25 }]);
  });

  it('lays out the full grid, including the notes nothing was ever heard as', () => {
    const matrix = confusionMatrix('syllabic', NOTES, said('do', 'do', 1));

    expect(matrix.cells).toHaveLength(NOTES.length * (NOTES.length + 1));
  });

  it('refuses to call a notation nobody observed a success', () => {
    expect(confusionMatrix('letters', NOTES, []).errorRate).toBeNaN();
  });

  it('ranks the worst confusion first', () => {
    const misheard = [...said('do', 'mi', 1), ...said('do', 'do', 9), ...said('si', 'mi', 5)];

    expect(confusions(confusionMatrix('syllabic', NOTES, misheard))).toEqual([
      { expected: 'si', heard: 'mi', count: 5, rate: 1 },
      { expected: 'do', heard: 'mi', count: 1, rate: 0.1 },
    ]);
  });
});
