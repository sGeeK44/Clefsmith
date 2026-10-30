# The recorded corpus

What CLE-17 decides is read off this corpus. A track is not compared against another
track — it is compared against these recordings, so the recordings are the measurement
instrument, and changing them changes every figure already published.

`axes.json` declares the grid. `manifest.json` is generated from the files next to it and
is not edited by hand.

## The grid

`axes.json` currently declares 3 speakers × 7 syllabic notes × 1 condition = **21 cells**,
held by 149 recordings.

That is not the grid this corpus is meant to reach. The target is 5 speakers × 14 notes
(7 syllabic, 7 letters) × 2 conditions = **140 cells**; the axes were narrowed to what the
first recording session actually produced, because a declared cell nobody recorded fails
the bench rather than waiting for it. Widening an axis back is one line in `axes.json` and
one recording session — and the bench will say exactly which cells are missing.

What the first session did not produce, and what it will take:

- **`letters`** — not a single take. Half the note vocabulary.
- **`s4`, `s5`** — two of the five speakers.
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

**No session so far has met the first of those rules.** They were captured on a phone
voice recorder, which writes lossy AAC at 48 kHz stereo, and the files here were converted
down to 16 kHz mono PCM afterwards. The decoder sees what it expects, so nothing fails —
but these recordings carry codec artefacts a direct 16 kHz capture would not, and a track
measured against them is measured through that codec. Re-record in the recorder's lossless
mode when the grid is widened, and do not mix the two in one cell. `s3` was added through
the same lossy path knowingly: its cells are new, so nothing is mixed, and the whole
corpus stays on one codec rather than half on each — which is the comparison that would
have been unreadable.

`s3` was also not recorded one word per file. It is a single take of the scale repeated,
and the cells were cut out of it: the spoken sequence was supplied by the speaker, and
every word was placed in time by aligning that sequence against a local transcription of
the whole take. Words the speaker ran together — a scale sung in one breath — have no
silence after them and are not in the corpus, which is why `s3` holds 64 cells and not the
89 words that were spoken. Cutting a take this way is cheaper than a recording session and
costs nothing in ground truth, because the labels come from the speaker rather than from a
recogniser; what it does cost is the trailing silence, which is the recording's and not
the room's.

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

## The two latencies

The `latency` block times the decoder twice, from the same instant — the annotated end of
the utterance — and the two answer different questions.

- `p95Ms` is when the decoder **settled**: the final result, the transcript the exercise
  acts on. `measured` counts the utterances it produced one for, `unanswered` the rest.
- `firstHeardP95Ms` is when the decoder **first said anything**: the first non-empty
  partial, and only it. Later partials refine the same word and do not move the figure.
  `firstHeard` counts the utterances it emitted one for, `unheard` the rest.

An utterance can settle without ever being heard start, and the other way round, which is
why the two pairs are counted separately rather than sharing one denominator. An unheard
utterance is left out of `firstHeardP95Ms` rather than timed at zero: a partial that never
came is not a partial that came instantly, and averaging it in would flatter the figure.

`p95Ms` and `measured` are untouched by this, so the numbers CLE-20 published stay
comparable line for line.

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

**Keep the screen on for the whole run.** The replay hands over the audio at the rate it
was spoken, which it does on a timer, and Android stops those timers when the application
goes to the background. The run does not fail when the screen turns off — it freezes
where it was and resumes when the screen comes back, which is worse, because a report
still comes out at the end. On a cabled device:

```sh
adb shell svc power stayon true
```

Collecting the report:

- **iOS** — the Files app, under _On My iPhone → Clefsmith_. `UIFileSharingEnabled` is
  what puts it there.
- **Android** — `adb pull /sdcard/Android/data/com.clefsmith.app/files/<name>.json`. The
  screen writes a copy there for exactly this, because `adb run-as` reaches the document
  directory only on a debuggable build and the run above has to be a release one.

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
