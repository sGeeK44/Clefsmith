import { parseArgs } from 'node:util';

import type { Corpus } from '@/domain/speech-corpus';
import { createWavCorpusAudio } from '@/infrastructure/wav-corpus-audio';
import { createReplaySpeechCorpus } from '@/usecases/replay-speech-corpus';
import { serializeSpeechBenchReport, speechBenchReport } from '@/usecases/speech-bench-report';
import { TRACKS } from './tracks';

const { values } = parseArgs({
  options: {
    corpus: { type: 'string', default: 'bench/fixture-corpus' },
    track: { type: 'string' },
  },
});

const track = TRACKS[values.track ?? ''];

if (track === undefined) {
  console.error(`--track must be one of: ${Object.keys(TRACKS).join(', ')}`);
  process.exit(2);
}

const root = values.corpus;
const corpus: Corpus = await Bun.file(`${root}/manifest.json`).json();
const { clock, recognizer } = track();

const audio = createWavCorpusAudio({
  readFile: async (path) => new Uint8Array(await Bun.file(path).arrayBuffer()),
  sha256: async (bytes) => new Bun.CryptoHasher('sha256').update(bytes).digest('hex'),
  root,
  sampleRate: corpus.sampleRate,
});

const result = await createReplaySpeechCorpus(clock, audio)(corpus, recognizer);
const report = speechBenchReport(corpus, result);

console.log(serializeSpeechBenchReport(report));

if (report.corpus.defects.length > 0) {
  console.error(
    `${report.corpus.defects.length} corpus defect(s): the figures above were computed over ${report.corpus.recordings} of ${report.corpus.declaredCells} cells.`,
  );
  process.exit(1);
}
