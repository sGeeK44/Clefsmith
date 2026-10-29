import { Asset } from 'expo-asset';
import { CryptoDigestAlgorithm, digest } from 'expo-crypto';
import { File } from 'expo-file-system';

import type { Bundle } from './bundled-corpus-audio';

function hex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * The corpus as this device holds it.
 *
 * `downloadAsync` is a copy out of the application bundle onto the filesystem,
 * not a network call — which is what lets the whole replay run in airplane
 * mode, and why the recordings have to be bundled rather than fetched.
 */
export const expoBundle: Bundle = {
  localUriOf: async (assetModule) => {
    const asset = Asset.fromModule(assetModule);

    await asset.downloadAsync();

    if (asset.localUri === null) {
      throw new Error(`asset ${assetModule} did not land anywhere this device can read it.`);
    }

    return asset.localUri;
  },
  readBytes: async (uri) => new File(uri).bytes(),
  /**
   * Copied into a buffer of its own: the port hands over a view that may sit on
   * a shared buffer, which the crypto module will not take.
   */
  sha256: async (bytes) => hex(await digest(CryptoDigestAlgorithm.SHA256, new Uint8Array(bytes))),
};
