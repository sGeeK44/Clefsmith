import { describe, expect, it } from 'bun:test';

import type { Recording } from '@/domain/speech-corpus';
import { createWavCorpusAudio } from '@/infrastructure/wav-corpus-audio';

const RECORDING: Recording = {
  speaker: 's1',
  notation: 'syllabic',
  note: 'do',
  condition: 'silence',
  audio: 's1/do-silence.wav',
  sha256: 'whatever-the-hasher-says',
  utteranceEndMs: 800,
};

interface WavShape {
  samples?: number[];
  rate?: number;
  channels?: number;
  bits?: number;
  encoding?: number;
  extraChunk?: boolean;
}

/** A canonical RIFF/WAVE file, built field by field so each one can be bent. */
function wav({
  samples = [1, -1],
  rate = 16_000,
  channels = 1,
  bits = 16,
  encoding = 1,
  extraChunk = false,
}: WavShape = {}): Uint8Array {
  const data = samples.length * 2;
  // An odd-length chunk the parser must skip over, pad byte included.
  const extra = extraChunk ? 8 + 3 + 1 : 0;
  const bytes = new Uint8Array(12 + 24 + extra + 8 + data);
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
  view.setUint16(20, encoding, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, (rate * channels * bits) / 8, true);
  view.setUint16(32, (channels * bits) / 8, true);
  view.setUint16(34, bits, true);

  if (extraChunk) {
    tag(36, 'LIST');
    view.setUint32(40, 3, true);
  }

  tag(36 + extra, 'data');
  view.setUint32(40 + extra, data, true);
  samples.forEach((sample, index) => {
    view.setInt16(44 + extra + index * 2, sample, true);
  });

  return bytes;
}

function audioOf(file: Uint8Array) {
  return createWavCorpusAudio({
    readFile: async () => file,
    sha256: async () => 'whatever-the-hasher-says',
    root: '/corpus',
    sampleRate: 16_000,
  });
}

describe('WAV corpus audio', () => {
  it('reads the samples a recording holds', async () => {
    const { pcm } = await audioOf(wav({ samples: [0, 32_767, -32_768] })).read(RECORDING);

    expect([...pcm]).toEqual([0, 32_767, -32_768]);
  });

  it('reads past a chunk it does not understand', async () => {
    const { pcm } = await audioOf(wav({ samples: [7], extraChunk: true })).read(RECORDING);

    expect([...pcm]).toEqual([7]);
  });

  it('hashes the file as it was on disk, not as it was decoded', async () => {
    const hashed: Uint8Array[] = [];
    const file = wav();
    const audio = createWavCorpusAudio({
      readFile: async () => file,
      sha256: async (bytes) => {
        hashed.push(bytes);
        return 'whatever-the-hasher-says';
      },
      root: '/corpus',
      sampleRate: 16_000,
    });

    const { sha256 } = await audio.read(RECORDING);

    expect(hashed).toEqual([file]);
    expect(sha256).toBe('whatever-the-hasher-says');
  });

  it('reads the recording the manifest names, under the corpus root', async () => {
    const asked: string[] = [];
    const audio = createWavCorpusAudio({
      readFile: async (path) => {
        asked.push(path);
        return wav();
      },
      sha256: async () => 'whatever-the-hasher-says',
      root: '/corpus',
      sampleRate: 16_000,
    });

    await audio.read(RECORDING);

    expect(asked).toEqual(['/corpus/s1/do-silence.wav']);
  });

  it('refuses a file recorded at another rate than the manifest declares', async () => {
    const read = audioOf(wav({ rate: 44_100 })).read(RECORDING);

    await expect(read).rejects.toThrow('44100 Hz');
  });

  it('refuses stereo audio rather than silently taking one channel', async () => {
    const read = audioOf(wav({ channels: 2 })).read(RECORDING);

    await expect(read).rejects.toThrow('16-bit mono');
  });

  it('refuses compressed audio', async () => {
    const read = audioOf(wav({ encoding: 3 })).read(RECORDING);

    await expect(read).rejects.toThrow('uncompressed PCM');
  });

  it('refuses a file that is not a WAV at all', async () => {
    const read = audioOf(new Uint8Array(64)).read(RECORDING);

    await expect(read).rejects.toThrow('not a WAV file');
  });
});
