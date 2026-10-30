import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useService } from '@/components/container-provider';
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
  REWIND,
  RIGHT,
  shareOf,
  verdictOf,
  WRONG,
} from '@/components/wording/exercise';
import { tempoLine } from '@/components/wording/session';
import type { Clef } from '@/domain/notation/clef';
import { type Notation, nameOf } from '@/domain/notation/naming';
import type { Degree } from '@/domain/notation/pitch';
import { answered, type Drill, drillOf, isOver } from '@/domain/training/drill';
import type { Level } from '@/domain/training/level';
import type { Measures } from '@/domain/training/session-settings';
import { SYMBOLS } from '@/infrastructure/symbols';

/** The measure the learner is in, which is as much of the session as is drawn at once. */
const SHOWN = 4;

const REPORT = '/report';

export default function ExerciseScreen() {
  const params = useLocalSearchParams<Params>();
  const { clef, level, measures, degrees, tempo } = params;
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
  const [drill, setDrill] = useState<Drill>();
  const [notation, setNotation] = useState<Notation>();

  useEffect(() => {
    setDrill(drillOf(drawSession(brief)));
  }, [drawSession, brief]);

  /**
   * One answer at a time, and the drill decides what it is worth. The port hands
   * over a degree rather than a word: what was heard is CLE-18's problem.
   */
  const heard = useCallback((degree: Degree) => {
    setDrill((reading) => (reading === undefined ? reading : answered(reading, degree)));
  }, []);

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

      <Card>
        <Staff clef={brief.clef} notes={readingOf(drill)} />
      </Card>

      <Feedback drill={drill} notation={notation} />
    </Screen>
  );
}

/** The measure being read, the note in it marked — a line at a time, as the mockup draws it. */
function readingOf(drill: Drill) {
  const from = Math.floor(drill.at / SHOWN) * SHOWN;

  return drill.notes
    .slice(from, from + SHOWN)
    .map((pitch, index) => ({ pitch, current: from + index === drill.at }));
}

/**
 * One zone, three states.
 *
 * A screen that stacks them shows an empty box two thirds of the time, and the
 * mockup gives the three the same place on purpose: the learner's eyes do not
 * move between saying a note and being told about it.
 */
function Feedback({ drill, notation }: { readonly drill: Drill; readonly notation: Notation }) {
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

  return (
    <View style={styles.feedback}>
      <Text testID="exercise-feedback" variant="display" tone={verdict === 'right' ? 'ok' : 'bad'}>
        {nameOf(said, notation)}
      </Text>
      <Text variant="caption" tone={verdict === 'right' ? 'ok' : 'bad'}>
        {verdict === 'right' ? RIGHT : WRONG}
      </Text>

      {verdict === 'wrong' && (
        <>
          <Text>{expectedLine(expected, notation)}</Text>
          <Text variant="caption" tone="muted">
            {REWIND}
          </Text>
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
}));
