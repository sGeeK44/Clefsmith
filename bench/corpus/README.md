# The recorded corpus

What CLE-17 decides is read off this corpus. A track is not compared against another
track — it is compared against these recordings, so the recordings are the measurement
instrument, and changing them changes every figure already published.

`axes.json` declares the grid. `manifest.json` is generated from the files next to it and
is not edited by hand.

## The grid

5 speakers × 14 notes (7 syllabic, 7 letters) × 2 conditions = **140 recordings**.

Every cell is recorded. A missing one fails the bench rather than shrinking the sample,
because a confusion rate over four fifths of a grid is a different number and nothing on
its face says so.

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
  spells them. The name is the only place a recording says which cell it fills.
- Speakers are pseudonyms (`s1`…`s5`). Consent is tracked outside this repository, and no
  name, no email and no voice sample of anyone identifiable belongs in it.

## Building the manifest

```sh
bun bench/make-manifest.ts --corpus bench/corpus
```

It hashes each file, proposes where the speaker stops talking, and refuses a grid that is
incomplete or a file that is not named for a cell.

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
