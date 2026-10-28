import type { Recording } from '@/domain/speech-corpus';
import type { CorpusAudio } from '@/usecases/replay-speech-corpus';

/**
 * Reading a file and hashing bytes are the two things the host and a device do
 * differently; everything else about a WAV file is the same on both.
 */
export interface WavCorpusAudioOptions {
  readFile(path: string): Promise<Uint8Array>;
  sha256(bytes: Uint8Array): Promise<string>;
  /** Where the paths in the manifest are relative to. */
  root: string;
  /** The rate the manifest declares. A file at another rate is refused. */
  sampleRate: number;
}

interface Format {
  encoding: number;
  channels: number;
  rate: number;
  bits: number;
}

const RIFF_HEADER_BYTES = 12;
const CHUNK_HEADER_BYTES = 8;
const PCM = 1;
const MONO = 1;
const BITS_PER_SAMPLE = 16;

export function createWavCorpusAudio(options: WavCorpusAudioOptions): CorpusAudio {
  return {
    read: async (recording: Recording) => {
      const path = `${options.root}/${recording.audio}`;
      const bytes = await options.readFile(path);

      return {
        pcm: decodeWav(bytes, options.sampleRate, path),
        sha256: await options.sha256(bytes),
      };
    },
  };
}

/**
 * Only what the corpus is recorded in: 16-bit mono PCM at the declared rate.
 *
 * Anything else is refused rather than converted. A resampled or downmixed
 * file is no longer the file whose end of utterance was annotated, and the
 * bench would publish latencies measured against audio nobody listened to.
 */
function decodeWav(bytes: Uint8Array, expectedRate: number, path: string): Int16Array {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  if (ascii(bytes, 0, 4) !== 'RIFF' || ascii(bytes, 8, 4) !== 'WAVE') {
    throw new Error(`${path} is not a WAV file.`);
  }

  let format: Format | undefined;
  let offset = RIFF_HEADER_BYTES;

  while (offset + CHUNK_HEADER_BYTES <= bytes.byteLength) {
    const id = ascii(bytes, offset, 4);
    const size = view.getUint32(offset + 4, true);
    const body = offset + CHUNK_HEADER_BYTES;

    if (id === 'fmt ') {
      format = {
        encoding: view.getUint16(body, true),
        channels: view.getUint16(body + 2, true),
        rate: view.getUint32(body + 4, true),
        bits: view.getUint16(body + 14, true),
      };
    }

    if (id === 'data') {
      return pcmOf(bytes, body, size, format, expectedRate, path);
    }

    // Chunks are padded to an even length, and the pad byte is not in the size.
    offset = body + size + (size % 2);
  }

  throw new Error(`${path} has no audio data.`);
}

function pcmOf(
  bytes: Uint8Array,
  body: number,
  size: number,
  format: Format | undefined,
  expectedRate: number,
  path: string,
): Int16Array {
  if (format === undefined) {
    throw new Error(`${path} describes no audio format.`);
  }

  if (format.encoding !== PCM) {
    throw new Error(`${path} is compressed audio; the corpus is uncompressed PCM.`);
  }

  if (format.channels !== MONO || format.bits !== BITS_PER_SAMPLE) {
    throw new Error(
      `${path} is ${format.channels}-channel ${format.bits}-bit audio; the corpus is 16-bit mono.`,
    );
  }

  if (format.rate !== expectedRate) {
    throw new Error(
      `${path} is recorded at ${format.rate} Hz; the manifest declares ${expectedRate} Hz.`,
    );
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const samples = new Int16Array(Math.floor(Math.min(size, bytes.byteLength - body) / 2));

  // Copied sample by sample rather than viewed in place: a data chunk does not
  // have to start on an even offset, and a typed-array view on an odd one throws.
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] = view.getInt16(body + index * 2, true);
  }

  return samples;
}

function ascii(bytes: Uint8Array, at: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(at, at + length));
}
