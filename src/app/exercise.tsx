import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, type ScrollViewInstance, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useService } from '@/components/container-provider';
import { Beat } from '@/components/ui/beat';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { Staff } from '@/components/ui/staff';
import { Text } from '@/components/ui/text';
import {
  countLine,
  expectedLine,
  HINT,
  LISTENING,
  legendOf,
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
import { beatOf, timingOf } from '@/domain/training/beat';
import { answered, beaten, type Drill, drillOf, isOver, scored } from '@/domain/training/drill';
import type { Level } from '@/domain/training/level';
import { type Measures, NOTES_PER_MEASURE } from '@/domain/training/session-settings';
import { SYMBOLS } from '@/infrastructure/symbols';

/** Two measures to a line, which is what the mockup fits across a phone. */
const PER_LINE = NOTES_PER_MEASURE * 2;

/** Smaller than the default: eight notes and a clef have to fit a phone's width. */
const SPACE = 10;

const REPORT = '/report';

export default function ExerciseScreen() {
  const params = useLocalSearchParams<Params>();
  const { clef, level, measures, degrees, tempo, metronome } = params;
  /** The rhythmic mode of the desk: the session is read at the tempo rather than at the learner's pace. */
  const rhythmic = metronome === 'true';
  /** The route is what the parcours decided; it does not change under the screen. */
  const brief = useMemo(
    () => briefOf(clef, level, measures, degrees),
    [clef, level, measures, degrees],
  );
  const drawSession = useService(SYMBOLS.usecases.DrawSession);
  const listenForAnswers = useService(SYMBOLS.usecases.ListenForAnswers);
  const getSettings = useService(SYMBOLS.usecases.GetSettings);
  const record = useService(SYMBOLS.usecases.RecordFinishedSession);
  const keepReport = useService(SYMBOLS.usecases.KeepReport);
  const keepTime = useService(SYMBOLS.usecases.KeepTime);
  const [drill, setDrill] = useState<Drill>();
  const [notation, setNotation] = useState<Notation>();
  /** Whether the notes have been dealt — what the beat waits for, rather than the notes themselves. */
  const dealt = drill !== undefined;

  useEffect(() => {
    setDrill(drillOf(drawSession(brief)));
  }, [drawSession, brief]);

  /**
   * One answer at a time, and the drill decides what it is worth. The port hands
   * over a degree rather than a word: what was heard is CLE-18's problem.
   */
  /**
   * When the beat the note on screen was put there by fell.
   *
   * A ref rather than state: an answer arriving is not a reason to redraw the
   * staff, and the beat it is judged against must be the one that was passing
   * when the learner spoke rather than the one the next render has moved to.
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

        return scored(reading, degree, timingOf(startedAt, shownAt.current, Number(tempo)));
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
    if (!rhythmic || !dealt) {
      return;
    }

    return keepTime(Number(tempo), (passed, at) => {
      shownAt.current = at;

      if (passed > 0) {
        setDrill((reading) => (reading === undefined ? reading : beaten(reading)));
      }
    });
  }, [rhythmic, dealt, keepTime, tempo]);

  /**
   * Listening outlives the screen if it is only stopped on the way out: the
   * learner can leave before it has started, and the silence then arrives at a
   * screen that is gone. Left is recorded, and whichever comes second wins.
   */
  useEffect(() => {
    let left = false;
    let stop: (() => Promise<void>) | undefined;

    getSettings().then((settings) => {
      setNotation(settings.notation);
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
  }, [getSettings, listenForAnswers, heard]);

  /**
   * The session is written down once, as it ends, and the learner is handed back
   * to the parcours. The report of what they just read is CLE-41.
   */
  useEffect(() => {
    if (drill === undefined || !isOver(drill)) {
      return;
    }

    record({ ...brief, review: brief.degrees.length > 0, answers: drill.answers }).then(
      (report) => {
        keepReport(report);
        router.replace({ pathname: REPORT, params });
      },
    );
  }, [drill, record, brief, keepReport, params]);

  /** Nothing is drawn before the notes are drawn: a staff guessed is someone else's. */
  if (drill === undefined || notation === undefined) {
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
          {HINT}
        </Text>
        <Text variant="caption" tone="muted">
          {tempoLine(Number(tempo))}
        </Text>
      </View>

      {rhythmic && <Beat current={beatOf(drill.at)} />}

      <Card fills>
        <Reading clef={brief.clef} drill={drill} />
        <Legend rhythmic={rhythmic} />
      </Card>

      <Feedback drill={drill} notation={notation} rewinds={!rhythmic} />
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
      {lines.map((notes, line) => (
        <View
          key={notes.map(({ pitch }) => `${pitch.degree}${pitch.octave}`).join('-')}
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

  return Array.from({ length: count }, (_, line) =>
    drill.notes.slice(line * PER_LINE, (line + 1) * PER_LINE).map((pitch, index) => ({
      pitch,
      shade: shadeOf(line * PER_LINE + index, drill.at, drill.marks[line * PER_LINE + index]),
    })),
  );
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
}: {
  readonly drill: Drill;
  readonly notation: Notation;
  /** Under a metronome a mistake sends nobody back: the beat keeps the place. */
  readonly rewinds: boolean;
}) {
  const verdict = verdictOf(drill.last);

  if (drill.last === undefined) {
    return (
      <View style={styles.feedback}>
        <Text testID="exercise-feedback" variant="title">
          {LISTENING}
        </Text>
      </View>
    );
  }

  const { said, expected } = drill.last;
  const tone = toneOf(verdict);

  return (
    <View style={styles.feedback}>
      <Text testID="exercise-feedback" variant="display" tone={tone}>
        {nameOf(said, notation)}
      </Text>
      <Text variant="caption" tone={tone}>
        {verdictLine(verdict)}
      </Text>

      {verdict === 'wrong' && (
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

/**
 * The route hands over strings. They are read back into what the session needs,
 * and nothing checks them: a route string is checked by nothing in this repository.
 */
function briefOf(clef = '', level = '', measures = '', degrees = '') {
  return {
    clef: clef as Clef,
    level: Number(level) as Level,
    measures: Number(measures) as Measures,
    degrees: degrees.split(',').filter(Boolean) as Degree[],
  };
}

const styles = StyleSheet.create((theme) => ({
  header: { alignItems: 'center', flexDirection: 'row', gap: theme.spacing.s },
  hint: { flexDirection: 'row', justifyContent: 'space-between' },
  feedback: { alignItems: 'center', gap: theme.spacing.xs, paddingVertical: theme.spacing.l },
  legend: { flexDirection: 'row', gap: theme.spacing.m },
  /** A clef reaches below its staff, so two lines set tight overlap. */
  line: { paddingBottom: theme.spacing.s },
  /** Still there, no longer asking to be read. */
  read: { opacity: 0.45 },
  entry: { alignItems: 'center', flexDirection: 'row', gap: theme.spacing.xs },
}));
