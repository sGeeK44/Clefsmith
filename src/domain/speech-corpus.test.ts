import { describe, expect, it } from 'bun:test';

import {
  type Cell,
  type Corpus,
  expectedCells,
  inspectCorpus,
  type Recording,
} from '@/domain/speech-corpus';

const AXES = {
  sampleRate: 16_000,
  speakers: ['s1', 's2'],
  notations: { syllabic: ['do'] },
  conditions: ['silence', 'instrumental'],
};

const COMPLETE: Cell[] = [
  { speaker: 's1', notation: 'syllabic', note: 'do', condition: 'silence' },
  { speaker: 's1', notation: 'syllabic', note: 'do', condition: 'instrumental' },
  { speaker: 's2', notation: 'syllabic', note: 'do', condition: 'silence' },
  { speaker: 's2', notation: 'syllabic', note: 'do', condition: 'instrumental' },
];

function recordingOf(cell: Cell, take = 1): Recording {
  return { ...cell, audio: `take-${take}.wav`, sha256: `abc${take}`, utteranceEndMs: 800 };
}

function corpusOf(cells: Cell[]): Corpus {
  return { ...AXES, recordings: cells.map((cell) => recordingOf(cell)) };
}

describe('speech corpus', () => {
  it('reports no defect when every declared cell is recorded', () => {
    expect(inspectCorpus(corpusOf(COMPLETE))).toEqual([]);
  });

  it('names the cell nobody recorded', () => {
    const withoutLastCell = COMPLETE.slice(0, -1);

    expect(inspectCorpus(corpusOf(withoutLastCell))).toEqual([
      {
        kind: 'missing',
        cell: { speaker: 's2', notation: 'syllabic', note: 'do', condition: 'instrumental' },
      },
    ]);
  });

  it('takes a second recording of a cell as sample, not as a defect', () => {
    const firstCell = COMPLETE[0] as Cell;
    const withARetake: Corpus = {
      ...AXES,
      recordings: [...COMPLETE.map((cell) => recordingOf(cell)), recordingOf(firstCell, 2)],
    };

    expect(inspectCorpus(withARetake)).toEqual([]);
  });

  it('names a recording that falls outside the declared axes', () => {
    const withATypo = [
      ...COMPLETE,
      { speaker: 's2', notation: 'syllabic', note: 'dooo', condition: 'silence' },
    ];

    expect(inspectCorpus(corpusOf(withATypo))).toEqual([
      {
        kind: 'undeclared',
        cell: { speaker: 's2', notation: 'syllabic', note: 'dooo', condition: 'silence' },
      },
    ]);
  });

  it('calls for one cell per speaker, note and condition, notation by notation', () => {
    const twoNotations: Corpus = {
      sampleRate: 16_000,
      speakers: ['s1', 's2', 's3'],
      notations: { syllabic: ['do', 'ré'], letters: ['A', 'B', 'C'] },
      conditions: ['silence', 'instrumental'],
      recordings: [],
    };

    expect(expectedCells(twoNotations)).toHaveLength(3 * (2 + 3) * 2);
  });
});
