import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Pressable, ScrollView, type ScrollViewInstance, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useService } from '@/components/container-provider';
import { briefOf } from '@/components/exercise-route';
import { sessionLife } from '@/components/session-life';
import { Beat } from '@/components/ui/beat';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { Staff } from '@/components/ui/staff';
import { Text } from '@/components/ui/text';
import { TimingMeter } from '@/components/ui/timing-meter';
import {
  BEHIND,
  countLine,
  EARLY,
  expectedLine,
  HINT,
  HUSHED,
  LEAVE,
  LISTENING,
  legendOf,
  offsetLine,
  PAUSE,
  PAUSED,
  paceLine,
  RESTART,
  RESUME,
  REWIND,
  shadeOf,
  shareOf,
  toneOf,
  verdictLine,
  verdictOf,
} from '@/components/wording/exercise';
import { tempoLine } from '@/components/wording/session';
import type { Clef } from '@/domain/notation/clef';
import { type Notation, nameOf } from '@/domain/notation/naming';
import type { Degree } from '@/domain/notation/pitch';
import { beatingOf, beatOf, meterOf } from '@/domain/training/beat';
import {
  answered,
  beaten,
  type Drill,
  drillOf,
  isOver,
  restarted,
  rewound,
  scored,
} from '@/domain/training/drill';
import type { Level } from '@/domain/training/level';
import { type Measures, NOTES_PER_MEASURE } from '@/domain/training/session-settings';
import { SYMBOLS } from '@/infrastructure/symbols';

/** Two measures to a line, which is what the mockup fits across a phone. */
const PER_LINE = NOTES_PER_MEASURE * 2;

/** Smaller than the default: eight notes and a clef have to fit a phone's width. */
const SPACE = 10;

/** What the feedback zone takes, in every one of its three states. */
const ZONE = 168;

const REPORT = '/report';

/**
 * Where the application is, as the session needs to know it.
 *
 * `AppState.currentState` is the starting value rather than `active` assumed: a
 * screen mounted while the application is already on its way out would
 * otherwise start a metronome nobody is in front of.
 */
function useAppState() {
  const [state, setState] = useState(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setState);

    return () => subscription.remove();
  }, []);

  return state;
}

const PARCOURS = '/studies';

export default function ExerciseScreen() {
  const params = useLocalSearchParams<Params>();
  const { clef, level, measures, degrees, tempo, metronome } = params;
  /** The rhythmic mode of the desk: the session is read at the tempo rather than at the learner's pace. */
  const rhythmic = metronome === 'true';
  /** The route is what the parcours decided; it does not change under the screen. */
  const brief = useMemo(
    () => briefOf({ clef, level, measures, degrees }),
    [clef, level, measures, degrees],
  );
  const drawSession = useService(SYMBOLS.usecases.DrawSession);
  const listenForAnswers = useService(SYMBOLS.usecases.ListenForAnswers);
  const getSettings = useService(SYMBOLS.usecases.GetSettings);
  const record = useService(SYMBOLS.usecases.RecordFinishedSession);
  const keepReport = useService(SYMBOLS.usecases.KeepReport);
  const keepTime = useService(SYMBOLS.usecases.KeepTime);
  const playClicks = useService(SYMBOLS.usecases.PlayClicks);
  const [drill, setDrill] = useState<Drill>();
  const [notation, setNotation] = useState<Notation>();
  /**
   * A paused session keeps its notes and lets go of everything that listens or
   * counts: the microphone and the beat are both effects of this flag.
   */
  const [paused, setPaused] = useState(false);
  /** Whether the notes have been dealt — what the beat waits for, rather than the notes themselves. */
  const dealt = drill !== undefined;
  const { beats, listens } = sessionLife({ rhythmic, dealt, paused, appState: useAppState() });

  /**
   * A route that names no session sends the learner back to the parcours.
   *
   * It is reachable: a link typed by hand, a link kept from a version that
   * spelled a parameter differently. Drawing a staff out of it is what used to
   * happen, and the screen died inside the domain rather than here.
   */
  useEffect(() => {
    if (brief === undefined) {
      router.replace(PARCOURS);
    }
  }, [brief]);

  useEffect(() => {
    if (brief !== undefined) {
      setDrill(drillOf(drawSession(brief)));
    }
  }, [drawSession, brief]);

  /**
   * One answer at a time, and the drill decides what it is worth. The port hands
   * over a degree rather than a word: what was heard is CLE-18's problem.
   */
  /**
   * When the beat the note on screen was put there by fell.
   *
   * A ref rather than state: an answer arriving is not a reason to redraw the
   * staff, and it is read as it stands rather than as the last render left it.
   *
   * It is the *latest* beat, not the one the answer belongs to — that one is
   * counted back from the instant the learner started speaking, which is the
   * only thing that says which note they were reading.
   */
  const shownAt = useRef(0);

  const heard = useCallback(
    (degree: Degree, startedAt: number) => {
      setDrill((reading) => {
        if (reading === undefined) {
          return reading;
        }

        if (!rhythmic) {
          return answered(reading, degree);
        }

        /* The beat is handed the instant the utterance started, and works out
           for itself how far back that was: the grid has usually moved on by
           the time a word is understood. */
        return scored(reading, degree, beatingOf(startedAt, shownAt.current, Number(tempo)));
      });
    },
    [rhythmic, tempo],
  );

  /**
   * Under a metronome the beat is what moves the reading on, said or not.
   *
   * It is started once the notes are drawn and not before: a beat counted while
   * the session is still being dealt would be counted against a staff nobody
   * has seen yet.
   */
  useEffect(() => {
    if (!beats) {
      return;
    }

    return keepTime(Number(tempo), (passed, at) => {
      shownAt.current = at;

      if (passed > 0) {
        setDrill((reading) => (reading === undefined ? reading : beaten(reading)));
      }
    });
  }, [beats, keepTime, tempo]);

  /**
   * The beat heard, on the same condition as the beat counted.
   *
   * Its own effect rather than a line in the one above: the clicks are written
   * on the audio clock and the count on the wall clock, so joining them would
   * tie the grid the learner hears to a render.
   */
  useEffect(() => {
    if (!beats) {
      return;
    }

    return playClicks(Number(tempo));
  }, [beats, playClicks, tempo]);

  /**
   * Listening outlives the screen if it is only stopped on the way out: the
   * learner can leave before it has started, and the silence then arrives at a
   * screen that is gone. Left is recorded, and whichever comes second wins.
   */
  useEffect(() => {
    let left = !listens;
    let stop: (() => Promise<void>) | undefined;

    getSettings().then((settings) => {
      setNotation(settings.notation);

      if (left) {
        return;
      }

      listenForAnswers(settings.notation, heard).then((silence) => {
        stop = silence;

        if (left) {
          void silence();
        }
      });
    });

    return () => {
      left = true;
      void stop?.();
    };
  }, [getSettings, listenForAnswers, heard, listens]);

  /**
   * The session is written down once, as it ends, and the learner is handed back
   * to the parcours. The report of what they just read is CLE-41.
   */
  useEffect(() => {
    if (brief === undefined || drill === undefined || !isOver(drill)) {
      return;
    }

    record({ ...brief, review: brief.degrees.length > 0, answers: drill.answers }).then(
      (report) => {
        keepReport(report);
        router.replace({ pathname: REPORT, params });
      },
    );
  }, [drill, record, brief, keepReport, params]);

  if (paused && drill !== undefined) {
    return (
      <Paused
        onLeave={() => router.back()}
        onResume={() => {
          setDrill(rewound(drill));
          setPaused(false);
        }}
      />
    );
  }

  /** Nothing is drawn before the notes are drawn: a staff guessed is someone else's. */
  if (brief === undefined || drill === undefined || notation === undefined) {
    return (
      <Screen>
        <Text variant="caption" tone="muted">
          {LISTENING}
        </Text>
      </Screen>
    );
  }

  const total = drill.notes.length;

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="exercise-quit">
          <Text variant="title" tone="muted">
            ✕
          </Text>
        </Pressable>
        <ProgressBar share={shareOf(drill.at, total)} />
        <Text testID="exercise-count" variant="caption" tone="muted">
          {countLine(drill.at, total)}
        </Text>
      </View>

      <View style={styles.hint}>
        <Text variant="caption" tone="muted">
          {paceLine(rhythmic)}
        </Text>

        {/* The beat and the tempo are one statement, and a reading with no beat
            makes neither: a tempo printed over a free reading is a figure the
            learner is being asked to ignore. */}
        {rhythmic && (
          <View style={styles.beat}>
            <Beat current={beatOf(drill.at)} />
            <Text variant="caption" tone="muted">
              {tempoLine(Number(tempo))}
            </Text>
          </View>
        )}
      </View>

      <Card fills>
        <Reading clef={brief.clef} drill={drill} />
        <Legend rhythmic={rhythmic} />
      </Card>

      <Feedback drill={drill} notation={notation} rewinds={!rhythmic} tempo={Number(tempo)} />

      <View style={styles.actions}>
        <View style={styles.half}>
          <Button
            emphasis="quiet"
            label={PAUSE}
            onPress={() => setPaused(true)}
            testID="exercise-pause"
          />
        </View>
        <View style={styles.half}>
          <Button
            emphasis="quiet"
            label={RESTART}
            onPress={() => setDrill(restarted(drill))}
            testID="exercise-restart"
          />
        </View>
      </View>
    </Screen>
  );
}

/**
 * The screen while nothing is being read.
 *
 * It covers the staff rather than sitting beside it: a paused session that still
 * shows the notes invites the learner to go on reading them, which is the one
 * thing a pause is for stopping.
 */
function Paused({
  onLeave,
  onResume,
}: {
  readonly onLeave: () => void;
  readonly onResume: () => void;
}) {
  return (
    <Screen>
      <View style={styles.pause}>
        <Text variant="display">{PAUSED}</Text>
        <Text tone="muted">{HUSHED}</Text>
        <Button label={RESUME} onPress={onResume} testID="exercise-resume" />
        <Button emphasis="quiet" label={LEAVE} onPress={onLeave} testID="exercise-leave" />
      </View>
    </Screen>
  );
}

/**
 * The whole session, eight notes to a line, each note shaded by what it was worth.
 *
 * All of it rather than the measure in hand: a reader needs to see what is coming
 * to read it in time, and what they have just done to know how it went. The lines
 * behind the learner are held back rather than taken away — they are the shape of
 * the reading so far, and the one being read has to win the eye.
 */
function Reading({ clef, drill }: { readonly clef: Clef; readonly drill: Drill }) {
  const scroller = useRef<ScrollViewInstance>(null);
  const tops = useRef<number[]>([]);
  const lines = linesOf(drill);
  const current = Math.floor(drill.at / PER_LINE);

  useEffect(() => {
    scroller.current?.scrollTo({ y: tops.current[current] ?? 0, animated: true });
  }, [current]);

  return (
    <ScrollView ref={scroller} showsVerticalScrollIndicator={false}>
      {lines.map(({ from, notes }, line) => (
        /* Keyed by where the line starts: two lines can hold the same eight notes. */
        <View
          key={from}
          onLayout={({ nativeEvent }) => {
            tops.current[line] = nativeEvent.layout.y;
          }}
          style={[styles.line, line < current && styles.read]}
        >
          <Staff
            barring={{ every: NOTES_PER_MEASURE, ends: line === lines.length - 1 }}
            clef={clef}
            notes={notes}
            space={SPACE}
          />
        </View>
      ))}
    </ScrollView>
  );
}

/** The session cut into lines, each note carrying the shade the reading gives it. */
function linesOf(drill: Drill) {
  const count = Math.ceil(drill.notes.length / PER_LINE);

  return Array.from({ length: count }, (_, line) => {
    const from = line * PER_LINE;

    return {
      from,
      notes: drill.notes.slice(from, from + PER_LINE).map((pitch, index) => ({
        pitch,
        shade: shadeOf(from + index, drill.at, drill.marks[from + index]),
      })),
    };
  });
}

/**
 * What the colours on the staff mean, under the staff.
 *
 * It sits inside the card rather than beside it: a legend away from what it
 * explains is read once and never again.
 */
function Legend({ rhythmic }: { readonly rhythmic: boolean }) {
  return (
    <View style={styles.legend}>
      {legendOf(rhythmic).map(({ tone, label }) => (
        <View key={label} style={styles.entry}>
          <Text tone={tone} variant="caption">
            ●
          </Text>
          <Text tone="muted" variant="caption">
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * One zone, three states.
 *
 * A screen that stacks them shows an empty box two thirds of the time, and the
 * mockup gives the three the same place on purpose: the learner's eyes do not
 * move between saying a note and being told about it.
 */
function Feedback({
  drill,
  notation,
  rewinds,
  tempo,
}: {
  readonly drill: Drill;
  readonly notation: Notation;
  /** Under a metronome a mistake sends nobody back: the beat keeps the place. */
  readonly rewinds: boolean;
  readonly tempo: number;
}) {
  const verdict = verdictOf(drill.last);

  if (drill.last === undefined) {
    return (
      <View style={styles.feedback}>
        <Text testID="exercise-feedback" variant="title">
          {LISTENING}
        </Text>
        <Text tone="muted" variant="caption">
          {HINT}
        </Text>
      </View>
    );
  }

  const { beating, said, expected } = drill.last;
  const tone = toneOf(verdict);
  const wrong = verdict === 'wrong';

  return (
    <View style={styles.feedback}>
      <Text
        style={wrong ? styles.struck : undefined}
        testID="exercise-feedback"
        tone={tone}
        variant="display"
      >
        {nameOf(said, notation)}
      </Text>
      <Chip label={verdictLine(verdict)} tone={tone} />

      {/* Only where a beat was kept, and only on a note worth measuring: a
          cursor under a wrong note answers a question nobody asked. */}
      {beating !== undefined && (
        <View style={styles.meter}>
          <TimingMeter at={meterOf(beating.offset, tempo)} />
          <View style={styles.ends}>
            <Text tone="muted" variant="caption">
              {EARLY}
            </Text>
            <Text testID="exercise-offset" tone={tone} variant="caption">
              {offsetLine(beating)}
            </Text>
            <Text tone="muted" variant="caption">
              {BEHIND}
            </Text>
          </View>
        </View>
      )}

      {wrong && (
        <>
          <Text>{expectedLine(expected, notation)}</Text>
          {rewinds && (
            <Text variant="caption" tone="muted">
              {REWIND}
            </Text>
          )}
        </>
      )}
    </View>
  );
}

interface Params extends Record<string, string | undefined> {
  readonly clef?: string;
  readonly level?: string;
  readonly measures?: string;
  readonly tempo?: string;
  readonly metronome?: string;
  readonly degrees?: string;
}

const styles = StyleSheet.create((theme) => ({
  header: { alignItems: 'center', flexDirection: 'row', gap: theme.spacing.s },
  beat: { alignItems: 'center', flexDirection: 'row', gap: theme.spacing.s },
  hint: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  /**
   * One height, whatever it holds: a zone that grows with its contents moves the
   * staff above it, and the learner reads a line that has just jumped.
   */
  feedback: {
    alignItems: 'center',
    gap: theme.spacing.xs,
    height: ZONE,
    justifyContent: 'center',
  },
  struck: { textDecorationLine: 'line-through' },
  /** The meter takes the screen's width; the zone around it centres everything else. */
  meter: { alignSelf: 'stretch', gap: theme.spacing.xs },
  ends: { flexDirection: 'row', justifyContent: 'space-between' },
  /** Under the staff and centred on it, the way the mockup sets it. */
  legend: { flexDirection: 'row', gap: theme.spacing.m, justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: theme.spacing.s },
  half: { flex: 1 },
  pause: { flex: 1, gap: theme.spacing.m, justifyContent: 'center' },
  /** A clef reaches below its staff, so two lines set tight overlap. */
  line: { paddingBottom: theme.spacing.s },
  /** Still there, no longer asking to be read. */
  read: { opacity: 0.45 },
  entry: { alignItems: 'center', flexDirection: 'row', gap: theme.spacing.xs },
}));
