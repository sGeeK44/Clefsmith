import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useService } from '@/components/container-provider';
import { exerciseRoute } from '@/components/exercise-route';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import {
  BACK,
  missLine,
  NO_MISTAKE,
  nextLine,
  OPENED,
  playedLine,
  REPLAY,
  RIGHT_NOTES,
  TO_REVIEW,
  verdictLine,
} from '@/components/wording/report';
import { type Notation, nameOf } from '@/domain/notation/naming';
import type { Level } from '@/domain/training/level';
import type { Report } from '@/domain/training/report';
import { SYMBOLS } from '@/infrastructure/symbols';
import type { ReadMicrophoneAccess } from '@/usecases/microphone-access';

const PARCOURS = '/studies';

/**
 * What the session just played was worth.
 *
 * It writes nothing: the exercise has already recorded. A second writer on the
 * same record would count the session twice.
 */
export default function ReportScreen() {
  const setup = useLocalSearchParams<Setup>();
  const recallReport = useService(SYMBOLS.usecases.RecallReport);
  const getSettings = useService(SYMBOLS.usecases.GetSettings);
  const readMicrophoneAccess = useService(SYMBOLS.usecases.ReadMicrophoneAccess);
  const [notation, setNotation] = useState<Notation>();
  const report = recallReport();

  useEffect(() => {
    getSettings().then((settings) => setNotation(settings.notation));
  }, [getSettings]);

  /** Nothing to report: the application was relaunched onto this route. */
  useEffect(() => {
    if (report === undefined) {
      router.replace(PARCOURS);
    }
  }, [report]);

  /** Nothing is drawn until there is something to report and a notation to say it in. */
  if (report === undefined || notation === undefined) {
    return null;
  }

  const { accuracy, missed, opened } = report;

  return (
    <Screen>
      <Text variant="caption" tone="muted">
        {playedLine(report.clef, report.level, report.review, notation)}
      </Text>
      <Text testID="report-verdict" variant="display">
        {verdictLine(accuracy)}
      </Text>

      <Card>
        <Text testID="report-accuracy" variant="display">
          {`${accuracy} %`}
        </Text>
        <Text variant="caption" tone="muted">
          {RIGHT_NOTES}
        </Text>
      </Card>

      <Card>
        <Text variant="caption" tone="muted">
          {missed.length === 0 ? NO_MISTAKE : TO_REVIEW}
        </Text>
        {missed.map((miss) => (
          <Miss key={miss.degree} miss={miss} notation={notation} worst={missed[0]?.times ?? 1} />
        ))}
      </Card>

      {opened !== undefined && <Opened level={opened} />}

      <Button
        label={nextLine(opened)}
        onPress={() => void start(readMicrophoneAccess, setup, opened ?? report.level)}
      />
      <View style={styles.aside}>
        <View style={styles.half}>
          <Button
            emphasis="quiet"
            label={REPLAY}
            onPress={() => void start(readMicrophoneAccess, setup, report.level, setup.degrees)}
          />
        </View>
        <View style={styles.half}>
          <Button emphasis="quiet" label={BACK} onPress={() => router.replace(PARCOURS)} />
        </View>
      </View>
    </Screen>
  );
}

/** One note to go back over, and how far it stands from the worst of them. */
function Miss({
  miss,
  notation,
  worst,
}: {
  readonly miss: Report['missed'][number];
  readonly notation: Notation;
  readonly worst: number;
}) {
  return (
    <View style={styles.miss}>
      <Text testID={`miss-${miss.degree}`}>{nameOf(miss.degree, notation)}</Text>
      <ProgressBar share={miss.times / worst} />
      <Text variant="caption" tone="muted">
        {missLine(miss.times)}
      </Text>
    </View>
  );
}

/**
 * A study just opened, announced rather than raised: it is outlined, not a `Card`.
 * What is new here is pointed at, and nothing on this screen sits above it.
 */
function Opened({ level }: { readonly level: Level }) {
  return (
    <View style={styles.opened} testID="report-opened">
      <Text variant="caption" tone="accent">
        {OPENED}
      </Text>
      <Text>{nextLine(level)}</Text>
    </View>
  );
}

interface Setup extends Record<string, string | undefined> {
  readonly clef?: string;
  readonly tempo?: string;
  readonly measures?: string;
  readonly metronome?: string;
  readonly degrees?: string;
}

/**
 * Another session, on the study asked for. Replacing rather than pushing: a
 * report the learner has acted on is not somewhere to come back to.
 */
async function start(read: ReadMicrophoneAccess, setup: Setup, level: Level, degrees = '') {
  router.replace(exerciseRoute(await read(), { ...setup, level: `${level}`, degrees }));
}

const styles = StyleSheet.create((theme) => ({
  aside: { flexDirection: 'row', gap: theme.spacing.s },
  half: { flex: 1 },
  miss: { alignItems: 'center', flexDirection: 'row', gap: theme.spacing.s },
  opened: {
    borderColor: theme.colors.accent,
    borderRadius: theme.radii.m,
    borderStyle: 'dashed',
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.m,
  },
}));
