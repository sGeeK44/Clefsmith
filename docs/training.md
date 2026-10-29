# Training

What the application asks of a learner: which notes a level draws from, and how a session
of exercises is made. All of it is pure logic in `src/domain`, with no renderer and no
platform in sight — **checked** by the `inner-layers-are-platform-free` rule of
`bun run arch`, a step of `tools/verify`.

## Levels

Six per clef, and **not the same six**. A level is a range of **positions on the staff**,
in half-spaces from the bottom line — the unit `src/domain/notation/clef.ts` counts in.

The mockup calls a level an _étude_ and names each one after a tempo marking. That is the
word on the screen; the domain says level, and the screens translate.

| Level | Treble | Bass  | Brings                      |
| ----- | ------ | ----- | --------------------------- |
| 1     | −2…0   | 0…2   | the first three notes       |
| 2     | −2…2   | 0…4   | two more                    |
| 3     | −2…4   | 0…6   | two more                    |
| 4     | −2…6   | 0…8   | two more                    |
| 5     | −4…10  | −2…10 | the leger lines, both sides |
| 6     | −4…10  | −2…10 | nothing                     |

The two clefs diverge because both walk outwards from **middle C**, and middle C sits one
leger line below the treble staff and one leger line above the bass staff. The treble
starts on it and climbs away; the bass starts on its own bottom line and climbs until it
reaches it, at level 5. Reading the same numbers under both clefs would have put the
beginner on `e4`/`g2` — two notes that share nothing but a staff line.

A level holds every note of the one below it: a learner never stops seeing what they have
already learnt. Level 6 draws from the same notes as level 5 and brings none of its own —
it is the same staff read faster, and the tempo is the caller's business, not the domain's.

The notes a level **brings** are worked out rather than written down: a note is new when
the level below does not draw it. That list is what a screen means by "two new notes",
and it is derived so that the table above stays the only place a level is written down.

A level knows nothing about unlocking or history on its own; what opens one is below.

**Checked** by `bun test`: the pools of level 1 are written out in full, every level is
shown to contain the one below it and to climb, and the extremes of level 5 are laid out
by the engine and counted — two leger lines under the treble staff, one over it.

## Sessions

`sessionOf` draws the pitches of one session from a pool, and **never the same pitch twice
in a row**: a note that has just been answered is answered again without being read.

The draw is not uniform. It is **biased towards the notes the level brings**: a little
under half the time it reaches for those alone, the rest of the time for the whole pool.
Without the bias, a level that adds two notes to a pool of seven shows them barely a
quarter of the time, and the thing being learnt is the thing least practised. The bias
disappears on its own at level 6, which brings nothing.

It takes the pool and the newcomers rather than a level on purpose. Both refusals are
unsatisfiable on inputs no level produces — a pool of one, and a single newcomer that the
previous pitch rules out — so taking a level would have made them unreachable, which is
code defending against a state nothing can produce.

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

The learner picks one, and `syllabic` is what they get until they do. The choice is not a
display preference: it is the vocabulary the speech recogniser will be asked to listen
for, which is why it is settled once and read by everything that names a note.

## Progression

A session that is read at **75 % or better** opens the next level. Four things have to
hold at once: the session was not a review, it reached the mark, it was the level the
learner is on — replaying an easier one opens nothing — and there is a level above it.
The two clefs are two skills and open independently.

The percentage covers the **whole session**, not a window over the last answers. A session
is the unit a learner recognises: they played it, they saw the score at the end, and the
next level either opened or it did not.

The level reached is **written down**, not worked out. A session's accuracy is not kept,
so nothing could recompute it — and a rule that cannot be recomputed is one that has to be
stored.

## Keeping a record

Two records, under two keys: what the learner has **learnt**, and what they have
**chosen**. They are kept apart because they are erased apart — starting the progression
over must not take the vocabulary with it — and each carries its own schema number, so
neither moves when the other does.

Both are written down as JSON in the key-value store Expo ships on top of
SQLite — SQLite rather than a file because the write is atomic, so an app killed halfway
through one leaves the previous record rather than half of the new one. The database sits
in the app's document directory, which an over-the-air update does not touch: it replaces
the JavaScript bundle and nothing else.

What is written carries a **schema number**. Anything that does not match — truncated,
hand-edited, a clef missing, a level outside the six, a mastery key that is not a degree,
a score the rules could never have produced, a schema this version does not know — reads
back as a learner who has never played. Reading a record never throws: losing a practice
history is not worth a crash at every launch, and there is nothing in one to recover.

Schema 1 held a sliding window of the last twenty answers per level, a rule this version
no longer has. Those records are not migrated; they start the learner over. There is no
released build carrying one.

**Checked** by `bun test`, on the halves that do not need a device: the two codecs,
`src/infrastructure/progress-codec.ts` and `src/infrastructure/settings-codec.ts`, and the
key-value slice of `src/infrastructure/progress-store.ts` and
`src/infrastructure/settings-store.ts` — including that neither store touches the other's
key. **Not checked by anything**: that the records survive an over-the-air update. That
needs a published build and an update pushed at it.

## What is not here

Checking an answer. An exercise carries its pitch; comparing a recognised word to it
belongs with the port that produces the word.
