# Training

What the application asks of a learner: which notes a level draws from, and how a session
of exercises is made. All of it is pure logic in `src/domain`, with no renderer and no
platform in sight — **checked** by the `inner-layers-are-platform-free` rule of
`bun run arch`, a step of `tools/verify`.

## Levels

Six per clef, and **not the same six**. A level is a range of **positions on the staff**,
in half-spaces from the bottom line — the unit `src/domain/notation/clef.ts` counts in.

The mockup calls a level an _étude_ and names each one after an Italian marking — the
treble through tempi (Largo … Presto), the bass through dynamics (Pianissimo …
Fortissimo). Two ladders, so a learner who works both clefs can tell at a glance which
parcours they are on. That is the word on the screen; the domain says level, and the
screens translate — the twelve names live in `src/components/wording/study.ts`, and a
test there keeps each ladder in step with `LEVELS`.

What a study **brings** is said the same way a teacher would say it, and worked out from
the position table rather than listed per level: a study that adds nothing is the same
staff read faster, one that reaches off the staff is about leger lines, one that adds
degrees already read an octave down names them as the high ones, and any other names its
notes. The first study is the exception that introduces the staff, leger line and all.

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

Reading one is a **value, not an object**: naming a degree returns a new drill, so a whole
session is a fold over what the learner said. A right answer moves on; a wrong one sends
the reading back to the **start of the measure**, and the notes already read in it are
read again — a measure is the unit a reader re-reads, with or without a metronome keeping
time. Four notes to a measure, and `src/domain/training/session-settings.ts` is the only
place that says so: a session's length and the point a mistake sends you back to are the
same number.

Every attempt is recorded, right or wrong. **Accuracy is counted over attempts, not over
notes**: a measure re-read three times cost what it cost.

An attempt read under a metronome also carries **how it was timed**, and the progression
keeps two running totals of it: how many notes were read to a beat, and how many fell on
one. Two totals rather than a running percentage — a percentage of percentages weighs a
four-measure session as heavily as a sixteen-measure one. A learner who has never played
to a metronome has **no** rhythmic figure rather than nought, the same rule as a degree
never met.

**Checked** by `bun test`: `rhythmOf` is nothing until something is timed, counts notes
rather than sessions, and leaves untimed answers out of both sides of the division.

Chance is a port, `src/core/random.ts`, beside the clock and for the same reason: a
generator that reaches for `Math.random` can be tested for its shape and nothing else.
Its adapter, `src/core/math-random.ts`, arrived with the first real caller — drawing the
notes of a session.

A **revision** narrows the pool to the degrees it aims at and brings nothing: the bias
towards new notes exists to practise what a level adds, and a revision adds nothing. It
goes back over what is already there.

## What a session was worth

A finished session reports its accuracy, the notes to go back over, and the study it
opened. It is worked out from the record the session was played **against**, not from the
one it left behind: whether a level opened is the progression rule replayed and compared,
never a second rule of its own — two rules saying when a level opens diverge the day
either one moves.

At most **three** notes are named, most missed first, ties broken by the order the degrees
climb an octave. More than a handful is not a list to go back over, it is the session
again.

The report of the session just finished is held **in memory** and nowhere else. A report
reopened after the application was relaunched has nothing to show, and that is right: a
report is about the session the learner has just played. Writing it down would be a second
record of a session the progression already counts.

Saying what a session was worth and writing it down are the **same read**: the report is
worked out from the record the session was played against, so it has to be read before the
new one is written.

The screen that shows it **writes nothing**. The exercise has already recorded; a second
writer on the same record would count the session twice. It is replaced rather than
stacked on the exercise, and it replaces itself on the way out: a session that is over,
and a report that has been acted on, are not places to come back to.

**Checked** by `bun test`: `src/domain/training/report.ts`, the sentences put on it in
`src/components/wording/report.ts`, and the slot it waits in. **Not checked by anything**:
that the screen shows the three notes the report names. That needs a renderer.

## Reading one on screen

The staff shows the **measure being read**, not the session: a mistake sends the reading
back to the start of that measure, so the measure is the unit the learner's eye works in.

Saying a note and being told about it happen in the **same place**. Three states — waiting,
right, wrong — share one zone, because a screen that stacks them shows an empty box two
thirds of the time, and because the learner's eyes should not have to move between the two.

The tempo is shown and **not kept**: the first mode has no rhythm to keep, and a number on
screen that does nothing is still what the learner set up.

**Checked** by `bun test`: what the screen says lives in `src/components/wording/exercise.ts`
— the count, the share, and which of the three states an attempt lands in. **Not checked by
anything**: that the staff draws the measure the count names. That needs a renderer.

## Naming a note

Two notations, `syllabic` (`do ré mi fa sol la si`) and `letters` (`C D E F G A B`). A name
carries **no octave** — it is what the answer sounds like, and `b3` and `b4` are both "si".
No accidentals.

The same seven words per notation are the vocabulary the speech corpus was recorded
against. **Checked** by `bench/vocabulary.test.ts`: renaming a degree in the domain turns
it red, because the recordings are named after those words and re-recording is a session
with five speakers.

The table is read **both ways**: naming a degree, and finding the degree a heard word
stands for. One table rather than two, because two diverge the day either moves — and this
one is what the corpus was recorded against, so the drift would stay silent until a learner
said a note the application no longer recognised. A word that is not one of the seven
returns **nothing**: it is not a wrong answer, it is no answer.

The learner picks one, and `syllabic` is what they get until they do. The choice is not a
display preference: it is the vocabulary the speech recogniser will be asked to listen
for, which is why it is settled once and read by everything that names a note.

## Hearing an answer

The exercise asks for a **degree**, never a word: what the microphone heard and how it
became a degree stays on the other side of the port, so nothing above it knows a
recogniser exists.

Two adapters sit over the same native module, on purpose. The one the bench uses is fed
recorded samples so that a run is reproducible; the one the exercise uses lets the native
side open the microphone itself. Folding them together would make the bench carry a mode
it must never take, and the measurement would stop being a measurement.

Only **settled** results are acted on. A partial is the decoder thinking out loud: acting
on one would answer for the learner halfway through a word, and again when they finished
saying it. A settled word that is not one of the seven is no answer at all.

**Permission is read, never remembered.** The operating system holds the verdict, it
changes from the system settings without the application being told, and a copy kept here
would be stale the first time it is read. Reading it puts no question to the learner,
which is what makes it safe on every return to the foreground.

The verdict is **binary**. A refusal that can be asked again and one that cannot lead to
the same place with the same way out, and a permission never asked for is neither yet
behaves like both.

The vocabulary is fixed when listening starts — the decoder compiles a grammar at that
point — so a session hears one notation from start to finish. Changing notation is a new
exercise, which is a new session.

The model is handed to the adapter by the **application root**, which is also the only
place `react-native-vosk` is imported: an adapter that reached for it directly could not
be run by a test.

**Checked** by `bun test`: the adapter against a stand-in for the native module — the
grammar it opens on, the degree it reports, what it refuses, and that it lets go of the
microphone. **Not checked by anything**: that the native module does what the stand-in
says it does. That needs a device, and the bench is what measures it.

**A refused microphone stops a session rather than degrading it.** The voice is the only
way to answer — a note keyboard would contradict the mode — so starting a session without
the permission opens an explanation and the way to the system settings instead.

The explanation **carries the session it stopped**. Granting the permission and coming
back is then the whole of what the learner has to do, and the verdict is re-read when the
application returns to the foreground because that is the only moment it can have changed.

Where starting a session goes is **one function**, not a check on each screen that starts
one: two copies of that rule diverge the day either moves, and the one that moved last is
the one the learner meets. **Checked** by `bun test`:
`src/components/exercise-route.ts`. **Not checked by anything**: that the settings button
opens the settings, and that coming back starts the exercise. Both need a device.

## Progression

A session that is read at **75 % or better** opens the next level. Four things have to
hold at once: the session was not a review, it reached the mark, it was the level the
learner is on — replaying an easier one opens nothing — and there is a level above it.
The two clefs are two skills and open independently.

The percentage covers the **whole session**, not a window over the last answers. A session
is the unit a learner recognises: they played it, they saw the score at the end, and the
next level either opened or it did not.

Where a level sits for a learner — behind them, under them, or ahead of them — is
**worked out** from the level they are on, never stored. A level ahead of them does not
answer.

The level reached is **written down**, not worked out. A session's accuracy is not kept,
so nothing could recompute it — and a rule that cannot be recomputed is one that has to be
stored.

## Where a learner starts

The introduction offers three places to start from — study 1, 3 or 5 — and the middle one
is what is offered before the learner says anything: neither extreme is a good guess, and
the middle is the only answer wrong by the same amount in both directions.

A starting point opens the **treble alone**. The bass is another skill and starts where it
starts. It never lowers what is already open either, which is what makes replaying the
introduction from the settings cost nothing — rather than a rule the screen has to
remember.

**Checked** by `bun test`: `src/usecases/finish-welcome.ts` holds both, and
`src/components/wording/welcome.ts` holds the three offers. **Not checked by anything**:
that the introduction is what opens on a first launch. That needs a device.

## Mastery per degree

How well each of the seven degrees is read, out of a hundred, per clef. Degrees and not
pitches: `b3` and `b4` are both "si", and a learner who hesitates on one hesitates on the
other.

Meeting a degree in a session is worth **two**, however many times it was drawn — a
session that happens to draw "fa" nine times is not nine times the practice — and each
mistake on it costs **four**. The score never leaves 0–100.

A degree never met carries **no score at all**, not a zero. That is what lets a screen say
"not yet" instead of showing a figure nobody earned, and what keeps it out of the weakest
degrees: sending a learner to revise a note they have never seen is not revision.

A targeted revision aims at the **two weakest**, weakest first, ties broken by the order
the degrees climb an octave. It needs two degrees that have been met — below that there is
nothing to name — and, being a review, it opens no level.

**Checked** by `bun test`: the scoring and the ranking live in
`src/domain/training/progress.ts`, and how they are read out loud in
`src/components/wording/progress.ts`. **Not checked by anything**: that the bars on the
Progrès tab are as tall as the scores. That needs a renderer.

## Setting up a session

Three things are chosen before a session and gone with it: the **tempo** (40 to 160 to the
minute, ten at a time, starting at 60), the **length** in measures (4, 8, 12 or 16,
starting at 8), and whether the **metronome** beats. A measure is four notes, so eight
measures is a session of thirty-two exercises.

None of it is written down. They are not preferences — they are how this session is to be
played — and the way to make "not kept between two launches" true is to have nowhere to
keep them, rather than a rule someone has to remember not to break.

Sixty to the minute is the one tempo a learner counts without being taught how. The
metronome starts off: reading notes has no rhythm to keep.

**Checked** by `bun test`: `src/domain/training/session-settings.ts` holds the bounds and
the arithmetic, so they hold wherever a session is started from rather than on the screen
that happens to show them.

## Reading at a tempo

With the metronome on, the session is read **at the tempo rather than at the learner's
pace**: a beat passes, and the reading is on the next note whatever was said. One beat to
a note, four beats to a measure, and the grid is the tempo and nothing else — one beat
lasts `60000 / tempo` milliseconds, and no session ever stores its beats. A stored grid is
a second copy of a number the learner can change, and the two disagree the first time they
do.

Every beat is waited for **from the start of the session**, never one interval after the
last one. A loop that sleeps an interval at a time adds what each beat cost to the next,
and a sixteen-measure session paced that way finishes visibly late.

Under the metronome a named degree is still recorded — accuracy counts it the same way —
but it **moves nothing**, and a wrong one does not send the learner back to the start of
the measure the way reading notes does. The beat owns the position; rewinding under a
metronome that keeps counting would put the two out of step for the rest of the session.
A note nobody named is not a wrong answer either: the beat records nothing, it only moves.

Which of the four beats is passing is shown, not counted out in figures — a number
changing four times a measure at the edge of the staff is read instead of seen.

A note is then worth two things, the note and the moment, and the feedback has **three**
things to say rather than two: right, off the beat, wrong. Off the beat means the right
note at the wrong moment, and it has a colour of its own — a learner shown red for a note
they read correctly learns to distrust red.

**The note comes first.** A wrong note is wrong whenever it was said; the moment is only
judged on a note that was right. And accuracy counts a late right note as right: being
behind the metronome is something to be told, not something to be marked down for, and
the progression is untouched by any of this.

The moment that counts is when the learner **started speaking**, not when the decoder
settled on what they said. The decoder's own latency is subtracted where it is observable
— the first non-empty partial of an utterance, on the other side of the answer port — and
never carried into the verdict: CLE-20 measured 838 ms from the end of an utterance to the
final result, which at sixty to the minute would declare every right note late.

The window is a **share of the beat**, half a beat either side, written in one place. In
milliseconds it would be half a beat at forty to the minute and more than a whole one at a
hundred and sixty — the same number meaning "strict" at one tempo and "anything goes" at
the other.

**Checked** by `bun test`: the grid and the tolerance window are in
`src/domain/training/beat.ts`, what a beat and an answer do to a reading in
`src/domain/training/drill.ts`, the pacing in `src/usecases/keep-time.ts` against a clock
the test moves itself, and the subtraction of the decoder's latency in
`src/infrastructure/vosk-answer-source.ts`.

**Not checked by anything**: that the exercise screen starts the metronome for a rhythmic
session and not for a reading one, that the beat is drawn, and that an answer is judged
against the beat the note on screen was put there by. There is no renderer in
this repository — see _What is not here_.

### What the click is worth

The click is written onto the audio hardware's own timeline, half a second ahead of
itself, and the wall clock only decides when to write the next ones down. So the figure
that matters is not how late JavaScript woke up — it is how far the sound that left the
speaker is from the instant the tempo asked for, after a whole session of them.

Measured on **a Zebra TC52 under Android 13** and on **an iPhone 16 under iOS 26.6.2**, by
recording the device's speaker and dating each click's attack:

| Device     | Asked             | Beats | Runs | Beat measured          | Deviation at the last beat |
| ---------- | ----------------- | ----- | ---- | ---------------------- | -------------------------- |
| Zebra TC52 | 60 to the minute  | 62    | 8    | 1000.010 – 1000.027 ms | **≤ 3 ms**                 |
| Zebra TC52 | 120 to the minute | 64    | 6    | 500.000 – 500.017 ms   | **≤ 2 ms**                 |
| iPhone 16  | 60 to the minute  | 62    | 8    | 999.979 – 999.999 ms   | **≤ 1 ms**                 |
| iPhone 16  | 120 to the minute | 61    | 6    | 499.988 – 499.998 ms   | **≤ 2 ms**                 |

Every run was accepted; none was discarded. The beat is off by some twenty parts per
million — long on the Android, short on the iPhone — which is a constant offset and not an
accumulation: it is the distance between two crystals, the device's and the recorder's,
and it is inside what either is specified to hold. That the sign flips with the device and
not with the tempo is what says so. The dating resolves to a millisecond, so a deviation
reported as 2 ms is a deviation of no more than that.

**The threshold: under 5 ms across a sixteen-measure session**, which is a twentieth of
the tolerance window at the fastest tempo the setup offers. A beat scheduled by a
JavaScript timer instead would be late by several whole beats over the same session, which
is what the audio clock is here to prevent.

**And it stops with the application.** Sent to the background mid-session on the iPhone 16,
the click train ends on its last scheduled beat and the next one never sounds — measured the
same way, by recording the speaker: twelve clicks a second apart, the application left the
foreground 0.57 s after the twelfth, and the beat due a second later is at the room's noise
floor. The lookahead is what makes this worth measuring: a metronome merely left running
would have been heard for another half second at least, and then on forever.

**Not checked by anything.** No test in this repository hears a speaker. The measurement
is a device run, and the figures above are what one produced; re-running it is the only
way to find out that they have changed.

## Keeping a record

Two records, under two keys: what the learner has **learnt**, and what they have
**chosen**. They are kept apart because they are erased apart — starting the progression
over must not take the vocabulary with it — and each carries its own schema number, so
neither moves when the other does.

Whether the learner has seen the **introduction** is kept with what they have chosen, not
with what they have learnt, for the same reason: erasing the practice must not hand them
the introduction back. Resetting the progression writes the record of a learner who
has never played rather than removing the key — the two read back the same, and writing is
the one of them that is atomic — and it never reaches the other record at all. It is marked whether the introduction was played through or passed
over — passing it over is still having seen it.

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

The choices are at schema 2, which added the introduction mark. Schema 1 is not migrated
either — a record carrying it reads in as a new learner — and no released build carries
one.

**Checked** by `bun test`, on the halves that do not need a device: the two codecs,
`src/infrastructure/progress-codec.ts` and `src/infrastructure/settings-codec.ts`, and the
key-value slice of `src/infrastructure/progress-store.ts` and
`src/infrastructure/settings-store.ts` — including that neither store touches the other's
key. **Not checked by anything**: that the records survive an over-the-air update. That
needs a published build and an update pushed at it.

## What is not here

Checking an answer. An exercise carries its pitch; comparing a recognised word to it
belongs with the port that produces the word.
