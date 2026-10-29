# The recorded corpus

What CLE-17 decides is read off this corpus. A track is not compared against another
track — it is compared against these recordings, so the recordings are the measurement
instrument, and changing them changes every figure already published.

`axes.json` declares the grid. `manifest.json` is generated from the files next to it and
is not edited by hand.

## The grid

`axes.json` currently declares 2 speakers × 7 syllabic notes × 1 condition = **14 cells**,
held by 85 recordings.

That is not the grid this corpus is meant to reach. The target is 5 speakers × 14 notes
(7 syllabic, 7 letters) × 2 conditions = **140 cells**; the axes were narrowed to what the
first recording session actually produced, because a declared cell nobody recorded fails
the bench rather than waiting for it. Widening an axis back is one line in `axes.json` and
one recording session — and the bench will say exactly which cells are missing.

What the first session did not produce, and what it will take:

- **`letters`** — not a single take. Half the note vocabulary.
- **`s3`…`s5`** — three of the five speakers.
- **`instrumental`** — announced without an instrument in the room. Reachable by mixing,
  rather than by recording again.

Every declared cell is recorded. A missing one fails the bench rather than shrinking the sample,
because a confusion rate over four fifths of a grid is a different number and nothing on
its face says so.

A cell may hold **several takes**, and should. The grid is the floor, not the sample: an
error rate read off one recording per cell can only come out as none of it or all of it,
so the rate the bench publishes is only as fine as the number of takes behind it.

- **Speakers** — at least five, as different from each other as you can get: pitch, accent,
  pace. The confusion pairs this bench exists to find are the ones that survive a change
  of voice.
- **Notes** — the seven naturals of each notation. Accidentals are out until the exercises
  need them; adding one later costs a recording session, so settle the vocabulary before
  anybody records.
- **Conditions** — `silence` is a quiet room. `instrumental` is the one that matters: the
  metronome click of CLE-13 plus an instrument playing, at the level a learner would
  actually have around them.

## Recording

- 16-bit mono PCM WAV at 16 kHz. Anything else is refused by the decoder rather than
  converted — a resampled file is no longer the file whose end of utterance was annotated.
- One word per file, with a little silence after it. The silence is what a streaming
  recogniser needs to decide the word is over, and it is part of what is being measured.
- Name each file `<speaker>-<notation>-<note>-<condition>.wav`, exactly as `axes.json`
  spells them. The name is the only place a recording says which cell it fills. A second
  take of the same cell adds a suffix — `s1-syllabic-do-silence-2.wav` — which is there to
  make the names differ and is not read back.
- Speakers are pseudonyms (`s1`…`s5`). Consent is tracked outside this repository, and no
  name, no email and no voice sample of anyone identifiable belongs in it.

**The first session did not meet the first of those rules.** It was captured on a phone
voice recorder, which writes lossy AAC at 48 kHz stereo, and the files here were converted
down to 16 kHz mono PCM afterwards. The decoder sees what it expects, so nothing fails —
but these recordings carry codec artefacts a direct 16 kHz capture would not, and a track
measured against them is measured through that codec. Re-record in the recorder's lossless
mode when the grid is widened, and do not mix the two in one cell.

## Building the manifest

```sh
bun bench/make-manifest.ts --corpus bench/corpus
```

It hashes each file, proposes where the speaker stops talking, and refuses a grid that is
incomplete or a file that is not named for a cell. A cell recorded more than once is not a
defect.

**Read the proposed offsets before the corpus is used to decide anything.** Every latency
the bench publishes is measured from that number, and the proposal is energy-based: it
will clip a word that trails off into a whisper, and it will run long on a recording with
a door closing in it. It is written once, reviewed once, and frozen — detecting it at
replay time instead would put this detector inside what the bench measures.

## Running the bench

```sh
bun run bench --corpus bench/corpus --track <track>
```

Tracks are declared in `bench/tracks.ts`. The `fixture-*` ones replay `bench/fixture-corpus`
and exist to check the bench itself; they prove nothing about speech.

## Running it on a device

The figures CLE-17 decides on cannot be measured on the host: the point is how the
decoder behaves on the hardware the application runs on. The host run above checks the
bench; this one measures a track.

### 1. Put the model in place

The models are not committed — see the footprints below — and they are not downloaded at
run time either, because one of the things being measured is a run with the device in
airplane mode. Download and unpack one next to the application, before the build:

```sh
mkdir -p assets/models
curl -LO https://alphacephei.com/vosk/models/vosk-model-small-fr-0.22.zip
unzip vosk-model-small-fr-0.22.zip -d assets/models
```

`app.json` hands that folder to the native build through the `react-native-vosk` config
plugin. A different model means changing both that list and `MODEL_PATH` in
`src/app/bench.tsx`.

### 2. Build

```sh
npx expo run:ios --configuration Release
npx expo run:android --variant release
```

**Release, not debug.** A development build serves its assets from the Metro server over
HTTP, so the corpus would be fetched over the network and the airplane-mode run would
measure nothing. A release build carries the recordings inside it. Start it with
`EXPO_PUBLIC_SPEECH_BENCH=1` so the bench screen is reachable; nothing in the application
links to it.

### 3. Run and collect

Open the bench screen and replay the corpus. It writes one report per run into the
application's document directory, named after the instant it was produced and never
overwritten — two runs of the same build are what tells a figure apart from a
fluctuation.

- **iOS** — the Files app, under _On My iPhone → Clefsmith_. `UIFileSharingEnabled` is
  what puts it there.
- **Android** — `adb exec-out run-as com.clefsmith.app cat files/<name>.json`.

The report is the same shape as the host one, written by the same function, so the two
and the other track's are comparable line for line.

## Model footprint

Measured here rather than quoted: AlphaCephei publishes only the compressed sizes.

| Model                         | Download | On disk, unpacked      |
| ----------------------------- | -------- | ---------------------- |
| `vosk-model-small-fr-0.22`    | 42.2 MB  | **68.5 MB** (65.3 MiB) |
| `vosk-model-small-en-us-0.15` | 41.2 MB  | **70.9 MB** (67.6 MiB) |

Both are needed for a bench covering both languages, and on Android the unpacked copy sits
next to the compressed one inside the package, so budget for more than one of these
figures per language shipped.

Nothing checks these numbers. Re-measure with `du` after unpacking if the model version
changes.
