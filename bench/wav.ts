/**
 * Writes the only WAV shape this repository reads: 16-bit mono PCM.
 *
 * The decoder refuses anything else (`decodeWav`), so an encoder that could
 * emit anything else would only produce files the bench rejects. It is shared
 * rather than copied because the two are one format: widening it to 24-bit or
 * to stereo has to happen on both sides at once, and a second copy of the
 * header is the one that gets forgotten.
 */
const HEADER_BYTES = 44;
const PCM = 1;
const MONO = 1;
const BITS_PER_SAMPLE = 16;
const BYTES_PER_SAMPLE = BITS_PER_SAMPLE / 8;

export function encodeWav(samples: Int16Array, sampleRate: number): Uint8Array {
  const data = samples.length * BYTES_PER_SAMPLE;
  const bytes = new Uint8Array(HEADER_BYTES + data);
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
  view.setUint16(20, PCM, true);
  view.setUint16(22, MONO, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * BYTES_PER_SAMPLE, true);
  view.setUint16(32, BYTES_PER_SAMPLE, true);
  view.setUint16(34, BITS_PER_SAMPLE, true);
  tag(36, 'data');
  view.setUint32(40, data, true);

  for (let index = 0; index < samples.length; index += 1) {
    view.setInt16(HEADER_BYTES + index * BYTES_PER_SAMPLE, samples[index] as number, true);
  }

  return bytes;
}
