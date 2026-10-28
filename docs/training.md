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

A level knows nothing about unlocking, mastery or history. That is CLE-15.

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

## What is not here

Checking an answer. An exercise carries its pitch; comparing a recognised word to it
belongs with the port that produces the word.
