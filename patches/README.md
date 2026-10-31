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

### The audio session the microphone opens

Upstream asks iOS for `AVAudioSessionCategoryRecord`. That category carries no
output route, and a session has only one category: with it set, nothing the
application plays is rendered at all — a player's clock does not even advance,
which looks like a frozen metronome rather than a silenced one.

The patch asks for `AVAudioSessionCategoryPlayAndRecord` with
`AVAudioSessionCategoryOptionDefaultToSpeaker`. The option is needed because
`playAndRecord` otherwise plays out of the receiver.

The mode is `Default`. It was `Measurement`, which upstream sets so the decoder
gets the microphone signal with as little system processing on it as possible —
and which Apple documents as disabling "some dynamics processing on input and
output signals, resulting in a lower-output playback level". That attenuation is
what made the metronome barely audible on an iPhone 16 while the same sound was
loud on Android: measured off the speaker at a fixed distance, the click sits at
−27.7 dBFS under `Measurement` and at −14.7 dBFS under `Default`. A processed
microphone signal is what is given up for those thirteen decibels.

`voiceChat` and `videoChat` are not a way out: Apple documents the same lower
playback level for both unless Voice-Processing I/O is enabled, which the
library does not expose.

`src/app/_layout.tsx` declares the same category, mode and option to
`react-native-audio-api`, which configures the session itself when a context is
created. The two must say the same thing or each reconfiguration tears the other
side down.

**Checked by**: nothing automated — see the paragraph above on native code. The
speech bench cannot stand in for it either: it replays recorded files and never
goes through the microphone, so it is blind to the mode. It is verified by
playing a session with the metronome on and hearing the clicks while the notes
are still recognised.

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
