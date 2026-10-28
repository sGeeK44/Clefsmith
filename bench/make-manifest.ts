/**
 * Turns a directory of recordings into the manifest the bench replays.
 *
 *   bun bench/make-manifest.ts --corpus bench/corpus
 *
 * Reads the axes from `<corpus>/axes.json`, reads every `.wav` next to it,
 * and writes `<corpus>/manifest.json`. Says what the grid is missing and what
 * it does not recognise, and exits non-zero when either happens.
 *
 * The end-of-utterance offset it writes is a proposal. Read it before the
 * corpus is used to decide anything: every latency the bench publishes is
 * measured from that number.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';

import { type Corpus, inspectCorpus, type Recording } from '@/domain/speech-corpus';
import { decodeWav } from '@/infrastructure/wav-corpus-audio';
import { proposeUtteranceEndMs } from './utterance-end';

const { values } = parseArgs({ options: { corpus: { type: 'string', default: 'bench/corpus' } } });
const root = values.corpus;

type Axes = Omit<Corpus, 'recordings'>;

const axes: Axes = JSON.parse(await readFile(`${root}/axes.json`, 'utf8'));
const files = (await readdir(root)).filter((name) => name.endsWith('.wav')).sort();

/**
 * The file name is the only place a recording says which cell it fills, so it
 * is parsed rather than guessed: `<speaker>-<notation>-<note>-<condition>.wav`.
 */
function cellOf(name: string): Omit<Recording, 'audio' | 'sha256' | 'utteranceEndMs'> | undefined {
  const parts = name.replace(/\.wav$/, '').split('-');

  if (parts.length !== 4) {
    return undefined;
  }

  const [speaker, notation, note, condition] = parts as [string, string, string, string];

  return { speaker, notation, note, condition };
}

const recordings: Recording[] = [];
const unnamed: string[] = [];

for (const audio of files) {
  const cell = cellOf(audio);

  if (cell === undefined) {
    unnamed.push(audio);
    continue;
  }

  const bytes = await readFile(`${root}/${audio}`);
  const pcm = decodeWav(bytes, axes.sampleRate, `${root}/${audio}`);

  recordings.push({
    ...cell,
    audio,
    sha256: new Bun.CryptoHasher('sha256').update(bytes).digest('hex'),
    utteranceEndMs: proposeUtteranceEndMs(pcm, axes.sampleRate),
  });
}

const corpus: Corpus = { ...axes, recordings };
const defects = inspectCorpus(corpus);

await writeFile(`${root}/manifest.json`, `${JSON.stringify(corpus, null, 2)}\n`);

console.log(`${recordings.length} recordings written to ${root}/manifest.json`);

for (const file of unnamed) {
  console.error(`${file} is not named <speaker>-<notation>-<note>-<condition>.wav`);
}

for (const defect of defects) {
  const { speaker, notation, note, condition } = defect.cell;
  console.error(`${defect.kind}: ${speaker} ${notation} ${note} ${condition}`);
}

if (defects.length > 0 || unnamed.length > 0) {
  process.exit(1);
}
