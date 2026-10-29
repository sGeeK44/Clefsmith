import { createWavCorpusAudio } from '@/infrastructure/wav-corpus-audio';
import type { CorpusAudio } from '@/usecases/replay-speech-corpus';

/**
 * The three things a bundled recording needs from the platform.
 *
 * Declared here rather than imported so the lookup can be exercised in plain
 * Bun: the Expo modules that implement it reach for native code on import, and
 * no test runner has any.
 */
export interface Bundle {
  /** Where the asset ended up on this device, once it is there to be read. */
  localUriOf(assetModule: number): Promise<string>;
  readBytes(uri: string): Promise<Uint8Array>;
  sha256(bytes: Uint8Array): Promise<string>;
}

/**
 * The corpus as the application bundle carries it.
 *
 * The manifest names a file, and on a device that name is not a path: it is a
 * key into the generated asset list, because Metro rewrites every bundled file
 * to a location of its own choosing. Looked up on the file name alone, so that
 * the same manifest drives the replay on the host and on a device.
 */
export function createBundledCorpusAudio(options: {
  bundle: Bundle;
  sampleRate: number;
  /**
   * The generated asset list, handed in rather than imported: it is a file of
   * literal `require` calls that only Metro can read, and importing it here
   * would make this module unloadable anywhere else — tests included.
   */
  assets: Record<string, number>;
}): CorpusAudio {
  const { assets } = options;

  return createWavCorpusAudio({
    root: 'bundle',
    sampleRate: options.sampleRate,
    sha256: options.bundle.sha256,
    readFile: async (path) => {
      const name = path.split('/').pop() ?? path;
      const assetModule = assets[name];

      if (assetModule === undefined) {
        throw new Error(
          `${name} is in the manifest but not in the bundle. Run \`bun bench/make-corpus-assets.ts\` and rebuild: the asset list is written out once and does not follow the corpus on its own.`,
        );
      }

      return options.bundle.readBytes(await options.bundle.localUriOf(assetModule));
    },
  });
}
