# Patched dependencies

A patch here changes the source of a package inside `node_modules`. Bun reapplies
every patch listed under `patchedDependencies` in `package.json` on each
`bun install`, so a fresh checkout and CI get the patched source without doing
anything, and a patch that no longer applies fails the install loudly.

Nothing else checks these patches. In particular `tools/verify` never compiles
the native code they touch — that happens in a native build, which this
repository does not run.

## `react-native-vosk@2.1.7` — pushed audio

The library listens to the microphone and to nothing else: Android starts a
`SpeechService`, which owns an `AudioRecord`, and iOS installs a tap on an
`AVAudioEngine` input node. Neither exposes a way to hand it samples.

The speech bench replays recorded files. Playing them out of the device speaker
back into its microphone would measure the room, the speaker and the microphone
as much as the decoder, and would never give the same figures twice — which
`tools/bench-reproducible` exists to refuse.

The capability was already there one layer down, in the Vosk library the wrapper
wraps: `vosk_recognizer_accept_waveform` on iOS, `Recognizer.acceptWaveForm` on
Android. The patch exposes it, and nothing more:

- `VoskOptions.pushAudio` — start a session that captures nothing. It opens no
  audio session and requests no microphone permission.
- `acceptWaveform(pcmBase64)` — hand it 16-bit little-endian mono PCM at
  16 kHz, base64-encoded. Base64 rather than an array of numbers because the
  bridge allocates per element, and a measurement of the bridge is not a
  measurement of the decoder.
- `finish()` — end the utterance and emit `onFinalResult`, **always**, empty
  transcript included. Upstream only emits it when the audio engine is running,
  so a pushed-audio session would never emit one and every caller awaiting the
  end of a silent utterance would hang.

A microphone session behaves exactly as it did before the patch: every change is
behind `pushAudio`.

## On a version bump

The patch is pinned to `2.1.7`. Raising the version makes `bun install` fail
until the patch is regenerated:

```sh
bun patch react-native-vosk
# edit node_modules/react-native-vosk
bun patch --commit 'node_modules/react-native-vosk'
```

Check upstream first — a release that accepts pushed audio on its own retires
this patch, which is the outcome to prefer.
