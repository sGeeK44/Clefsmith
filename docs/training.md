# Training

What the application asks of a learner: which notes a level draws from, and how a session
of exercises is made. All of it is pure logic in `src/domain`, with no renderer and no
platform in sight — **checked** by the `inner-layers-are-platform-free` rule of
`bun run arch`, a step of `tools/verify`.

## Levels

Six, the same six for both clefs. A level is a set of **positions on the staff**, in
half-spaces from the bottom line — the unit `src/domain/notation/clef.ts` counts in. The
clef turns a position into a pitch, which is why level 1 in bass is the same five numbers
as level 1 in treble, and why adding a level is one line of a table.

| Level | Positions     | What it is                  |
| ----- | ------------- | --------------------------- |
| 1     | 0, 2, 4, 6, 8 | the staff lines             |
| 2     | 1, 3, 5, 7    | the spaces                  |
| 3     | 0…8           | the whole staff             |
| 4     | −2…10         | one leger line on each side |
| 5     | −4…12         | two on each side            |
| 6     | −6…14         | three on each side          |

Level 4 is the anchor, and it is not a guess: it is the range the previous application
shipped as its default, treble `C4–B5` and bass `D2–C4`. Below it the staff is being
learnt; above it, left.

A level knows nothing about unlocking or history on its own; what opens one is below.

**Checked** by `bun test`: the pools are written out in full, each level from 3 up contains
the one below it, and the extremes of level 6 lay out with exactly three leger lines —
compared against the engine rather than against a constant.

## Sessions

`sessionOf` draws the pitches of one session from a pool, uniformly, and **never the same
pitch twice in a row**: a note that has just been answered is answered again without being
read.

It takes a pool rather than a level on purpose. The no-repeat rule is unsatisfiable on a
pool of one, and no level is that small — taking a level would have made the refusal
unreachable, which is code defending against a state nothing can produce.

The session length is the caller's decision, not the domain's.

Chance is a port, `src/core/random.ts`, beside the clock and for the same reason: a
generator that reaches for `Math.random` can be tested for its shape and nothing else.
The adapter arrives with the first real caller.

## Naming a note

Two notations, `syllabic` (`do ré mi fa sol la si`) and `letters` (`C D E F G A B`). A name
carries **no octave** — it is what the answer sounds like, and `b3` and `b4` are both "si".
No accidentals.

The same seven words per notation are the vocabulary the speech corpus was recorded
against. **Checked** by `bench/vocabulary.test.ts`: renaming a degree in the domain turns
it red, because the recordings are named after those words and re-recording is a session
with five speakers.

## Progression

A level is **held**, for one clef, when the **last 20 answers** to it count **at most 2
mistakes**. A window that is not yet full is never held: an average over three answers
lets a lucky run through.

The window slides and forgets. Twenty mistakes followed by twenty right answers hold the
level — a learner who has worked through a bad start should not carry it, and a cumulative
ratio becomes unreachable after one.

The highest level a learner may play is the **first one they do not hold**: level 1 for
someone who has never played, level 6 once they hold them all. The two clefs are two
skills and open independently.

**Nothing derivable is written down.** A record holds the latest answers per clef and per
level, and the number of finished sessions; whether a level is held and how far the learner
has got are computed on every read. A stored `unlocked` flag and the answers that produced
it drift apart, and nothing notices.

**Checked** by `bun test`: the rules live in `src/domain/training/progress.ts` and are
tested through the domain, with no store and no screen.

## Keeping a record

A record is written down as JSON under one key of the key-value store Expo ships on top of
SQLite — SQLite rather than a file because the write is atomic, so an app killed halfway
through one leaves the previous record rather than half of the new one. The database sits
in the app's document directory, which an over-the-air update does not touch: it replaces
the JavaScript bundle and nothing else.

What is written carries a **schema number**. Anything that does not match — truncated,
hand-edited, a clef or a level missing, an answer that is not a boolean, a window longer
than the rule judges on, a schema this version does not know — reads back as a learner who
has never played. Reading a record never throws: losing a practice history is not worth a
crash at every launch, and there is nothing in one to recover.

**Checked** by `bun test`, on the two halves that do not need a device:
`src/infrastructure/progress-codec.ts` and the key-value slice of
`src/infrastructure/progress-store.ts`. **Not checked by anything**: that the record
survives an over-the-air update. That needs a published build and an update pushed at it.

## What is not here

Checking an answer. An exercise carries its pitch; comparing a recognised word to it
belongs with the port that produces the word.
