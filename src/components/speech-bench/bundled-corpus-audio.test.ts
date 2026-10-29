import { describe, expect, it } from 'bun:test';

import type { Recording } from '@/domain/speech-corpus';
import { type Bundle, createBundledCorpusAudio } from './bundled-corpus-audio';

/** The one shape the corpus decoder reads: 16-bit mono PCM, written out here so
 * that the test does not reach outside `src` for an encoder. */
function wavOf(samples: number[], rate = 16_000): Uint8Array {
  const bytes = new Uint8Array(44 + samples.length * 2);
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
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  tag(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  samples.forEach((sample, index) => {
    view.setInt16(44 + index * 2, sample, true);
  });

  return bytes;
}

const RECORDING: Recording = {
  speaker: 's1',
  notation: 'syllabic',
  note: 'do',
  condition: 'silence',
  audio: 's1-syllabic-do-silence-1.wav',
  sha256: 'the-hash',
  utteranceEndMs: 800,
};

function bundleHolding(files: Record<number, Uint8Array>): Bundle {
  return {
    localUriOf: async (assetModule) => `file:///asset/${assetModule}`,
    readBytes: async (uri) => files[Number(uri.split('/').pop())] as Uint8Array,
    sha256: async () => 'the-hash',
  };
}

describe('createBundledCorpusAudio', () => {
  it('reads a recording through the asset the file name stands for', async () => {
    const audio = createBundledCorpusAudio({
      bundle: bundleHolding({ 7: wavOf([1, 2, 3]) }),
      sampleRate: 16_000,
      assets: { 's1-syllabic-do-silence-1.wav': 7 },
    });

    expect(Array.from((await audio.read(RECORDING)).pcm)).toEqual([1, 2, 3]);
  });

  it('says which recording the bundle is missing rather than failing at the decoder', async () => {
    const audio = createBundledCorpusAudio({
      bundle: bundleHolding({}),
      sampleRate: 16_000,
      assets: {},
    });

    expect(audio.read(RECORDING)).rejects.toThrow('is in the manifest but not in the bundle');
  });
});
