/**
 * Writes the fixture corpus the bench is checked against.
 *
 * This is not the recorded corpus. Nobody speaks in these files: every sample
 * of a recording holds the index of the note it stands for, which is how a
 * fixture track can answer from what it was actually fed — through the
 * manifest, the file and the decoder — instead of from a list it was handed.
 *
 *   bun bench/make-fixture-corpus.ts
 *
 * Run it again only when the shape of the manifest changes; the files it writes
 * are committed, and the bench replaying them twice to the same figures is what
 * proves it reproducible.
 */
import { mkdir, writeFile } from 'node:fs/promises';

import type { Corpus, Recording } from '@/domain/speech-corpus';

const ROOT = 'bench/fixture-corpus';
const SAMPLE_RATE = 16_000;
const DURATION_MS = 300;

const SPEAKERS = ['s1', 's2'];
const NOTATIONS: Record<string, string[]> = { syllabic: ['do', 'mi'], letters: ['A', 'B'] };
const CONDITIONS = ['silence', 'instrumental'];

function wavOf(noteIndex: number): Uint8Array {
  const samples = (SAMPLE_RATE * DURATION_MS) / 1000;
  const data = samples * 2;
  const bytes = new Uint8Array(44 + data);
  const view = new DataView(bytes.buffer);
  const tag = (at: number, text: string) => {
    for (let index = 0; index < text.length; index += 1) {
      bytes[at + index] = text.charCodeAt(index);
    }
  };

  tag(0, 'RIFF');
  view.setUint32(4, bytes.byteLength - 8, true);
  tag(8, 'WAVE');
  tag(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  tag(36, 'data');
  view.setUint32(40, data, true);

  for (let index = 0; index < samples; index += 1) {
    view.setInt16(44 + index * 2, noteIndex, true);
  }

  return bytes;
}

const recordings: Recording[] = [];

await mkdir(ROOT, { recursive: true });

for (const speaker of SPEAKERS) {
  for (const [notation, notes] of Object.entries(NOTATIONS)) {
    for (const [noteIndex, note] of notes.entries()) {
      for (const condition of CONDITIONS) {
        const audio = `${speaker}-${notation}-${note}-${condition}.wav`;
        const bytes = wavOf(noteIndex);

        await writeFile(`${ROOT}/${audio}`, bytes);

        recordings.push({
          speaker,
          notation,
          note,
          condition,
          audio,
          sha256: new Bun.CryptoHasher('sha256').update(bytes).digest('hex'),
          utteranceEndMs: DURATION_MS,
        });
      }
    }
  }
}

const corpus: Corpus = {
  sampleRate: SAMPLE_RATE,
  speakers: SPEAKERS,
  notations: NOTATIONS,
  conditions: CONDITIONS,
  recordings,
};

await writeFile(`${ROOT}/manifest.json`, `${JSON.stringify(corpus, null, 2)}\n`);

console.log(`${recordings.length} fixture recordings written to ${ROOT}`);
