import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useService } from '@/components/container-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Choice, type Option } from '@/components/ui/choice';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { reviewLine, scoreLine, shareLine, toneOf } from '@/components/wording/progress';
import { clefName } from '@/components/wording/study';
import { CLEFS, type Clef } from '@/domain/notation/clef';
import { type Notation, nameOf } from '@/domain/notation/naming';
import { DEGREES, type Degree } from '@/domain/notation/pitch';
import { masteryOf, type Progress, rhythmOf, weakestOf } from '@/domain/training/progress';
import { defaultSessionSettings } from '@/domain/training/session-settings';
import { SYMBOLS } from '@/infrastructure/symbols';

const PICK_CLEF: readonly Option<Clef>[] = CLEFS.map((clef) => ({
  value: clef,
  label: clefName(clef),
}));

/** How many degrees a revision aims at — and, so, how few make the offer meaningless. */
const WEAKEST = 2;

/** The tallest a bar grows, in points: a full score fills it, nothing overflows it. */
const TALLEST = 100;

/** What a score of zero still draws, so that "met and lost" is not "never met". */
const SLIVER = 2;

/**
 * What has been learnt so far, one clef at a time.
 *
 * The two clefs are two histories: switching does not convert anything, it shows
 * the other record. The screen reads the progression and writes nothing.
 */
export default function ProgressScreen() {
  const getProgress = useService(SYMBOLS.usecases.GetProgress);
  const getSettings = useService(SYMBOLS.usecases.GetSettings);
  const [progress, setProgress] = useState<Progress>();
  const [notation, setNotation] = useState<Notation>();
  const [clef, setClef] = useState<Clef>('treble');

  /** Re-read on focus: the progression can be reset from the next tab along. */
  useFocusEffect(
    useCallback(() => {
      getProgress().then(setProgress);
    }, [getProgress]),
  );

  useEffect(() => {
    getSettings().then((settings) => setNotation(settings.notation));
  }, [getSettings]);

  const read = progress !== undefined && notation !== undefined;

  return (
    <Screen>
      <Text variant="display">Progrès</Text>

      {read && (
        <>
          <Choice options={PICK_CLEF} chosen={clef} onChoose={setClef} />

          <Card>
            <Text>Maîtrise par note</Text>

            <View style={styles.bars}>
              {DEGREES.map((degree) => (
                <Bar
                  key={degree}
                  degree={degree}
                  notation={notation}
                  score={masteryOf(progress, clef, degree)}
                />
              ))}
            </View>

            <Review clef={clef} notation={notation} progress={progress} />
          </Card>

          <View style={styles.counts}>
            <Count figure={`${progress.sessions}`} label="Séances terminées" testID="sessions" />
            <Count
              figure={shareLine(rhythmOf(progress))}
              label="Précision rythmique"
              testID="rhythm"
            />
          </View>
        </>
      )}
    </Screen>
  );
}

/**
 * One degree, as tall as it is read well.
 *
 * A degree never met draws no bar at all — that is what tells it apart from a
 * degree that has been met and sits at zero, which keeps a sliver.
 */
function Bar({
  degree,
  notation,
  score,
}: {
  readonly degree: Degree;
  readonly notation: Notation;
  readonly score: number | undefined;
}) {
  return (
    <View style={styles.bar}>
      <Text testID={`mastery-${degree}`} variant="caption" tone={toneOf(score)}>
        {scoreLine(score)}
      </Text>

      <View style={styles.track}>
        {score !== undefined && <View style={[styles.fill, { height: score }]} />}
      </View>

      <Text>{nameOf(degree, notation)}</Text>
    </View>
  );
}

/**
 * The way into a session aimed at what is read worst.
 *
 * It needs two degrees to name, so it stays away until two have been met — "the
 * two weakest" of a single score is not a revision, it is the only thing played.
 * The Progrès tab carries no session panel, so the revision is played with the
 * default settings.
 */
function Review({
  clef,
  notation,
  progress,
}: {
  readonly clef: Clef;
  readonly notation: Notation;
  readonly progress: Progress;
}) {
  const weakest = weakestOf(progress, clef, WEAKEST);

  if (weakest.length < WEAKEST) {
    return null;
  }

  const { tempo, measures, metronome } = defaultSessionSettings();

  return (
    <Button
      emphasis="quiet"
      label={reviewLine(weakest, notation)}
      onPress={() =>
        router.push({
          pathname: '/exercise',
          params: {
            clef,
            level: progress.level[clef],
            tempo,
            measures,
            metronome: String(metronome),
            review: 'true',
            degrees: weakest.join(','),
          },
        })
      }
      testID="review"
    />
  );
}

/** One figure and what it counts. */
function Count({
  figure,
  label,
  testID,
}: {
  readonly figure: string;
  readonly label: string;
  readonly testID: string;
}) {
  return (
    <View style={styles.count}>
      <Card>
        <Text testID={testID} variant="title">
          {figure}
        </Text>
        <Text variant="caption" tone="muted">
          {label}
        </Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  bars: { alignItems: 'flex-end', flexDirection: 'row', gap: theme.spacing.xs },
  bar: { alignItems: 'center', flex: 1, gap: theme.spacing.xs },
  track: { height: TALLEST, justifyContent: 'flex-end', width: '100%' },
  fill: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radii.s,
    minHeight: SLIVER,
    width: '100%',
  },
  counts: { flexDirection: 'row', gap: theme.spacing.s },
  count: { flex: 1 },
}));
